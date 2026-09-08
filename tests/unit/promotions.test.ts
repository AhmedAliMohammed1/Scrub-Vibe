import { describe, expect, it } from "vitest";
import { mapDiscountPreview, normalizeDiscountCode } from "../../src/features/promotions/types";
import { campaignFormSchema, discountCodeFormSchema, discountPreviewSchema } from "../../src/features/promotions/validation";

describe("promotion validation", () => {
  it("normalizes customer codes and validates a preview request", () => {
    expect(normalizeDiscountCode("  scrub 10 ")).toBe("SCRUB10");
    const result = discountPreviewSchema.parse({
      code: " scrub10 ", paymentMethod: "instapay",
      items: [{ variantId: "42", quantity: 2 }],
    });
    expect(result.code).toBe("SCRUB10");
  });

  it("rejects unsafe codes and percentages over 100", () => {
    expect(discountPreviewSchema.safeParse({ code: "bad code!", paymentMethod: "cod", items: [{ variantId: "1", quantity: 1 }] }).success).toBe(false);
    expect(discountCodeFormSchema.safeParse({
      campaignId: "", code: "TOOMUCH", discountType: "percentage", value: "101",
      minimumSubtotal: "0", maximumDiscount: "", usageLimit: "", perCustomerLimit: "1",
      startsOn: "", endsOn: "",
    }).success).toBe(false);
  });

  it("requires valid campaign date ranges and UTM values", () => {
    expect(campaignFormSchema.safeParse({
      nameEn: "September", nameAr: "سبتمبر", descriptionEn: "", descriptionAr: "",
      channel: "instagram", utmCampaign: "september_scrubs", budget: "1000",
      startsOn: "2026-09-20", endsOn: "2026-09-10",
    }).success).toBe(false);
  });

  it("maps database preview values into the checkout contract", () => {
    expect(mapDiscountPreview({
      code: "WELCOME10", discount_type: "percentage", discount_minor: 8500,
      subtotal_minor: 85000, discounted_subtotal_minor: 76500,
      campaign_name_en: "Welcome", campaign_name_ar: "ترحيب",
    })).toEqual({
      code: "WELCOME10", discountType: "percentage", discountMinor: 8500,
      subtotalMinor: 85000, discountedSubtotalMinor: 76500,
      campaignNameEn: "Welcome", campaignNameAr: "ترحيب",
    });
  });
});
