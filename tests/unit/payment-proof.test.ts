import { describe, expect, it } from "vitest";
import { paymentProofExtensionFromBytes } from "../../src/features/checkout/payment-proof";

describe("payment proof validation", () => {
  it.each([
    [[0xff, 0xd8, 0xff, 0xe0], "image/jpeg", "jpg"],
    [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], "image/png", "png"],
    [[0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50], "image/webp", "webp"],
  ])("accepts a real %s signature", async (bytes, type, extension) => {
    expect(
      paymentProofExtensionFromBytes(
        type as string,
        (bytes as number[]).length,
        new Uint8Array(bytes as number[]),
      ),
    ).toBe(extension);
  });

  it("rejects a file whose declared image type does not match its bytes", async () => {
    const bytes = new Uint8Array([
      0x3c, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74,
    ]);
    expect(
      paymentProofExtensionFromBytes("image/jpeg", bytes.length, bytes),
    ).toBeNull();
  });
});
