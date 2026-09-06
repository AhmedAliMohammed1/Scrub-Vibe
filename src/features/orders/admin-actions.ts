"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRoles } from "@/server/auth/roles";

const schema = z.object({
  locale: z.enum(["en", "ar"]),
  orderId: z.uuid(),
  status: z.enum(["awaiting_payment", "payment_review", "confirmed", "processing", "ready_to_ship", "shipped", "out_for_delivery", "delivered", "cancelled", "returned"]),
  paymentStatus: z.enum(["pending", "proof_submitted", "paid", "rejected", "failed", "cod_due", "cod_collected", "refunded"]),
  note: z.string().trim().max(500),
  shipmentNumber: z.string().trim().max(120),
  courier: z.string().trim().max(120),
  trackingUrl: z.union([z.literal(""), z.url().max(1000)]),
  proofStatus: z.enum(["", "pending", "approved", "rejected"]),
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
}
