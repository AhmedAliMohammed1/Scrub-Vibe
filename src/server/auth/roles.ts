import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  canAccessAdminDashboard,
  hasRequiredRole,
  type AppRole,
} from "./policy";

export { appRoles, hasRequiredRole, type AppRole } from "./policy";

export type ViewerAccess =
  | { isAuthenticated: false; canAccessAdmin: false }
  | { isAuthenticated: true; canAccessAdmin: boolean };

const guestAccess: ViewerAccess = {
  isAuthenticated: false,
  canAccessAdmin: false,
};

export async function getViewerAccess(): Promise<ViewerAccess> {
  try {
    const supabase = await createClient();
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();
    const userId = claimsData?.claims?.sub;

    if (claimsError || !userId) return guestAccess;

    const { data: roleRows, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (rolesError) {
      console.error("[auth] Unable to load viewer roles", rolesError);
      return { isAuthenticated: true, canAccessAdmin: false };
    }

    return {
      isAuthenticated: true,
      canAccessAdmin: canAccessAdminDashboard(
        roleRows.map(({ role }) => role as AppRole),
      ),
    };
  } catch (error) {
    console.error("[auth] Unable to resolve viewer access", error);
    return guestAccess;
  }
}

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
