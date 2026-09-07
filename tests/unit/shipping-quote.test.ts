import { describe, expect, it } from "vitest";
import { calculateShippingQuote } from "../../src/features/shipping/types";

const zone = {
  id: 1,
  code: "cairo",
  nameEn: "Cairo",
  nameAr: "القاهرة",
  shippingFeeMinor: 6000,
  freeShippingThresholdMinor: 250000,
  codEnabled: true,
  codSurchargeMinor: 1000,
  deliveryMinDays: 1,
  deliveryMaxDays: 3,
};

describe("shipping quotes", () => {
  it("adds the configured delivery fee", () => {
    expect(calculateShippingQuote(100000, "instapay", zone)).toMatchObject({
      baseMinor: 6000,
      discountMinor: 0,
      shippingMinor: 6000,
      totalMinor: 106000,
    });
  });

  it("waives base delivery after the threshold but preserves the COD surcharge", () => {
    expect(calculateShippingQuote(250000, "cod", zone)).toEqual({
      baseMinor: 6000,
      discountMinor: 6000,
      codSurchargeMinor: 1000,
      shippingMinor: 1000,
      totalMinor: 251000,
      freeShippingApplied: true,
    });
  });

  it("requires an active location before quoting", () => {
    expect(calculateShippingQuote(100000, "cod", null)).toBeNull();
  });
});
