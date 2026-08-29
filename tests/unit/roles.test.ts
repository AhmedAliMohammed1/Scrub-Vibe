import { describe, expect, it } from "vitest";
import { hasRequiredRole } from "../../src/server/auth/policy";

describe("role authorization", () => {
  it("requires at least one explicitly allowed role", () => {
    expect(hasRequiredRole(["analyst"], ["analyst", "admin"])).toBe(true);
    expect(hasRequiredRole(["customer"], ["admin", "super_admin"])).toBe(false);
  });

  it("does not treat authentication as administration", () => {
    expect(hasRequiredRole(["customer"], ["product_manager"])).toBe(false);
  });
});
