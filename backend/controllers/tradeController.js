import marketDataService from "../services/marketDataService.js";
import supabaseService from "../services/supabaseService.js";

function ensurePositiveNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw Object.assign(new Error("Quantity must be a positive number"), {
      status: 400,
    });
  }
  return number;
}

export async function buyStock(req, res, next) {
  try {
    const userId = req.user.id;
    const symbol = String(req.body.symbol || "").toUpperCase();
    const quantity = ensurePositiveNumber(req.body.quantity);
    const company_name = String(req.body.company_name || symbol);

    if (!symbol) {
      return res
        .status(400)
        .json({
          success: false,
          error: { message: "Stock symbol is required" },
        });
    }

    const quote = await marketDataService.getQuote(symbol);
    if (!quote || !quote.price) {
      throw Object.assign(
        new Error("Unable to retrieve current market price"),
        { status: 502 },
      );
    }

    const price = Number(quote.price);
    const totalValue = Number((price * quantity).toFixed(2));
    if (totalValue <= 0) {
      return res
        .status(400)
        .json({ success: false, error: { message: "Invalid trade amount" } });
    }

    const result = await supabaseService.executeBuy(
      userId,
      symbol,
      company_name,
      quantity,
      price,
      totalValue,
    );
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function sellStock(req, res, next) {
  try {
    const userId = req.user.id;
    const symbol = String(req.body.symbol || "").toUpperCase();
    const quantity = ensurePositiveNumber(req.body.quantity);

    if (!symbol) {
      return res
        .status(400)
        .json({
          success: false,
          error: { message: "Stock symbol is required" },
        });
    }

    const quote = await marketDataService.getQuote(symbol);
    if (!quote || !quote.price) {
      throw Object.assign(
        new Error("Unable to retrieve current market price"),
        { status: 502 },
      );
    }

    const price = Number(quote.price);
    const totalValue = Number((price * quantity).toFixed(2));
    if (totalValue <= 0) {
      return res
        .status(400)
        .json({ success: false, error: { message: "Invalid trade amount" } });
    }

    const result = await supabaseService.executeSell(
      userId,
      symbol,
      quantity,
      price,
      totalValue,
    );
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
