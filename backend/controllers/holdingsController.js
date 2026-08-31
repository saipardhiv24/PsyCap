import supabaseService from "../services/supabaseService.js";

export async function getHoldings(req, res, next) {
  try {
    const userId = req.user.id;
    const holdings = await supabaseService.getHoldings(userId);
    res.json({ success: true, data: { holdings } });
  } catch (error) {
    next(error);
  }
}
