import supabaseService from "../services/supabaseService.js";

export async function getTransactions(req, res, next) {
  try {
    const userId = req.user.id;
    const transactions = await supabaseService.getTransactions(userId);
    res.json({ success: true, data: { transactions } });
  } catch (error) {
    next(error);
  }
}
