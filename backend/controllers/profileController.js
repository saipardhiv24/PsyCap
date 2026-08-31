import supabaseService from "../services/supabaseService.js";

export async function getProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const profile = await supabaseService.getProfile(userId);
    res.json({ success: true, data: { profile } });
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const updates = {};
    if (req.body.username) {
      updates.username = String(req.body.username).trim();
    }
    if (!Object.keys(updates).length) {
      return res
        .status(400)
        .json({
          success: false,
          error: { message: "No profile fields provided" },
        });
    }
    const profile = await supabaseService.updateProfile(userId, updates);
    res.json({ success: true, data: { profile } });
  } catch (error) {
    next(error);
  }
}
