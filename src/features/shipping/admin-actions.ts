"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Locale } from "@/lib/i18n";
import { requireRoles } from "@/server/auth/roles";

export type ShippingZoneActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const moneyField = z.coerce.number().min(0).max(1_000_000);
const zoneSchema = z.object({
  zoneId: z.coerce.number().int().positive(),
  shippingFee: moneyField,
  freeShippingThreshold: z.union([
    z.literal(""),
    z.coerce.number().positive().max(1_000_000),
  ]),
  codSurcharge: moneyField,
  deliveryMinDays: z.coerce.number().int().min(1).max(30),
  deliveryMaxDays: z.coerce.number().int().min(1).max(45),
});

function translated(locale: Locale, en: string, ar: string) {
  return locale === "ar" ? ar : en;
}

export async function updateShippingZoneAction(
  _previous: ShippingZoneActionState,
  formData: FormData,
): Promise<ShippingZoneActionState> {
  const locale: Locale = formData.get("locale") === "ar" ? "ar" : "en";
  const parsed = zoneSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success || parsed.data.deliveryMaxDays < parsed.data.deliveryMinDays) {
    return {
      status: "error",
      message: translated(
        locale,
        "Check the fees, threshold and delivery-day range.",
        "راجع الرسوم وحد الشحن المجاني ونطاق أيام التوصيل.",
      ),
    };
  }

  const { supabase } = await requireRoles(["admin", "super_admin"]);
  const isActive = formData.get("isActive") === "on";
  if (!isActive) {
    const { count } = await supabase
      .from("shipping_zones")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true)
      .neq("id", parsed.data.zoneId);
    if (!count) {
      return {
        status: "error",
        message: translated(
          locale,
          "Keep at least one delivery zone active.",
          "يجب إبقاء منطقة توصيل واحدة نشطة على الأقل.",
        ),
      };
    }
  }

  const { error } = await supabase
    .from("shipping_zones")
    .update({
      shipping_fee_minor: Math.round(parsed.data.shippingFee * 100),
      free_shipping_threshold_minor:
        parsed.data.freeShippingThreshold === ""
          ? null
          : Math.round(parsed.data.freeShippingThreshold * 100),
      cod_enabled: formData.get("codEnabled") === "on",
      cod_surcharge_minor: Math.round(parsed.data.codSurcharge * 100),
      delivery_min_days: parsed.data.deliveryMinDays,
      delivery_max_days: parsed.data.deliveryMaxDays,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.zoneId);

  if (error) {
    return {
      status: "error",
      message: translated(
        locale,
        "The delivery zone could not be updated.",
        "تعذر تحديث منطقة التوصيل.",
      ),
    };
  }

  revalidatePath(`/${locale}/admin/shipping`);
  revalidatePath("/en/checkout");
  revalidatePath("/ar/checkout");
  return {
    status: "success",
    message: translated(locale, "Delivery pricing saved.", "تم حفظ أسعار التوصيل."),
  };
}
