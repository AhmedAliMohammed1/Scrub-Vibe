import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { getPaymobConfigurationStatus } from "../../src/features/checkout/paymob-config";
import { verifyPaymobHmac } from "../../src/features/checkout/paymob-webhook";

describe("Paymob readiness", () => {
  it("stays disabled until the callback secret and public app URL are present", () => {
    const status = getPaymobConfigurationStatus({
      PAYMOB_SECRET_KEY: "secret",
      PAYMOB_PUBLIC_KEY: "public",
      PAYMOB_INTEGRATION_ID: "123",
      PAYMOB_HMAC_SECRET: undefined,
      PAYMOB_ENABLED: undefined,
      NEXT_PUBLIC_APP_URL: undefined,
    });
    expect(status.configured).toBe(false);
    expect(status.missing).toEqual([
      "PAYMOB_ENABLED",
      "PAYMOB_HMAC_SECRET",
      "NEXT_PUBLIC_APP_URL",
    ]);
  });

  it("accepts a complete configuration with multiple integration IDs", () => {
    expect(
      getPaymobConfigurationStatus({
        PAYMOB_SECRET_KEY: "secret",
        PAYMOB_PUBLIC_KEY: "public",
        PAYMOB_INTEGRATION_ID: "123, 456",
        PAYMOB_HMAC_SECRET: "hmac",
        PAYMOB_ENABLED: "true",
        NEXT_PUBLIC_APP_URL: "https://scrub-vibe-tau.vercel.app",
      }).configured,
    ).toBe(true);
  });

  it("verifies the signed transaction fields with SHA-512", () => {
    const payload = {
      amount_cents: 85000,
      created_at: "2026-09-08T00:00:00Z",
      currency: "EGP",
      error_occured: false,
      has_parent_transaction: false,
      id: 42,
      integration_id: 123,
      is_3d_secure: true,
      is_auth: false,
      is_capture: false,
      is_refunded: false,
      is_standalone_payment: true,
      is_voided: false,
      order: { id: 99 },
      owner: 7,
      pending: false,
      source_data: { pan: "1234", sub_type: "MasterCard", type: "card" },
      success: true,
    };
    const concatenated =
      "85000" +
      "2026-09-08T00:00:00Z" +
      "EGP" +
      "false" +
      "false" +
      "42" +
      "123" +
      "true" +
      "false" +
      "false" +
      "false" +
      "true" +
      "false" +
      "99" +
      "7" +
      "false" +
      "1234" +
      "MasterCard" +
      "card" +
      "true";
    const hmac = createHmac("sha512", "test-secret")
      .update(concatenated)
      .digest("hex");

    expect(verifyPaymobHmac(payload, hmac, "test-secret")).toBe(true);
    expect(
      verifyPaymobHmac(payload, "0".repeat(128), "test-secret"),
    ).toBe(false);
  });
});
