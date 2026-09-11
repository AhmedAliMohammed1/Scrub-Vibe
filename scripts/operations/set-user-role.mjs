import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

// Load .env.local if present
try {
  const envContent = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of envContent.split(/\r?\n/)) {
    const idx = line.indexOf("=");
    if (idx !== -1 && !line.startsWith("#")) {
      const key = line.slice(0, idx).trim();
      let val = line.slice(idx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
} catch {
  // Ignore if .env.local is absent and env vars are already in environment
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY.");
  process.exit(1);
}

const email = process.argv[2]?.trim().toLowerCase();
const role = process.argv[3]?.trim().toLowerCase() || "super_admin";

const allowedRoles = [
  "customer",
  "support",
  "warehouse",
  "content_editor",
  "product_manager",
  "analyst",
  "admin",
  "super_admin",
];

if (!email) {
  console.log(`
Usage:
  node scripts/operations/set-user-role.mjs <email> [role]

Available roles:
  ${allowedRoles.join(", ")}

Example:
  node scripts/operations/set-user-role.mjs admin@example.com super_admin
`);
  process.exit(0);
}

if (!allowedRoles.includes(role)) {
  console.error(`Invalid role "${role}". Allowed roles: ${allowedRoles.join(", ")}`);
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  // Find user by email in profiles
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .eq("email", email)
    .maybeSingle();

  if (profileErr) {
    console.error("Error finding user profile:", profileErr);
    process.exit(1);
  }

  let userId = profile?.id;

  // Fallback to auth.admin if profile not found
  if (!userId) {
    const { data: authUsers, error: authErr } = await supabase.auth.admin.listUsers();
    if (authErr) {
      console.error("Error listing auth users:", authErr);
      process.exit(1);
    }
    const match = authUsers.users.find((u) => u.email?.toLowerCase() === email);
    if (!match) {
      console.error(`No user found with email: ${email}`);
      console.log("Please register or create the user first in the storefront or Supabase dashboard.");
      process.exit(1);
    }
    userId = match.id;
  }

  // Grant role in user_roles
  const { error: insertErr } = await supabase.from("user_roles").upsert(
    {
      user_id: userId,
      role,
    },
    { onConflict: "user_id,role" },
  );

  if (insertErr) {
    console.error("Failed to grant role:", insertErr);
    process.exit(1);
  }

  // Fetch updated roles for this user
  const { data: allRoles } = await supabase
    .from("user_roles")
    .select("role, granted_at")
    .eq("user_id", userId);

  console.log(`\nSuccessfully granted role "${role}" to user:`);
  console.log(`  Email: ${email}`);
  console.log(`  User ID: ${userId}`);
  console.log(`  Current active roles: ${allRoles?.map((r) => r.role).join(", ")}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
