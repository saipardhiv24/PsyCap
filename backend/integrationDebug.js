import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env" });

async function main() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false },
    },
  );

  console.log("AUTH_METHODS", {
    signInWithPassword: typeof supabase.auth.signInWithPassword,
    adminListUsers: typeof supabase.auth.admin.listUsers,
    adminCreateUser: typeof supabase.auth.admin.createUser,
  });

  const email = `psycap-test-${Date.now()}@example.com`;
  const password = "Test1234!";

  try {
    const result = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    console.log("CREATE_USER_RESULT", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("CREATE_USER_THROWN", error.message || error);
  }

  try {
    const list = await supabase.auth.admin.listUsers();
    console.log("LIST_USERS_RESULT", JSON.stringify(list, null, 2));
  } catch (error) {
    console.error("LIST_USERS_THROWN", error.message || error);
  }
}

main().catch((e) => {
  console.error("UNHANDLED", e.message || e);
  process.exit(1);
});
