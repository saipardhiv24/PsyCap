import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Supabase URL and service role key are required in the backend environment.",
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
});

async function getPortfolio(userId) {
  const { data, error } = await supabase
    .from("portfolios")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error) throw error;
  return data;
}

async function getHoldings(userId) {
  const { data, error } = await supabase
    .from("holdings")
    .select("*")
    .eq("user_id", userId)
    .order("symbol", { ascending: true });
  if (error) throw error;
  return data;
}

async function getTransactions(userId) {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

async function getWatchlist(userId) {
  const { data, error } = await supabase
    .from("watchlist")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) throw error;
  return data;
}

async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function insertWatchlist(userId, symbol, company_name) {
  const { data, error } = await supabase
    .from("watchlist")
    .insert([{ user_id: userId, symbol, company_name }]);
  if (error) throw error;
  return data;
}

async function removeWatchlist(userId, symbol) {
  const { error } = await supabase
    .from("watchlist")
    .delete()
    .eq("user_id", userId)
    .eq("symbol", symbol);
  if (error) throw error;
  return true;
}

async function getLeaderboard(limit = 20) {
  const { data, error } = await supabase
    .from("profiles")
    .select(`id, username, portfolios (cash_balance)`)
    .limit(limit);
  if (error) throw error;
  return data;
}

async function executeBuy(
  userId,
  symbol,
  company_name,
  quantity,
  price,
  totalValue,
) {
  const { data, error } = await supabase.rpc("execute_buy", {
    user_uuid: userId,
    p_symbol: symbol,
    p_company_name: company_name,
    p_quantity: quantity,
    p_price: price,
    p_total_value: totalValue,
  });
  if (error) throw error;
  return data;
}

async function executeSell(userId, symbol, quantity, price, totalValue) {
  const { data, error } = await supabase.rpc("execute_sell", {
    user_uuid: userId,
    p_symbol: symbol,
    p_quantity: quantity,
    p_price: price,
    p_total_value: totalValue,
  });
  if (error) throw error;
  return data;
}

export default {
  getPortfolio,
  getHoldings,
  getTransactions,
  getWatchlist,
  getProfile,
  updateProfile,
  insertWatchlist,
  removeWatchlist,
  getLeaderboard,
  executeBuy,
  executeSell,
};
