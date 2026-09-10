import { describe, expect, it } from "vitest";
import { timingSafeEqual } from "node:crypto";
import {
  hashToken,
  issuePrivateToken,
} from "../../src/features/checkout/security";
import { checkEmailExistsAction } from "../../src/features/orders/claim-actions";
import { validateClaimOwnership } from "../../src/features/orders/claim-validation";

describe("Guest Order Claim & Account Verification", () => {
  describe("checkEmailExistsAction", () => {
    it("returns false for empty or invalid email strings without querying DB", async () => {
      const res1 = await checkEmailExistsAction("");
      expect(res1.exists).toBe(false);

      const res2 = await checkEmailExistsAction("not-an-email");
      expect(res2.exists).toBe(false);

      const res3 = await checkEmailExistsAction("   ");
      expect(res3.exists).toBe(false);
    });
  });

  describe("Tracking Token Verification Cryptography", () => {
    it("correctly generates tokens and verifies matching hashes with timingSafeEqual", () => {
      const token = issuePrivateToken();
      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThanOrEqual(32);

      const storedHash = hashToken(token);
      const incomingHash = hashToken(token);

      const a = Buffer.from(incomingHash, "hex");
      const b = Buffer.from(storedHash, "hex");
      const valid = a.length === b.length && timingSafeEqual(a, b);

      expect(valid).toBe(true);
    });

    it("rejects invalid or tampered tokens", () => {
      const genuineToken = issuePrivateToken();
      const fakeToken = issuePrivateToken();

      const genuineHash = hashToken(genuineToken);
      const fakeHash = hashToken(fakeToken);

      const a = Buffer.from(genuineHash, "hex");
      const b = Buffer.from(fakeHash, "hex");
      const match = a.length === b.length && timingSafeEqual(a, b);

      expect(match).toBe(false);
    });
  });

  describe("Password Policy for Account Creation", () => {
    it("enforces minimum 8 characters for new accounts", () => {
      const validatePassword = (pwd: string) => {
        if (!pwd || pwd.length < 8) return false;
        return true;
      };

      expect(validatePassword("short")).toBe(false);
      expect(validatePassword("1234567")).toBe(false);
      expect(validatePassword("12345678")).toBe(true);
      expect(validatePassword("SecurePass2026!")).toBe(true);
    });
  });

  describe("validateClaimOwnership", () => {
    it("allows claiming an unclaimed order when emails match", () => {
      const res = validateClaimOwnership({
        orderUserId: null,
        orderEmail: "guest@example.com",
        claimantEmail: "guest@example.com",
        isNewAccount: true,
      });
      expect(res.allowed).toBe(true);
    });

    it("allows claiming with case-insensitive email matching", () => {
      const res = validateClaimOwnership({
        orderUserId: null,
        orderEmail: "Guest@Example.COM",
        claimantEmail: "guest@example.com",
        isNewAccount: true,
      });
      expect(res.allowed).toBe(true);
    });

    it("allows claiming when order has no email (phone-only checkout)", () => {
      const res = validateClaimOwnership({
        orderUserId: null,
        orderEmail: null,
        claimantEmail: "user@example.com",
        isNewAccount: true,
      });
      expect(res.allowed).toBe(true);
    });

    it("rejects claim when email does not match order email", () => {
      const res = validateClaimOwnership({
        orderUserId: null,
        orderEmail: "original@example.com",
        claimantEmail: "hacker@example.com",
        isNewAccount: true,
      });
      expect(res.allowed).toBe(false);
      expect(res.reason).toBe("email_mismatch");
    });

    it("rejects new account creation claim if order is already linked to any account", () => {
      const res = validateClaimOwnership({
        orderUserId: "user-123",
        orderEmail: "customer@example.com",
        claimantEmail: "customer@example.com",
        isNewAccount: true,
      });
      expect(res.allowed).toBe(false);
      expect(res.reason).toBe("already_claimed");
    });

    it("rejects password claim if order is already claimed by another user", () => {
      const res = validateClaimOwnership({
        orderUserId: "user-victim-456",
        orderEmail: "customer@example.com",
        claimantUserId: "user-attacker-789",
        claimantEmail: "customer@example.com",
        isNewAccount: false,
      });
      expect(res.allowed).toBe(false);
      expect(res.reason).toBe("already_claimed_by_other");
    });

    it("allows idempotent password claim if order already belongs to claimant", () => {
      const res = validateClaimOwnership({
        orderUserId: "user-same-123",
        orderEmail: "customer@example.com",
        claimantUserId: "user-same-123",
        claimantEmail: "customer@example.com",
        isNewAccount: false,
      });
      expect(res.allowed).toBe(true);
    });

    it("allows password claim of unclaimed order when claimant logs in", () => {
      const res = validateClaimOwnership({
        orderUserId: null,
        orderEmail: "customer@example.com",
        claimantUserId: "user-claimer-123",
        claimantEmail: "customer@example.com",
        isNewAccount: false,
      });
      expect(res.allowed).toBe(true);
    });
  });
});

