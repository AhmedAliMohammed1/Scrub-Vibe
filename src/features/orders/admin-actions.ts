"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRoles } from "@/server/auth/roles";
import type { Locale } from "@/lib/i18n";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  renderPaymentApproved,
  renderOrderShipped,
  renderOrderProcessing,
  renderOrderOutForDelivery,
  renderOrderDelivered,
  renderOrderCancelled,
  renderOrderStatusNote,
  sendEmail,
  type OrderEmailData,
} from "@/features/notifications/email";

const schema = z.object({
  locale: z.enum(["en", "ar"]),
  orderId: z.uuid(),
  status: z.enum([
    "awaiting_payment",
    "payment_review",
    "confirmed",
    "processing",
    "ready_to_ship",
    "shipped",
    "out_for_delivery",
    "delivered",
    "partially_returned",
    "cancelled",
    "returned",
  ]),
  paymentStatus: z.enum([
    "pending",
    "proof_submitted",
    "paid",
    "partially_refunded",
    "rejected",
    "failed",
    "cod_due",
    "cod_collected",
    "refunded",
  ]),
  note: z.string().trim().max(500),
  shipmentNumber: z.string().trim().max(120),
  courier: z.string().trim().max(120),
  trackingUrl: z.union([z.literal(""), z.url().max(1000)]),
  proofStatus: z.enum(["", "approved", "rejected"]),
  currentFilter: z.string().optional(),
  currentPage: z.coerce.number().int().min(1).optional(),
});

function adminOrdersQuery({
  filter,
  page,
  messageKey,
  message,
}: {
  filter?: string;
  page?: number;
  messageKey: "error" | "success";
  message: string;
}) {
  const params = new URLSearchParams({ [messageKey]: message });
  if (filter) params.set("status", filter);
  if (page && page > 1) params.set("page", String(page));
  return params.toString();
}

function formatOrderErrorMessage(raw: string, locale: Locale): string {
  const isAr = locale === "ar";
  if (raw.includes("PROOF_APPROVAL_REQUIRED")) {
    return isAr
      ? "يرجى تحديد قرار الإيصال (موافقة أو رفض) لتحديث حالة الدفع."
      : "Please approve or reject the payment proof to update the payment status.";
  }
  if (raw.includes("SHIPMENT_NUMBER_REQUIRED")) {
    return isAr
      ? "رقم الشحنة مطلوب عند تغيير حالة الطلب إلى تم الشحن."
      : "A shipment number is required when marking the order as shipped.";
  }
  if (raw.includes("NO_PENDING_PAYMENT_PROOF")) {
    return isAr
      ? "لا يوجد إيصال دفع قيد المراجعة لهذا الطلب."
      : "There is no pending payment proof for this order.";
  }
  if (raw.includes("PAYMOB_WEBHOOK_REQUIRED")) {
    return isAr
      ? "طلبات Paymob تُحدث تلقائياً عبر الإشعار ولا يمكن تأكيدها يدوياً."
      : "Paymob orders update automatically and cannot be confirmed manually.";
  }
  if (raw.includes("INSUFFICIENT_STOCK_AT_FULFILMENT")) {
    return isAr
      ? "المخزون المتوفر غير كافٍ لإتمام التوصيل."
      : "Insufficient stock available to deliver this order.";
  }
  if (raw.includes("TERMINAL_ORDER")) {
    return isAr
      ? "لا يمكن تعديل حالة الطلبات الملغاة أو المرتجعة لأنها تعتبر طلبات نهائية تم تحرير مخزونها."
      : "Cancelled and returned orders are terminal states and cannot be reopened.";
  }
  return raw;
}

export async function updateOrderAction(formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const locale = formData.get("locale") === "ar" ? "ar" : "en";
    const msg =
      locale === "ar"
        ? "بيانات تحديث الطلب غير صالحة."
        : "Invalid order update details.";
    redirect(`/${locale}/admin/orders?error=${encodeURIComponent(msg)}`);
  }
  const { supabase } = await requireRoles([
    "support",
    "warehouse",
    "admin",
    "super_admin",
  ]);
  const value = parsed.data;

  // 1. Fetch current order before update to know previous status and payment_status
  const { data: previousOrder } = await supabase
    .from("orders")
    .select("status, payment_status")
    .eq("id", value.orderId)
    .single();

  // Auto-resolve proof decision if admin changed payment to paid/cod_due or status to confirmed
  let effectiveProofStatus = value.proofStatus || undefined;
  if (
    !effectiveProofStatus &&
    (value.paymentStatus === "paid" ||
      value.paymentStatus === "cod_due" ||
      value.status === "confirmed")
  ) {
    const { data: pendingProof } = await supabase
      .from("payment_proofs")
      .select("id")
      .eq("order_id", value.orderId)
      .eq("status", "pending")
      .limit(1)
      .maybeSingle();

    if (pendingProof) {
      effectiveProofStatus = "approved";
    }
  } else if (!effectiveProofStatus && value.paymentStatus === "rejected") {
    const { data: pendingProof } = await supabase
      .from("payment_proofs")
      .select("id")
      .eq("order_id", value.orderId)
      .eq("status", "pending")
      .limit(1)
      .maybeSingle();

    if (pendingProof) {
      effectiveProofStatus = "rejected";
    }
  }

  const { error } = await supabase.rpc("admin_update_order", {
    p_order_id: value.orderId,
    p_status: value.status,
    p_payment_status: value.paymentStatus,
    p_note: value.note || undefined,
    p_shipment_number: value.shipmentNumber || undefined,
    p_courier: value.courier || undefined,
    p_tracking_url: value.trackingUrl || undefined,
    p_proof_status: effectiveProofStatus,
  });

  if (error) {
    const friendly = formatOrderErrorMessage(error.message, value.locale);
    redirect(
      `/${value.locale}/admin/orders?${adminOrdersQuery({ filter: value.currentFilter, page: value.currentPage, messageKey: "error", message: friendly })}`,
    );
  }

  // 1. Fetch updated order data for emails & customer tracking revalidation
  const admin = createAdminClient();
  const { data: orderData } = await admin
    .from("orders")
    .select(
      "order_number, customer_name, email, subtotal_minor, discount_minor, discount_code, shipping_minor, total_minor, payment_method, courier, shipment_number, tracking_url, order_items(title_en, title_ar, colour_en, colour_ar, size, quantity, line_total_minor)",
    )
    .eq("id", value.orderId)
    .single();

  // 2. Revalidate admin and tracking routes synchronously outside background closures
  revalidatePath(`/${value.locale}/admin/orders`);
  revalidatePath(`/${value.locale}/admin/orders`, "page");
  if (orderData?.order_number) {
    revalidatePath(`/${value.locale}/track/${orderData.order_number}`);
  }

  // 3. Await transactional emails before redirect so serverless execution doesn't terminate prematurely
  if (orderData?.email) {
    try {
      const emailOrder: OrderEmailData = {
        order_number: orderData.order_number,
        customer_name: orderData.customer_name,
        email: orderData.email,
        subtotal_minor: orderData.subtotal_minor,
        discount_minor: orderData.discount_minor,
        discount_code: orderData.discount_code,
        shipping_minor: orderData.shipping_minor,
        total_minor: orderData.total_minor,
        payment_method: orderData.payment_method,
        courier: orderData.courier,
        shipment_number: orderData.shipment_number,
        tracking_url: orderData.tracking_url,
        items: (orderData.order_items as OrderEmailData["items"]) ?? [],
      };

      const locale: "en" | "ar" =
        (value.locale as Locale) === "ar" ? "ar" : "en";
      const customerNote = value.note?.trim() || null;

      const proofApprovedNow =
        effectiveProofStatus === "approved" &&
        previousOrder?.payment_status !== "paid" &&
        previousOrder?.payment_status !== "cod_due";

      const statusChanged = Boolean(
        previousOrder && previousOrder.status !== value.status,
      );

      if (proofApprovedNow) {
        await sendEmail(
          renderPaymentApproved(emailOrder, locale, customerNote),
        );
      } else if (statusChanged) {
        if (value.status === "processing" || value.status === "ready_to_ship") {
          await sendEmail(
            renderOrderProcessing(emailOrder, locale, customerNote),
          );
        } else if (value.status === "shipped") {
          await sendEmail(renderOrderShipped(emailOrder, locale, customerNote));
        } else if (value.status === "out_for_delivery") {
          await sendEmail(
            renderOrderOutForDelivery(emailOrder, locale, customerNote),
          );
        } else if (value.status === "delivered") {
          await sendEmail(
            renderOrderDelivered(emailOrder, locale, customerNote),
          );
        } else if (value.status === "cancelled") {
          await sendEmail(
            renderOrderCancelled(emailOrder, locale, customerNote),
          );
        } else if (value.status === "confirmed") {
          await sendEmail(
            renderPaymentApproved(emailOrder, locale, customerNote),
          );
        }
      } else if (customerNote) {
        await sendEmail(
          renderOrderStatusNote(emailOrder, locale, customerNote, value.status),
        );
      }
    } catch (emailError) {
      console.error(
        "[email] Failed to send admin email notification:",
        emailError,
      );
    }
  }

  const successMsg =
    value.locale === "ar"
      ? "تم تحديث الطلب بنجاح."
      : "Order updated successfully.";
  redirect(
    `/${value.locale}/admin/orders?${adminOrdersQuery({ filter: value.currentFilter, page: value.currentPage, messageKey: "success", message: successMsg })}`,
  );
}
