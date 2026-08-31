-- PsyCap database schema for Supabase/PostgreSQL

-- Profiles table linked to Supabase auth users
create table if not exists profiles (
  id uuid primary key,
  username text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_username on profiles(username);

-- Portfolios table
create table if not exists portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  cash_balance numeric not null default 100000 check (cash_balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_portfolios_user_id on portfolios(user_id);

-- Holdings table
create table if not exists holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  symbol text not null,
  company_name text not null,
  quantity numeric not null check (quantity > 0),
  average_buy_price numeric not null check (average_buy_price > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, symbol)
);

create index if not exists idx_holdings_user_symbol on holdings(user_id, symbol);
create index if not exists idx_holdings_user_id on holdings(user_id);

-- Transactions table
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  symbol text not null,
  transaction_type text not null check (transaction_type in ('BUY', 'SELL')),
  quantity numeric not null check (quantity > 0),
  price numeric not null check (price > 0),
  total_value numeric not null check (total_value >= 0),
  realized_profit_loss numeric not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_transactions_user_id on transactions(user_id);
create index if not exists idx_transactions_symbol on transactions(symbol);
create index if not exists idx_transactions_created_at on transactions(created_at desc);
create index if not exists idx_transactions_type on transactions(transaction_type);

-- Watchlist table
create table if not exists watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  symbol text not null,
  company_name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, symbol)
);

create index if not exists idx_watchlist_user_id on watchlist(user_id);
create index if not exists idx_watchlist_symbol on watchlist(symbol);

-- Trigger helper to update portfolio updated_at
create function update_portfolio_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_portfolio_updated_at
  before update on portfolios
  for each row execute function update_portfolio_updated_at();

-- Trigger helper to update holdings updated_at
create function update_holdings_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_holdings_updated_at
  before update on holdings
  for each row execute function update_holdings_updated_at();

-- Create Supabase auth user initialization trigger
create function public.handle_new_auth_user() returns trigger language plpgsql security definer as $$
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Enable row level security for tables
alter table profiles enable row level security;
alter table portfolios enable row level security;
alter table holdings enable row level security;
alter table transactions enable row level security;
alter table watchlist enable row level security;

-- Example policies: allow authenticated user access to own records
create policy "Profiles are visible to owner" on profiles
  for select using (auth.uid() = id);
create policy "Portfolios are visible to owner" on portfolios
  for select using (auth.uid() = user_id);
create policy "Holdings are visible to owner" on holdings
  for select using (auth.uid() = user_id);
create policy "Transactions are visible to owner" on transactions
  for select using (auth.uid() = user_id);
create policy "Watchlist is visible to owner" on watchlist
  for select using (auth.uid() = user_id);

-- Allow insert for own watchlist, holdings, transactions, profiles via service role only
create policy "Allow authenticated insert on watchlist" on watchlist
  for insert with check (auth.role() = 'service_role' or auth.uid() = user_id);

create policy "Allow authenticated insert on transactions" on transactions
  for insert with check (auth.role() = 'service_role' or auth.uid() = user_id);

create policy "Allow authenticated insert on holdings" on holdings
  for insert with check (auth.role() = 'service_role' or auth.uid() = user_id);

create policy "Allow authenticated insert on portfolios" on portfolios
  for insert with check (auth.role() = 'service_role' or auth.uid() = user_id);

-- Atomic buy/sell operations
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
