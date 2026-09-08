import { NextResponse } from "next/server";
import { normalizeEgyptianPhone } from "@/features/checkout/validation";
import { mapDiscountPreview } from "@/features/promotions/types";
import { discountPreviewSchema } from "@/features/promotions/validation";
import { createAdminClient } from "@/lib/supabase/admin";

const errorCodes: [string, string][] = [
  ["DISCOUNT_CODE_INVALID", "discount_invalid"],
  ["DISCOUNT_CODE_INACTIVE", "discount_inactive"],
  ["DISCOUNT_CODE_EXPIRED", "discount_expired"],
  ["DISCOUNT_CAMPAIGN_INACTIVE", "discount_inactive"],
  ["DISCOUNT_MINIMUM_NOT_MET", "discount_minimum_not_met"],
  ["DISCOUNT_USAGE_LIMIT_REACHED", "discount_usage_limit"],
  ["DISCOUNT_CUSTOMER_LIMIT_REACHED", "discount_customer_limit"],
  ["DISCOUNT_CAMPAIGN_BUDGET_EXHAUSTED", "discount_budget_exhausted"],
  ["DISCOUNT_NOT_APPLICABLE", "discount_not_applicable"],
  ["VARIANT_UNAVAILABLE", "item_unavailable"],
];

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = discountPreviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "discount_invalid" }, { status: 400 });
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "checkout_configuration_error" }, { status: 503 });
  }

  const { data, error } = await admin.rpc("preview_discount_code", {
    p_code: parsed.data.code,
    p_items: parsed.data.items.map((item) => ({
      variant_id: item.variantId,
      quantity: item.quantity,
    })),
    p_payment_method: parsed.data.paymentMethod,
    p_phone: normalizeEgyptianPhone(parsed.data.phone) ?? undefined,
  });

  if (error || !data) {
    const databaseMessage = [error?.message, error?.details, error?.hint].filter(Boolean).join(" ");
    const code = errorCodes.find(([databaseCode]) => databaseMessage.includes(databaseCode))?.[1]
      ?? "discount_validation_failed";
    return NextResponse.json({ error: code }, { status: code === "discount_validation_failed" ? 503 : 409 });
  }

  return NextResponse.json(mapDiscountPreview(data as Record<string, unknown>), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
