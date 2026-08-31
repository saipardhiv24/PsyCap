import supabaseService from "../services/supabaseService.js";

export async function getWatchlist(req, res, next) {
  try {
    const userId = req.user.id;
    const items = await supabaseService.getWatchlist(userId);
    res.json({ success: true, data: { watchlist: items } });
  } catch (error) {
    next(error);
  }
}

export async function addWatchlistItem(req, res, next) {
  try {
    const userId = req.user.id;
    const symbol = String(req.body.symbol || "").toUpperCase();
    const company_name = String(req.body.company_name || symbol);

    if (!symbol) {
      return res
        .status(400)
        .json({ success: false, error: { message: "Symbol is required" } });
    }

    const item = await supabaseService.insertWatchlist(
      userId,
      symbol,
      company_name,
    );
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    if (error?.message?.includes("duplicate key") || error?.code === "23505") {
      return res
        .status(409)
        .json({
          success: false,
          error: { message: "This stock is already in your watchlist" },
        });
    }
    next(error);
  }
}

export async function removeWatchlistItem(req, res, next) {
  try {
    const userId = req.user.id;
    const symbol = String(req.params.symbol || "").toUpperCase();
    await supabaseService.removeWatchlist(userId, symbol);
    res.json({ success: true, data: { symbol } });
  } catch (error) {
    next(error);
  }
}
