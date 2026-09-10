export const appRoles = [
  "customer",
  "support",
  "warehouse",
  "content_editor",
  "product_manager",
  "analyst",
  "admin",
  "super_admin",
] as const;

export type AppRole = (typeof appRoles)[number];

export const adminDashboardRoles = ["admin", "super_admin"] as const;

export function hasRequiredRole(
  actual: readonly AppRole[],
  required: readonly AppRole[],
) {
  return required.some((role) => actual.includes(role));
}

export function canAccessAdminDashboard(actual: readonly AppRole[]) {
  return hasRequiredRole(actual, adminDashboardRoles);
}
