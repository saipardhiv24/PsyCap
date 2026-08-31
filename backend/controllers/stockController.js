import marketDataService from "../services/marketDataService.js";
import supabaseService from "../services/supabaseService.js";

export async function getPopularStocks(req, res, next) {
  try {
    const stocks = await marketDataService.getPopularStocks();
    res.json({ success: true, data: { stocks } });
  } catch (error) {
    next(error);
  }
}

export async function searchStocks(req, res, next) {
  try {
    const query = String(req.query.q || "").trim();
    const symbols = await marketDataService.searchStocks(query);
    const quotes = await marketDataService.getMultipleQuotes(
      symbols.map((item) => item.symbol),
    );
    const stocks = symbols.map((item) => ({
      symbol: item.symbol,
      name: item.name,
      quote: quotes[item.symbol] || null,
    }));
    res.json({ success: true, data: { stocks } });
  } catch (error) {
    next(error);
  }
}

export async function getStockDetail(req, res, next) {
  try {
    const symbol = String(req.params.symbol).toUpperCase();
    const quote = await marketDataService.getQuote(symbol);
    res.json({ success: true, data: { symbol, quote } });
  } catch (error) {
    next(error);
  }
}

export async function getStockHistory(req, res, next) {
  try {
    const symbol = String(req.params.symbol).toUpperCase();
    const range = String(req.query.range || "1M");
    const history = await marketDataService.getHistoricalData(symbol, range);
    res.json({ success: true, data: { symbol, range, history } });
  } catch (error) {
    next(error);
  }
}
