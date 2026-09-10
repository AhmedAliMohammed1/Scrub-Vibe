"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Route } from "next";
import { z } from "zod";
import { requireRoles } from "@/server/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderReturnUpdate, sendEmail } from "@/features/notifications/email";
import {
  formatReturnErrorMessage,
  parseEgpToMinor,
  returnRefundMethods,
  returnResolutions,
  returnStatuses,
} from "@/features/commercial/return-workflow";

function localeFrom(form: FormData) {
  return form.get("locale") === "ar" ? ("ar" as const) : ("en" as const);
}
function done(locale: "en" | "ar", message: string, error = false): never {
  redirect(
    `/${locale}/admin/commercial?${error ? "error" : "success"}=${encodeURIComponent(message)}` as Route,
  );
}

const bundleSchema = z.object({
  id: z.union([z.literal(""), z.coerce.number().int().positive()]),
  locale: z.enum(["en", "ar"]),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  titleEn: z.string().trim().min(2).max(120),
  titleAr: z.string().trim().min(2).max(120),
  descriptionEn: z.string().trim().max(600),
  descriptionAr: z.string().trim().max(600),
  status: z.enum(["draft", "active", "archived"]),
  position: z.coerce.number().int().min(0).max(10000),
});

export async function saveBundleAction(formData: FormData) {
  const locale = localeFrom(formData);
  const parsed = bundleSchema.safeParse(Object.fromEntries(formData));
  const productIds = [
    ...new Set(
      formData
        .getAll("productId")
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  ];
  if (!parsed.success || productIds.length < 2)
    done(
      locale,
      locale === "ar"
        ? "أدخل بيانات صحيحة واختر منتجين على الأقل."
        : "Enter valid details and choose at least two products.",
      true,
    );
  const { supabase, userId } = await requireRoles([
    "content_editor",
    "product_manager",
    "admin",
    "super_admin",
  ]);
  const value = parsed.data;
  const bundle = {
    slug: value.slug,
    title_en: value.titleEn,
    title_ar: value.titleAr,
    description_en: value.descriptionEn,
    description_ar: value.descriptionAr,
    status: value.status,
    position: value.position,
    updated_by: userId,
  };
  let id: number;
  if (value.id === "") {
    const { data, error } = await supabase
      .from("product_bundles")
      .insert({ ...bundle, created_by: userId })
      .select("id")
      .single();
    if (error)
      done(
        locale,
        error.code === "23505" ? "Bundle slug already exists." : error.message,
        true,
      );
    id = data.id;
  } else {
    const { error } = await supabase
      .from("product_bundles")
      .update(bundle)
      .eq("id", value.id);
    if (error) done(locale, error.message, true);
    id = value.id;
    await supabase.from("product_bundle_items").delete().eq("bundle_id", id);
  }
  const { error: itemError } = await supabase
    .from("product_bundle_items")
    .insert(
      productIds.map((productId, index) => ({
        bundle_id: id,
        product_id: productId,
        position: (index + 1) * 10,
      })),
    );
  if (itemError) done(locale, itemError.message, true);
  revalidatePath(`/${locale}/admin/commercial`);
  revalidatePath(`/${locale}`, "layout");
  done(locale, locale === "ar" ? "تم حفظ المجموعة." : "Bundle saved.");
}

export async function archiveBundleAction(formData: FormData) {
  const locale = localeFrom(formData);
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) done(locale, "Invalid bundle.", true);
  const { supabase } = await requireRoles(["admin", "super_admin"]);
  const { error } = await supabase
    .from("product_bundles")
    .update({ status: "archived" })
    .eq("id", id);
  if (error) done(locale, error.message, true);
  revalidatePath(`/${locale}/admin/commercial`);
  revalidatePath(`/${locale}`, "layout");
  done(locale, locale === "ar" ? "تمت أرشفة المجموعة." : "Bundle archived.");
}

export async function saveRecommendationAction(formData: FormData) {
  const locale = localeFrom(formData);
  const parsed = z
    .object({
      productId: z.coerce.number().int().positive(),
      relatedProductId: z.coerce.number().int().positive(),
      kind: z.enum(["cross_sell", "complete_the_look"]),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success || parsed.data.productId === parsed.data.relatedProductId)
    done(locale, "Choose two different products.", true);
  const { supabase, userId } = await requireRoles([
    "content_editor",
    "product_manager",
    "admin",
    "super_admin",
  ]);
  const { error } = await supabase.from("product_recommendations").upsert(
    {
      product_id: parsed.data.productId,
      related_product_id: parsed.data.relatedProductId,
      kind: parsed.data.kind,
      created_by: userId,
      is_active: true,
    },
    { onConflict: "product_id,related_product_id,kind" },
  );
  if (error) done(locale, error.message, true);
  revalidatePath(`/${locale}/admin/commercial`);
  revalidatePath(`/${locale}`, "layout");
  done(locale, locale === "ar" ? "تم حفظ الاقتراح." : "Recommendation saved.");
}

export async function removeRecommendationAction(formData: FormData) {
  const locale = localeFrom(formData);
  const productId = Number(formData.get("productId"));
  const relatedProductId = Number(formData.get("relatedProductId"));
  const kind = String(formData.get("kind"));
  const { supabase } = await requireRoles([
    "content_editor",
    "product_manager",
    "admin",
    "super_admin",
  ]);
  const { error } = await supabase
    .from("product_recommendations")
    .delete()
    .eq("product_id", productId)
    .eq("related_product_id", relatedProductId)
    .eq("kind", kind as "cross_sell" | "complete_the_look");
  if (error) done(locale, error.message, true);
  revalidatePath(`/${locale}/admin/commercial`);
  revalidatePath(`/${locale}`, "layout");
  done(
    locale,
    locale === "ar" ? "تم حذف الاقتراح." : "Recommendation removed.",
  );
}

export async function updateReturnAction(formData: FormData) {
  const locale = localeFrom(formData);
  const parsed = z
    .object({
      id: z.string().uuid(),
      status: z.enum(returnStatuses),
      resolution: z.union([z.literal(""), z.enum(returnResolutions)]),
      note: z.string().trim().max(1000),
      internalNote: z.string().trim().max(2000),
      refundAmount: z.string().trim().max(20),
      refundMethod: z.union([z.literal(""), z.enum(returnRefundMethods)]),
      refundReference: z.string().trim().max(160),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    done(
      locale,
      locale === "ar" ? "بيانات التحديث غير صالحة." : "Invalid return update.",
      true,
    );

  const itemIds = formData.getAll("itemId").map(String);
  const receivedQuantities = formData.getAll("receivedQuantity").map(String);
  const restockedQuantities = formData.getAll("restockedQuantity").map(String);
  if (
    itemIds.length !== receivedQuantities.length ||
    itemIds.length !== restockedQuantities.length
  )
    done(
      locale,
      locale === "ar"
        ? "بيانات كميات المنتجات غير مكتملة."
        : "Return item quantities are incomplete.",
      true,
    );

  const itemReceipts = itemIds.map((id, index) => ({
    id,
    received_quantity: Number(receivedQuantities[index]),
    restocked_quantity: Number(restockedQuantities[index]),
  }));
  if (
    itemReceipts.some(
      (item) =>
        !/^\d+$/.test(item.id) ||
        !Number.isInteger(item.received_quantity) ||
        !Number.isInteger(item.restocked_quantity),
    )
  )
    done(
      locale,
      locale === "ar"
        ? "كميات المنتجات غير صحيحة."
        : "Return item quantities are invalid.",
      true,
    );

  const refundAmountMinor =
    parsed.data.refundAmount === ""
      ? 0
      : parseEgpToMinor(parsed.data.refundAmount);
  if (refundAmountMinor === null)
    done(
      locale,
      locale === "ar"
        ? "أدخل مبلغ الاسترداد بالجنيه ورقمين عشريين كحد أقصى."
        : "Enter the refund in EGP with no more than two decimal places.",
      true,
    );

  const { supabase } = await requireRoles([
    "support",
    "warehouse",
    "admin",
    "super_admin",
  ]);
  const { error } = await supabase.rpc("admin_update_return", {
    p_return_id: parsed.data.id,
    p_status: parsed.data.status,
    p_resolution: parsed.data.resolution || undefined,
    p_customer_note: parsed.data.note || undefined,
    p_internal_note: parsed.data.internalNote || undefined,
    p_refund_amount_minor: refundAmountMinor,
    p_refund_method: parsed.data.refundMethod || undefined,
    p_refund_reference: parsed.data.refundReference || undefined,
    p_item_receipts: itemReceipts,
  });
  if (error)
    done(locale, formatReturnErrorMessage(error.message, locale), true);

  const admin = createAdminClient();
  const { data: request } = await admin
    .from("return_requests")
    .select(
      "return_number, request_type, status, resolution, refund_amount_minor, refund_method, refund_reference, orders(email, customer_name, order_number)",
    )
    .eq("id", parsed.data.id)
    .single();
  if (request?.orders?.email) {
    try {
      await sendEmail(
        renderReturnUpdate({
          email: request.orders.email,
          customerName: request.orders.customer_name,
          orderNumber: request.orders.order_number,
          returnNumber: request.return_number,
          requestType: request.request_type,
          status: request.status,
          resolution: request.resolution,
          refundAmountMinor: request.refund_amount_minor,
          refundMethod: request.refund_method,
          refundReference: request.refund_reference,
          note: parsed.data.note || null,
          locale,
        }),
      );
    } catch (emailError) {
      console.error("[email] Failed to send return update", emailError);
    }
  }
  revalidatePath(`/${locale}/admin/commercial`);
  revalidatePath(`/${locale}/admin/orders`);
  revalidatePath(`/${locale}/account`);
  revalidatePath(`/${locale}/account/returns`);
  if (request?.orders?.order_number)
    revalidatePath(`/${locale}/track/${request.orders.order_number}`);
  done(
    locale,
    locale === "ar" ? "تم تحديث طلب الاسترجاع." : "Return request updated.",
  );
}
