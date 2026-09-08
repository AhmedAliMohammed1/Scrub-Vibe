"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRoles } from "@/server/auth/roles";
import type { Locale } from "@/lib/i18n";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  renderPaymentApproved,
  renderOrderShipped,
  sendEmail,
  type OrderEmailData,
} from "@/features/notifications/email";

const schema = z.object({
  locale: z.enum(["en", "ar"]),
  orderId: z.uuid(),
  status: z.enum(["awaiting_payment", "payment_review", "confirmed", "processing", "ready_to_ship", "shipped", "out_for_delivery", "delivered", "cancelled", "returned"]),
  paymentStatus: z.enum(["pending", "proof_submitted", "paid", "rejected", "failed", "cod_due", "cod_collected", "refunded"]),
  note: z.string().trim().max(500),
  shipmentNumber: z.string().trim().max(120),
  courier: z.string().trim().max(120),
  trackingUrl: z.union([z.literal(""), z.url().max(1000)]),
  proofStatus: z.enum(["", "approved", "rejected"]),
});

export async function updateOrderAction(formData: FormData) {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Invalid order update.");
  const { supabase } = await requireRoles(["support", "warehouse", "admin", "super_admin"]);
  const value = parsed.data;
  const { error } = await supabase.rpc("admin_update_order", {
    p_order_id: value.orderId,
    p_status: value.status,
    p_payment_status: value.paymentStatus,
    p_note: value.note || undefined,
    p_shipment_number: value.shipmentNumber || undefined,
    p_courier: value.courier || undefined,
    p_tracking_url: value.trackingUrl || undefined,
    p_proof_status: value.proofStatus || undefined,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/${value.locale}/admin/orders`);

  // ── Transactional emails (non-blocking) ──────────────────────────────────
  const shouldEmailProofApproved = value.proofStatus === "approved";
  const shouldEmailShipped = value.status === "shipped";
  if (shouldEmailProofApproved || shouldEmailShipped) {
    void (async () => {
      try {
        const admin = createAdminClient();
        const { data: orderData } = await admin
          .from("orders")
          .select("order_number, customer_name, email, subtotal_minor, shipping_minor, total_minor, payment_method, courier, shipment_number, tracking_url, order_items(title_en, title_ar, colour_en, colour_ar, size, quantity, line_total_minor)")
          .eq("id", value.orderId)
          .single();

        if (!orderData || !orderData.email) return;

        const emailOrder: OrderEmailData = {
          order_number: orderData.order_number,
          customer_name: orderData.customer_name,
          email: orderData.email,
          subtotal_minor: orderData.subtotal_minor,
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

        if (shouldEmailProofApproved) {
          await sendEmail(renderPaymentApproved(emailOrder, locale));
        }
        if (shouldEmailShipped) {
          await sendEmail(renderOrderShipped(emailOrder, locale));
        }
      } catch (emailError) {
        console.error("[email] Failed to send admin email notification:", emailError);
      }
    })();
  }
}
