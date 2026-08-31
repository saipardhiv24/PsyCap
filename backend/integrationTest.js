import dotenv from "dotenv";
import axios from "axios";
import { createClient } from "@supabase/supabase-js";
import marketDataService from "./services/marketDataService.js";

dotenv.config({ path: ".env" });

async function main() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  console.log("CHECK: STARTING");

  const { data: connData, error: connError } = await supabase
    .from("profiles")
    .select("id")
    .limit(1);
  if (connError) {
    console.error("SUPABASE_CONNECTION_FAIL", connError.message);
    process.exit(1);
  }
  console.log("SUPABASE_CONNECTION_OK");

  try {
    const quote = await marketDataService.getQuote("AAPL");
    if (!quote || quote.price == null) {
      console.error("TDF_QUOTE_FAIL", JSON.stringify(quote));
      process.exit(1);
    }
    console.log("TDF_QUOTE_OK");
  } catch (err) {
    console.error("TDF_QUOTE_ERROR", err.message || err);
    process.exit(1);
  }

  const email = `psycap-integration-${Date.now()}@example.com`;
  const password = "Test1234!";
  const { data: createData, error: createError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
  if (createError) {
    console.error("CREATE_USER_FAIL", createError.message);
    process.exit(1);
  }
  console.log("CREATE_USER_OK");

  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({ email, password });
  if (signInError || !signInData?.session?.access_token) {
    console.error(
      "SIGNIN_FAIL",
      signInError?.message || JSON.stringify(signInData),
    );
    process.exit(1);
  }
  console.log("SIGNIN_OK");
  const token = signInData.session.access_token;

  const api = axios.create({
    baseURL: "http://localhost:5003/api",
    headers: { Authorization: `Bearer ${token}` },
  });

  const portfolioBefore = await api.get("/portfolio");
  console.log("PORTFOLIO_BEFORE", portfolioBefore.data.success ? "OK" : "FAIL");

  const buyResult = await api.post("/trades/buy", {
    symbol: "AAPL",
    quantity: 1,
    company_name: "Apple Inc.",
  });
  if (!buyResult.data.success) {
    console.error("BUY_FAIL", JSON.stringify(buyResult.data));
    process.exit(1);
  }
  console.log("BUY_OK");

  const portfolioAfterBuy = await api.get("/portfolio");
  console.log(
    "PORTFOLIO_AFTER_BUY",
    portfolioAfterBuy.data.success ? "OK" : "FAIL",
  );

  const holdingsAfterBuy = await api.get("/holdings");
  console.log(
    "HOLDINGS_AFTER_BUY",
    holdingsAfterBuy.data.success ? "OK" : "FAIL",
  );

  const transactionsAfterBuy = await api.get("/transactions");
  console.log(
    "TRANSACTIONS_AFTER_BUY",
    transactionsAfterBuy.data.success ? "OK" : "FAIL",
  );

  const sellResult = await api.post("/trades/sell", {
    symbol: "AAPL",
    quantity: 1,
  });
  if (!sellResult.data.success) {
    console.error("SELL_FAIL", JSON.stringify(sellResult.data));
    process.exit(1);
  }
  console.log("SELL_OK");

  const portfolioAfterSell = await api.get("/portfolio");
  console.log(
    "PORTFOLIO_AFTER_SELL",
    portfolioAfterSell.data.success ? "OK" : "FAIL",
  );

  const transactionsAfterSell = await api.get("/transactions");
  console.log(
    "TRANSACTIONS_AFTER_SELL",
    transactionsAfterSell.data.success ? "OK" : "FAIL",
  );

  const insufficientCash = await api
    .post("/trades/buy", { symbol: "AAPL", quantity: 100000000 })
    .catch((err) => err.response?.data || { error: err.message });
  console.log(
    "INSUFFICIENT_CASH",
    insufficientCash?.success === false ? "OK" : "FAIL",
  );

  const insufficientShares = await api
    .post("/trades/sell", { symbol: "AAPL", quantity: 999999999 })
    .catch((err) => err.response?.data || { error: err.message });
  console.log(
    "INSUFFICIENT_SHARES",
    insufficientShares?.success === false ? "OK" : "FAIL",
  );

  const invalidQuantity = await api
    .post("/trades/buy", { symbol: "AAPL", quantity: 0 })
    .catch((err) => err.response?.data || { error: err.message });
  console.log(
    "INVALID_QUANTITY",
    invalidQuantity?.success === false ? "OK" : "FAIL",
  );

  console.log("TESTS_DONE");
}

main().catch((err) => {
  console.error("UNEXPECTED_ERROR", err.message || err);
  process.exit(1);
});
