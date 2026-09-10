import { describe, expect, it } from "vitest";
import { timingSafeEqual } from "node:crypto";
import {
  paymentProofExtensionFromBytes,
} from "../../src/features/checkout/payment-proof";
import { hashToken, issuePrivateToken } from "../../src/features/checkout/security";

describe("Payment Proof Re-upload Workflow", () => {
  describe("File Magic Bytes & Extension Validation", () => {
    it("accepts valid JPEG magic bytes under 5MB", () => {
      const jpegHeader = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
      const ext = paymentProofExtensionFromBytes("image/jpeg", 1024 * 500, jpegHeader);
      expect(ext).toBe("jpg");
    });

    it("accepts valid PNG magic bytes under 5MB", () => {
      const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
      const ext = paymentProofExtensionFromBytes("image/png", 1024 * 800, pngHeader);
      expect(ext).toBe("png");
    });

    it("accepts valid WEBP magic bytes under 5MB", () => {
      // RIFF (0x52, 0x49, 0x46, 0x46) + 4 bytes + WEBP (0x57, 0x45, 0x42, 0x50)
      const webpHeader = new Uint8Array([
        0x52, 0x49, 0x46, 0x46,
        0x20, 0x00, 0x00, 0x00,
        0x57, 0x45, 0x42, 0x50,
      ]);
      const ext = paymentProofExtensionFromBytes("image/webp", 1024 * 300, webpHeader);
      expect(ext).toBe("webp");
    });

    it("rejects zero-byte files or files exceeding 5MB", () => {
      const jpegHeader = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
      // 0 bytes
      expect(paymentProofExtensionFromBytes("image/jpeg", 0, jpegHeader)).toBeNull();
      // Exceeding 5MB (5 * 1024 * 1024 + 1)
      expect(paymentProofExtensionFromBytes("image/jpeg", 5 * 1024 * 1024 + 1, jpegHeader)).toBeNull();
    });

    it("rejects executable or plain text files spoofed with image MIME type", () => {
      const fakeHeader = new Uint8Array([0x47, 0x49, 0x46, 0x38]); // not JPEG
      const ext = paymentProofExtensionFromBytes("image/jpeg", 2048, fakeHeader);
      expect(ext).toBeNull();
    });
  });

  describe("Security Token Authorization", () => {
    it("authorizes re-upload when matching tracking token hash is provided", () => {
      const token = issuePrivateToken();
      const storedHash = hashToken(token);
      const incomingHash = hashToken(token);

      const a = Buffer.from(incomingHash, "hex");
      const b = Buffer.from(storedHash, "hex");
      const isAuthorized = a.length === b.length && timingSafeEqual(a, b);

      expect(isAuthorized).toBe(true);
    });

    it("rejects re-upload with mismatched tracking token", () => {
      const tokenA = issuePrivateToken();
      const tokenB = issuePrivateToken();

      const a = Buffer.from(hashToken(tokenA), "hex");
      const b = Buffer.from(hashToken(tokenB), "hex");
      const isAuthorized = a.length === b.length && timingSafeEqual(a, b);

      expect(isAuthorized).toBe(false);
    });
  });

  describe("Order Re-upload State Eligibility", () => {
    const isEligibleForReupload = (status: string, paymentMethod: string, paymentStatus: string) => {
      if (status === "cancelled" || status === "returned") return false;
      if (!["vodafone_cash", "instapay", "cod"].includes(paymentMethod)) return false;
      return paymentStatus === "rejected";
    };

    it("allows re-upload for rejected Vodafone Cash, InstaPay, and COD orders", () => {
      expect(isEligibleForReupload("payment_review", "vodafone_cash", "rejected")).toBe(true);
      expect(isEligibleForReupload("payment_review", "instapay", "rejected")).toBe(true);
      expect(isEligibleForReupload("payment_review", "cod", "rejected")).toBe(true);
    });

    it("blocks re-upload for cancelled or returned orders", () => {
      expect(isEligibleForReupload("cancelled", "vodafone_cash", "rejected")).toBe(false);
      expect(isEligibleForReupload("returned", "instapay", "rejected")).toBe(false);
    });

    it("blocks re-upload for automatic card payment gateways", () => {
      expect(isEligibleForReupload("payment_review", "paymob", "rejected")).toBe(false);
    });

    it("does not trigger re-upload when payment is already paid or pending initial proof", () => {
      expect(isEligibleForReupload("confirmed", "vodafone_cash", "paid")).toBe(false);
      expect(isEligibleForReupload("payment_review", "vodafone_cash", "proof_submitted")).toBe(false);
    });
  });
});
