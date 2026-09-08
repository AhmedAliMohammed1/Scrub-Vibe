"use server";

import { revalidatePath } from "next/cache";
import type { Locale } from "@/lib/i18n";
import { requireRoles } from "@/server/auth/roles";
import { campaignFormSchema, discountCodeFormSchema } from "./validation";

export type PromotionActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

function message(locale: Locale, en: string, ar: string) {
  return locale === "ar" ? ar : en;
}

function nullableMoney(value: number | "") {
  return value === "" ? null : Math.round(value * 100);
}

function refreshPromotionPages() {
  revalidatePath("/en/admin/discounts");
  revalidatePath("/ar/admin/discounts");
  revalidatePath("/en/checkout");
  revalidatePath("/ar/checkout");
}

export async function saveCampaignAction(
  _previous: PromotionActionState,
  formData: FormData,
): Promise<PromotionActionState> {
  const locale: Locale = formData.get("locale") === "ar" ? "ar" : "en";
  const parsed = campaignFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: message(
        locale,
        "Check the campaign names, dates, budget and UTM value.",
        "راجع أسماء الحملة والتواريخ والميزانية وقيمة UTM.",
      ),
    };
  }

  const { supabase, userId } = await requireRoles(["admin", "super_admin"]);
  const value = parsed.data;
  const record = {
    name_en: value.nameEn,
    name_ar: value.nameAr,
    description_en: value.descriptionEn || null,
    description_ar: value.descriptionAr || null,
    channel: value.channel,
    utm_campaign: value.utmCampaign || null,
    budget_minor: nullableMoney(value.budget),
    starts_on: value.startsOn,
    ends_on: value.endsOn,
    is_active: formData.get("isActive") === "on",
    updated_at: new Date().toISOString(),
  };
  const result = value.campaignId
    ? await supabase
        .from("discount_campaigns")
        .update(record)
        .eq("id", value.campaignId)
    : await supabase
        .from("discount_campaigns")
        .insert({ ...record, created_by: userId });

  if (result.error) {
    return {
      status: "error",
      message: message(
        locale,
        "The campaign could not be saved.",
        "تعذر حفظ الحملة.",
      ),
    };
  }
  refreshPromotionPages();
  return {
    status: "success",
    message: message(locale, "Campaign saved.", "تم حفظ الحملة."),
  };
}

export async function saveDiscountCodeAction(
  _previous: PromotionActionState,
  formData: FormData,
): Promise<PromotionActionState> {
  const locale: Locale = formData.get("locale") === "ar" ? "ar" : "en";
  const parsed = discountCodeFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: message(
        locale,
        "Check the code, value, dates and usage limits.",
        "راجع الكود والقيمة والتواريخ وحدود الاستخدام.",
      ),
    };
  }

  const { supabase, userId } = await requireRoles(["admin", "super_admin"]);
  const value = parsed.data;
  const record = {
    campaign_id: value.campaignId === "" ? null : value.campaignId,
    code: value.code,
    discount_type: value.discountType,
    value:
      value.discountType === "percentage"
        ? Math.round(value.value * 100)
        : Math.round(value.value * 100),
    minimum_subtotal_minor: Math.round(value.minimumSubtotal * 100),
    maximum_discount_minor:
      value.discountType === "percentage"
        ? nullableMoney(value.maximumDiscount)
        : null,
    usage_limit: value.usageLimit === "" ? null : value.usageLimit,
    per_customer_limit: value.perCustomerLimit,
    starts_on: value.startsOn || null,
    ends_on: value.endsOn || null,
    is_active: formData.get("isActive") === "on",
    updated_at: new Date().toISOString(),
  };
  const result = value.discountCodeId
    ? await supabase
        .from("discount_codes")
        .update(record)
        .eq("id", value.discountCodeId)
    : await supabase
        .from("discount_codes")
        .insert({ ...record, created_by: userId });

  if (result.error) {
    const duplicate = result.error.code === "23505";
    return {
      status: "error",
      message: duplicate
        ? message(
            locale,
            "That discount code already exists.",
            "كود الخصم مستخدم بالفعل.",
          )
        : message(
            locale,
            "The discount code could not be saved.",
            "تعذر حفظ كود الخصم.",
          ),
    };
  }
  refreshPromotionPages();
  return {
    status: "success",
    message: message(locale, "Discount code saved.", "تم حفظ كود الخصم."),
  };
}
