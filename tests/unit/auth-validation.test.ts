import { describe, expect, it } from "vitest";
import {
  forgotPasswordSchema,
  safeAuthNext,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from "../../src/features/auth/validation";

describe("authentication validation", () => {
  it("accepts normalized sign-in and recovery input", () => {
    expect(
      signInSchema.parse({
        locale: "en",
        email: "  customer@example.com ",
        password: "secret",
      }).email,
    ).toBe("customer@example.com");

    expect(
      forgotPasswordSchema.safeParse({
        locale: "ar",
        email: "customer@example.com",
      }).success,
    ).toBe(true);
  });

  it("rejects weak or mismatched account passwords", () => {
    expect(
      signUpSchema.safeParse({
        locale: "en",
        fullName: "NOVA Customer",
        email: "customer@example.com",
        password: "short",
        confirmPassword: "short",
      }).success,
    ).toBe(false);

    expect(
      updatePasswordSchema.safeParse({
        locale: "en",
        password: "long-enough-password",
        confirmPassword: "different-password",
      }).success,
    ).toBe(false);
  });
});

describe("authentication callback redirects", () => {
  it("allows only account routes in the selected locale", () => {
    expect(safeAuthNext("/en/account", "en")).toBe("/en/account");
    expect(safeAuthNext("/ar/account/update-password", "ar")).toBe(
      "/ar/account/update-password",
    );
  });

  it.each([
    "https://attacker.example",
    "//attacker.example",
    "/en/shop",
    "/ar/account",
    "/en/account\\redirect",
  ])("rejects an unsafe destination: %s", (next) => {
    expect(safeAuthNext(next, "en")).toBe("/en/account");
  });
});
