import { NextResponse } from "next/server";
import { checkoutOrderSchema } from "@/features/checkout/validation";
import { hashToken, issuePrivateToken } from "@/features/checkout/security";
import { createPaymobIntention, hasPaymobConfiguration } from "@/features/checkout/paymob";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const allowedProofs = new Map([
  ["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"],
]);

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  let raw: unknown;
  try { raw = JSON.parse(String(formData.get("order") ?? "")); }
  catch { return NextResponse.json({ error: "invalid_order" }, { status: 400 }); }
  const parsed = checkoutOrderSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_order", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const checkout = parsed.data;
  if (checkout.paymentMethod === "paymob" && !hasPaymobConfiguration()) {
    return NextResponse.json({ error: "paymob_not_configured" }, { status: 503 });
  }
  const proof = formData.get("proof");
  const manualPayment = checkout.paymentMethod === "vodafone_cash" || checkout.paymentMethod === "instapay";
  if (manualPayment && (!(proof instanceof File) || proof.size === 0)) {
    return NextResponse.json({ error: "payment_proof_required" }, { status: 400 });
  }
  let proofPath: string | null = null;
  const admin = createAdminClient();
  if (proof instanceof File && proof.size > 0) {
    const extension = allowedProofs.get(proof.type);
    if (!extension || proof.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "invalid_payment_proof" }, { status: 400 });
    }
    proofPath = `submissions/${crypto.randomUUID()}.${extension}`;
    const { error } = await admin.storage.from("payment-proofs").upload(proofPath, proof, {
      contentType: proof.type,
      upsert: false,
    });
    if (error) return NextResponse.json({ error: "proof_upload_failed" }, { status: 503 });
  }

  const trackingToken = issuePrivateToken();
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub ?? null;
  const rpcOrder = {
    customer_name: checkout.customerName,
    email: checkout.email,
    phone: checkout.phone,
    governorate: checkout.governorate,
    city: checkout.city,
    street_address: checkout.streetAddress,
    building: checkout.building,
    floor: checkout.floor,
    apartment: checkout.apartment,
    landmark: checkout.landmark,
    customer_notes: checkout.customerNotes,
    payment_method: checkout.paymentMethod,
    items: checkout.items.map((item) => ({ variant_id: item.variantId, quantity: item.quantity })),
  };
  await admin.rpc("release_expired_order_reservations");
  const { data, error } = await admin.rpc("create_verified_order", {
    p_verification_token_hash: hashToken(checkout.verificationToken),
    p_tracking_token_hash: hashToken(trackingToken),
    p_user_id: userId as string,
    p_order: rpcOrder,
    p_proof_path: proofPath ?? undefined,
  });
  if (error || !data) {
    if (proofPath) await admin.storage.from("payment-proofs").remove([proofPath]);
    const code = error?.message.includes("INSUFFICIENT_STOCK") ? "insufficient_stock" :
      error?.message.includes("PHONE_VERIFICATION") ? "verification_expired" : "order_failed";
    return NextResponse.json({ error: code }, { status: code === "order_failed" ? 503 : 409 });
  }

  const order = data as unknown as {
    id: string; order_number: string; subtotal_minor: number; shipping_minor: number; total_minor: number;
  };
  let paymentUrl: string | null = null;
  let paymentWarning: string | null = null;
  if (checkout.paymentMethod === "paymob") {
    try {
      const variants = [{ name: `Scrub Vibe order ${order.order_number}`, amountMinor: order.total_minor, quantity: 1 }];
      const intention = await createPaymobIntention({
        orderNumber: order.order_number,
        totalMinor: order.total_minor,
        items: variants,
        checkout,
      });
      paymentUrl = intention.checkoutUrl;
      await admin.from("orders").update({
        paymob_intention_id: intention.intentionId,
        paymob_order_id: intention.orderId,
      }).eq("id", order.id);
    } catch {
      paymentWarning = "paymob_start_failed";
    }
  }

  return NextResponse.json({
    orderNumber: order.order_number,
    trackingToken,
    paymentUrl,
    paymentWarning,
  });
}
