"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { z } from "zod";
import { requireRoles } from "@/server/auth/roles";
import type { Locale } from "@/lib/i18n";

const sizeEntrySchema = z.object({
  id: z.string().optional(),
  productId: z.coerce.number().optional().nullable(),
  category: z.enum(["women", "men", "unisex"]),
  size: z.string().trim().min(1).max(10).toUpperCase(),
  sortOrder: z.coerce.number().int().min(1).max(20).default(1),
  chestMinCm: z.coerce.number().positive().max(300),
  chestMaxCm: z.coerce.number().positive().max(300),
  waistMinCm: z.coerce.number().positive().max(300),
  waistMaxCm: z.coerce.number().positive().max(300),
  hipMinCm: z.coerce.number().positive().max(300),
  hipMaxCm: z.coerce.number().positive().max(300),
  inseamCm: z.coerce.number().positive().max(200).optional().nullable(),
  garmentLengthCm: z.coerce.number().positive().max(200).optional().nullable(),
  noteEn: z.string().max(300).optional().nullable(),
  noteAr: z.string().max(300).optional().nullable(),
  locale: z.enum(["en", "ar"]).default("en"),
  redirectTab: z.string().optional(),
});

export async function upsertSizeChartEntryAction(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = sizeEntrySchema.safeParse(raw);
  const locale = (formData.get("locale") as Locale) === "ar" ? "ar" : "en";
  const redirectTab = (formData.get("redirectTab") as string) || "";

  if (!parsed.success) {
    const errorMsg =
      locale === "ar"
        ? "بيانات القياسات غير صالحة. يرجى التأكد من أن جميع الأرقام موجبة."
        : "Invalid measurements. Please ensure all values are positive numbers.";
    const tabQuery = redirectTab ? `&tab=${encodeURIComponent(redirectTab)}` : "";
    redirect(`/${locale}/admin/sizes?error=${encodeURIComponent(errorMsg)}${tabQuery}` as Route);
  }

  const { supabase } = await requireRoles(["admin", "super_admin"]);
  const data = parsed.data;

  // Verify min <= max
  if (
    data.chestMinCm > data.chestMaxCm ||
    data.waistMinCm > data.waistMaxCm ||
    data.hipMinCm > data.hipMaxCm
  ) {
    const errorMsg =
      locale === "ar"
        ? "يجب أن يكون الحد الأدنى للقياس أقل من أو يساوي الحد الأقصى."
        : "Minimum measurement must be less than or equal to the maximum.";
    const tabQuery = redirectTab ? `&tab=${encodeURIComponent(redirectTab)}` : "";
    redirect(`/${locale}/admin/sizes?error=${encodeURIComponent(errorMsg)}${tabQuery}` as Route);
  }

  const payload = {
    product_id: data.productId ? data.productId : null,
    category: data.category,
    size: data.size,
    sort_order: data.sortOrder,
    chest_min_cm: data.chestMinCm,
    chest_max_cm: data.chestMaxCm,
    waist_min_cm: data.waistMinCm,
    waist_max_cm: data.waistMaxCm,
    hip_min_cm: data.hipMinCm,
    hip_max_cm: data.hipMaxCm,
    inseam_cm: data.inseamCm || null,
    garment_length_cm: data.garmentLengthCm || null,
    note_en: data.noteEn?.trim() || null,
    note_ar: data.noteAr?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  let dbError: { message: string } | null = null;

  if (data.id) {
    const { error } = await supabase
      .from("size_chart_entries")
      .update(payload)
      .eq("id", data.id);
    dbError = error;
  } else {
    // Look up if an entry already exists for (category, size, product_id)
    let query = supabase
      .from("size_chart_entries")
      .select("id")
      .eq("category", data.category)
      .eq("size", data.size);

    if (data.productId) {
      query = query.eq("product_id", data.productId);
    } else {
      query = query.is("product_id", null);
    }

    const { data: existing } = await query.maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("size_chart_entries")
        .update(payload)
        .eq("id", existing.id);
      dbError = error;
    } else {
      const { error } = await supabase
        .from("size_chart_entries")
        .insert(payload);
      dbError = error;
    }
  }

  if (dbError) {
    console.error("[admin-sizes] Database error upserting size entry:", dbError);
    const errorMsg =
      locale === "ar"
        ? "تعذر حفظ المقاس في قاعدة البيانات."
        : "Failed to save measurement entry to the database.";
    const tabQuery = redirectTab ? `&tab=${encodeURIComponent(redirectTab)}` : "";
    redirect(`/${locale}/admin/sizes?error=${encodeURIComponent(errorMsg)}${tabQuery}` as Route);
  }

  revalidatePath(`/${locale}/admin/sizes`);
  revalidatePath(`/${locale}/products/[slug]`, "page");
  revalidatePath(`/${locale}/shop`, "page");

  const successMsg =
    locale === "ar"
      ? `تم حفظ قياسات المقاس ${data.size} بنجاح.`
      : `Measurements for size ${data.size} saved successfully.`;
  const tabQuery = redirectTab ? `&tab=${encodeURIComponent(redirectTab)}` : "";
  redirect(`/${locale}/admin/sizes?success=${encodeURIComponent(successMsg)}${tabQuery}` as Route);
}

export async function resetProductSizeChartToDefaultsAction(formData: FormData) {
  const productId = Number(formData.get("productId"));
  const locale = (formData.get("locale") as Locale) === "ar" ? "ar" : "en";
  const redirectTab = (formData.get("redirectTab") as string) || "products";

  if (!productId || productId <= 0) {
    const errorMsg =
      locale === "ar" ? "معرف المنتج غير صالح." : "Invalid product identifier.";
    redirect(`/${locale}/admin/sizes?error=${encodeURIComponent(errorMsg)}&tab=${encodeURIComponent(redirectTab)}` as Route);
  }

  const { supabase } = await requireRoles(["admin", "super_admin"]);

  const { error } = await supabase
    .from("size_chart_entries")
    .delete()
    .eq("product_id", productId);

  if (error) {
    console.error("[admin-sizes] Error resetting product size chart:", error);
    const errorMsg =
      locale === "ar"
        ? "تعذر إعادة تعيين مقاسات المنتج."
        : "Failed to reset product size chart.";
    redirect(`/${locale}/admin/sizes?error=${encodeURIComponent(errorMsg)}&tab=${encodeURIComponent(redirectTab)}` as Route);
  }

  revalidatePath(`/${locale}/admin/sizes`);
  revalidatePath(`/${locale}/products/[slug]`, "page");

  const successMsg =
    locale === "ar"
      ? "تمت استعادة المقاسات القياسية للمنتج بنجاح."
      : "Product sizing reset to standard collection defaults.";
  redirect(`/${locale}/admin/sizes?success=${encodeURIComponent(successMsg)}&tab=${encodeURIComponent(redirectTab)}` as Route);
}
