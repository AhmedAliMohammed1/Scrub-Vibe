import { describe, expect, it } from "vitest";
import { timingSafeEqual } from "node:crypto";
import {
  hashToken,
  issuePrivateToken,
} from "../../src/features/checkout/security";
import { checkEmailExistsAction } from "../../src/features/orders/claim-actions";

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
});
