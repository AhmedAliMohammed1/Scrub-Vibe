import { describe, expect, it } from "vitest";
import {
  canAccessAdminDashboard,
  hasRequiredRole,
} from "../../src/server/auth/policy";

describe("role authorization", () => {
  it("requires at least one explicitly allowed role", () => {
    expect(hasRequiredRole(["analyst"], ["analyst", "admin"])).toBe(true);
    expect(hasRequiredRole(["customer"], ["admin", "super_admin"])).toBe(false);
  });

  it("does not treat authentication as administration", () => {
    expect(hasRequiredRole(["customer"], ["product_manager"])).toBe(false);
  });

  it("shows the admin dashboard only to admin roles", () => {
    expect(canAccessAdminDashboard([])).toBe(false);
    expect(canAccessAdminDashboard(["customer"])).toBe(false);
    expect(canAccessAdminDashboard(["support"])).toBe(false);
    expect(canAccessAdminDashboard(["product_manager"])).toBe(false);
    expect(canAccessAdminDashboard(["admin"])).toBe(true);
    expect(canAccessAdminDashboard(["super_admin"])).toBe(true);
  });
});
