export type DiscountPreview = {
  code: string;
  discountType: "percentage" | "fixed";
  discountMinor: number;
  subtotalMinor: number;
  discountedSubtotalMinor: number;
  campaignNameEn: string | null;
  campaignNameAr: string | null;
};

export function normalizeDiscountCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function mapDiscountPreview(value: Record<string, unknown>): DiscountPreview {
  return {
    code: String(value.code),
    discountType: value.discount_type === "fixed" ? "fixed" : "percentage",
    discountMinor: Number(value.discount_minor),
    subtotalMinor: Number(value.subtotal_minor),
    discountedSubtotalMinor: Number(value.discounted_subtotal_minor),
    campaignNameEn: typeof value.campaign_name_en === "string" ? value.campaign_name_en : null,
    campaignNameAr: typeof value.campaign_name_ar === "string" ? value.campaign_name_ar : null,
  };
}
