-- Migration: Harden RPCs and auth trigger
-- Date: 2026-08-09
-- Purpose:
-- 1) Make trigger and RPCs use safe search_path and security definer
-- 2) Compute total_value server-side
-- 3) Enforce service_role-only RPC invocation
-- 4) Consistent lock ordering (portfolio then holdings)
-- 5) Make trigger idempotent
-- Apply this in Supabase SQL Editor (do NOT expose secrets). Run as a project SQL migration.

BEGIN;

-- =========================
-- handle_new_auth_user
-- =========================
create or replace function public.handle_new_auth_user() returns trigger language plpgsql security definer as $$
begin
  perform pg_catalog.set_config('search_path', 'public, pg_temp', true);

  -- Create profile and portfolio only if they don't already exist (idempotent)
  insert into profiles (id, username)
    values (new.id, split_part(new.email, '@', 1))
    on conflict (id) do nothing;

  insert into portfolios (user_id, cash_balance)
    values (new.id, 100000)
    on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Ensure trigger ownership is correct (adjust owner if needed)
-- You can change 'postgres' to your admin DB role if different
alter function public.handle_new_auth_user() owner to postgres;

-- =========================
-- execute_buy
-- =========================
create or replace function public.execute_buy(
  user_uuid uuid,
  p_symbol text,
  p_company_name text,
  p_quantity numeric,
  p_price numeric,
  p_total_value numeric
) returns jsonb language plpgsql security definer as $$
declare
  current_cash numeric;
  existing_quantity numeric;
  existing_avg_price numeric;
  new_quantity numeric;
  new_avg_price numeric;
  computed_total numeric := coalesce(p_quantity * p_price, 0);
begin
  -- Use a safe search_path for security
  perform pg_catalog.set_config('search_path', 'public, pg_temp', true);

  -- Ensure only the service role may call this RPC
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Permission denied: must be called with service_role';
  end if;

  if p_quantity <= 0 then
    raise exception 'Quantity must be greater than zero';
  end if;
  if p_price <= 0 then
    raise exception 'Price must be greater than zero';
  end if;

  -- Calculate authoritative total value server-side to avoid trusting client input
  if computed_total <= 0 then
    raise exception 'Computed total value must be greater than zero';
  end if;

  -- Lock portfolio first, then holdings to keep consistent lock ordering
  select cash_balance into current_cash from portfolios where user_id = user_uuid for update;
  if not found then
    raise exception 'Portfolio not found';
  end if;
  if current_cash < computed_total then
    raise exception 'Insufficient virtual cash';
  end if;

  update portfolios
  set cash_balance = cash_balance - computed_total,
      updated_at = now()
  where user_id = user_uuid;

  select quantity, average_buy_price into existing_quantity, existing_avg_price
  from holdings
  where user_id = user_uuid and symbol = p_symbol
  for update;

  if found then
    new_quantity := existing_quantity + p_quantity;
    new_avg_price := ((existing_quantity * existing_avg_price) + (p_quantity * p_price)) / new_quantity;
    update holdings
    set quantity = new_quantity,
        average_buy_price = new_avg_price,
        company_name = p_company_name,
        updated_at = now()
    where user_id = user_uuid and symbol = p_symbol;
  else
    insert into holdings (user_id, symbol, company_name, quantity, average_buy_price)
    values (user_uuid, p_symbol, p_company_name, p_quantity, p_price);
  end if;

  insert into transactions (user_id, symbol, transaction_type, quantity, price, total_value, realized_profit_loss)
  values (user_uuid, p_symbol, 'BUY', p_quantity, p_price, computed_total, 0);

  return jsonb_build_object('status', 'ok');
end;
$$;

-- =========================
-- execute_sell
-- =========================
create or replace function public.execute_sell(
  user_uuid uuid,
  p_symbol text,
  p_quantity numeric,
  p_price numeric,
  p_total_value numeric
) returns jsonb language plpgsql security definer as $$
declare
  existing_quantity numeric;
  existing_avg_price numeric;
  remaining_quantity numeric;
  realized numeric;
  computed_total numeric := coalesce(p_quantity * p_price, 0);
  current_cash numeric;
begin
  -- Use a safe search_path for security
  perform pg_catalog.set_config('search_path', 'public, pg_temp', true);

  -- Ensure only the service role may call this RPC
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Permission denied: must be called with service_role';
  end if;

  if p_quantity <= 0 then
    raise exception 'Quantity must be greater than zero';
  end if;
  if p_price <= 0 then
    raise exception 'Price must be greater than zero';
  end if;

  if computed_total <= 0 then
    raise exception 'Computed total value must be greater than zero';
  end if;

  -- Lock portfolio first, then holdings to avoid lock order inversion with execute_buy
  select cash_balance into current_cash from portfolios where user_id = user_uuid for update;
  if not found then
    raise exception 'Portfolio not found';
  end if;

  select quantity, average_buy_price into existing_quantity, existing_avg_price
  from holdings
  where user_id = user_uuid and symbol = p_symbol
  for update;
  if not found then
    raise exception 'No holdings found for this symbol';
  end if;
  if existing_quantity < p_quantity then
    raise exception 'Insufficient shares to sell';
  end if;

  remaining_quantity := existing_quantity - p_quantity;
  realized := (p_price - existing_avg_price) * p_quantity;

  if remaining_quantity > 0 then
    update holdings
    set quantity = remaining_quantity,
        updated_at = now()
    where user_id = user_uuid and symbol = p_symbol;
  else
    delete from holdings
    where user_id = user_uuid and symbol = p_symbol;
  end if;

  update portfolios
  set cash_balance = cash_balance + computed_total,
      updated_at = now()
  where user_id = user_uuid;

  insert into transactions (user_id, symbol, transaction_type, quantity, price, total_value, realized_profit_loss)
  values (user_uuid, p_symbol, 'SELL', p_quantity, p_price, computed_total, realized);

  return jsonb_build_object('status', 'ok', 'realized_profit_loss', realized);
end;
$$;

-- =========================
-- REVOKE/GRANT EXECUTE
-- =========================
-- Revoke public execute and grant only to postgres and service_role (if it exists)
revoke execute on function public.execute_buy(uuid, text, text, numeric, numeric, numeric) from public;
revoke execute on function public.execute_sell(uuid, text, numeric, numeric, numeric) from public;

-- Also attempt to revoke from anon/authenticated roles if present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE EXECUTE ON FUNCTION public.execute_buy(uuid, text, text, numeric, numeric, numeric) FROM anon;
    REVOKE EXECUTE ON FUNCTION public.execute_sell(uuid, text, numeric, numeric, numeric) FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE EXECUTE ON FUNCTION public.execute_buy(uuid, text, text, numeric, numeric, numeric) FROM authenticated;
    REVOKE EXECUTE ON FUNCTION public.execute_sell(uuid, text, numeric, numeric, numeric) FROM authenticated;
  END IF;
END
$$;

-- Grant execute minimally to postgres (owner) and to service_role if present
grant execute on function public.execute_buy(uuid, text, text, numeric, numeric, numeric) to postgres;
grant execute on function public.execute_sell(uuid, text, numeric, numeric, numeric) to postgres;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT EXECUTE ON FUNCTION public.execute_buy(uuid, text, text, numeric, numeric, numeric) TO service_role;
    GRANT EXECUTE ON FUNCTION public.execute_sell(uuid, text, numeric, numeric, numeric) TO service_role;
  END IF;
END
$$;

-- Also ensure ownership of RPCs is set to postgres (or change if your admin role differs)
alter function public.execute_buy(uuid, text, text, numeric, numeric, numeric) owner to postgres;
alter function public.execute_sell(uuid, text, numeric, numeric, numeric) owner to postgres;

COMMIT;

-- End of migration
