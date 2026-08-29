import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasRequiredRole, type AppRole } from "./policy";

export { appRoles, hasRequiredRole, type AppRole } from "./policy";

export async function requireUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) redirect("/en/account");
  return { supabase, userId };
}

export async function requireRoles(required: readonly AppRole[]) {
  const { supabase, userId } = await requireUser();
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (error) throw new Error("Unable to verify authorization.");
  const actual = data.map(({ role }) => role as AppRole);
  if (!hasRequiredRole(actual, required)) redirect("/en");
  return { supabase, userId, roles: actual };
}
