import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Supabase URL and service role key must be set for backend auth.",
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
  },
});

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({
        success: false,
        error: { message: "Missing or invalid authorization header" },
      });
  }

  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) {
    return res
      .status(401)
      .json({
        success: false,
        error: { message: "Missing authentication token" },
      });
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    return res
      .status(401)
      .json({
        success: false,
        error: { message: "Invalid or expired session" },
      });
  }

  req.user = { id: data.user.id, email: data.user.email };
  next();
}
