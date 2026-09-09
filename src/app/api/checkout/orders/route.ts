import { NextResponse } from "next/server";
import { checkoutOrderSchema } from "@/features/checkout/validation";
import { isCheckoutPhoneOtpEnabled } from "@/features/checkout/config";
import { paymentProofExtension } from "@/features/checkout/payment-proof";
import { hashToken, issuePrivateToken } from "@/features/checkout/security";
import {
  createPaymobIntention,
  hasPaymobConfiguration,
} from "@/features/checkout/paymob";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  renderOrderPlaced,
  renderStaffNewOrder,
  sendEmail,
  sendStaffEmail,
  type OrderEmailData,
} from "@/features/notifications/email";
import { markCartRecovered } from "@/features/cart-recovery/repository";
import { sendMetaPurchase } from "@/features/commercial/meta-conversions";
import { getSiteOrigin } from "@/features/auth/site-url";

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  if (!formData)
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("order") ?? ""));
  } catch {
    return NextResponse.json({ error: "invalid_order" }, { status: 400 });
  }
  const parsed = checkoutOrderSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_order", fields: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  const checkout = parsed.data;
  const otpEnabled = isCheckoutPhoneOtpEnabled();
  if (otpEnabled && checkout.verificationToken.length < 32) {
    return NextResponse.json(
      { error: "verification_required" },
      { status: 401 },
    );
  }
  if (checkout.paymentMethod === "paymob" && !hasPaymobConfiguration()) {
    return NextResponse.json(
      { error: "paymob_not_configured" },
      { status: 503 },
    );
  }
  const proof = formData.get("proof");
  const proofPayment =
    checkout.paymentMethod === "cod" ||
    checkout.paymentMethod === "vodafone_cash" ||
    checkout.paymentMethod === "instapay";
  if (proofPayment && (!(proof instanceof File) || proof.size === 0)) {
    return NextResponse.json(
      { error: "payment_proof_required" },
      { status: 400 },
    );
  }
  let proofPath: string | null = null;
  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (error) {
    console.error("[checkout/orders] Supabase admin configuration failed", {
      stage: "admin_client",
      message:
        error instanceof Error ? error.message : "Unknown configuration error",
    });
    return NextResponse.json(
      { error: "checkout_configuration_error" },
      { status: 503 },
    );
  }
  if (proof instanceof File && proof.size > 0) {
    const extension = await paymentProofExtension(proof);
    if (!extension) {
      return NextResponse.json(
        { error: "invalid_payment_proof" },
        { status: 400 },
      );
    }
    proofPath = `submissions/${crypto.randomUUID()}.${extension}`;
    const { error } = await admin.storage
      .from("payment-proofs")
      .upload(proofPath, proof, {
        contentType: proof.type,
        upsert: false,
      });
    if (error) {
      console.error("[checkout/orders] Payment proof upload failed", {
        stage: "proof_upload",
        code: error.statusCode,
        message: error.message,
      });
      return NextResponse.json(
        { error: "proof_upload_failed" },
        { status: 503 },
      );
    }
  }

  let effectiveVerificationToken = checkout.verificationToken;
  let internalVerificationHash: string | null = null;
  if (!otpEnabled) {
    effectiveVerificationToken = issuePrivateToken();
    internalVerificationHash = hashToken(effectiveVerificationToken);
    const { error } = await admin.from("checkout_phone_verifications").insert({
      phone: checkout.phone,
      token_hash: internalVerificationHash,
    });
    if (error) {
      console.error(
        "[checkout/orders] OTP-disabled verification bridge failed",
        {
          stage: "otp_disabled_bridge",
          code: error.code,
          message: error.message,
        },
      );
      if (proofPath)
        await admin.storage.from("payment-proofs").remove([proofPath]);
      return NextResponse.json(
        { error: "checkout_configuration_error" },
        { status: 503 },
      );
    }
  }

  const trackingToken = issuePrivateToken();
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub ?? null;
  const rpcOrder = {
    customer_name: checkout.customerName,
    email: checkout.email,
    phone: checkout.phone,
    governorate_code: checkout.governorateCode,
    city_code: checkout.cityCode,
    city: checkout.city,
    street_address: checkout.streetAddress,
    building: checkout.building,
    floor: checkout.floor,
    apartment: checkout.apartment,
    landmark: checkout.landmark,
    customer_notes: checkout.customerNotes,
    payment_method: checkout.paymentMethod,
    cod_deposit_method: checkout.codDepositMethod,
    discount_code: checkout.discountCode,
    items: checkout.items.map((item) => ({
      variant_id: item.variantId,
      quantity: item.quantity,
    })),
  };
  await admin.rpc("release_expired_order_reservations");
  const { data, error } = await admin.rpc("create_promotional_order", {
    p_verification_token_hash: hashToken(effectiveVerificationToken),
    p_tracking_token_hash: hashToken(trackingToken),
    p_user_id: userId as string,
    p_order: rpcOrder,
    p_proof_path: proofPath ?? undefined,
  });
  if (error || !data) {
    console.error("[checkout/orders] Transactional order creation failed", {
      stage: "create_promotional_order",
      code: error?.code,
      message: error?.message ?? "No order returned",
    });
    if (proofPath)
      await admin.storage.from("payment-proofs").remove([proofPath]);
    if (internalVerificationHash) {
      await admin
        .from("checkout_phone_verifications")
        .delete()
        .eq("token_hash", internalVerificationHash);
    }
    const databaseMessage = [error?.message, error?.details, error?.hint]
      .filter(Boolean)
      .join(" ");
    const code = databaseMessage.includes("INSUFFICIENT_STOCK")
      ? "insufficient_stock"
      : databaseMessage.includes("VARIANT_UNAVAILABLE")
        ? "item_unavailable"
        : databaseMessage.includes("COD_DEPOSIT_NOT_CONFIGURED")
          ? "cod_deposit_not_configured"
          : databaseMessage.includes("COD_DEPOSIT_METHOD_REQUIRED")
            ? "cod_deposit_method_required"
            : databaseMessage.includes("COD_UNAVAILABLE_FOR_ZONE")
              ? "cod_unavailable_for_zone"
              : databaseMessage.includes("SHIPPING_AREA_UNAVAILABLE")
                ? "shipping_area_unavailable"
                : databaseMessage.includes("INVALID_CITY")
                  ? "invalid_city"
                  : databaseMessage.includes("DISCOUNT_CODE_INVALID")
                    ? "discount_invalid"
                    : databaseMessage.includes("DISCOUNT_CODE_INACTIVE") ||
                        databaseMessage.includes("DISCOUNT_CAMPAIGN_INACTIVE")
                      ? "discount_inactive"
                      : databaseMessage.includes("DISCOUNT_CODE_EXPIRED")
                        ? "discount_expired"
                        : databaseMessage.includes("DISCOUNT_MINIMUM_NOT_MET")
                          ? "discount_minimum_not_met"
                          : databaseMessage.includes(
                                "DISCOUNT_USAGE_LIMIT_REACHED",
                              )
                            ? "discount_usage_limit"
                            : databaseMessage.includes(
                                  "DISCOUNT_CUSTOMER_LIMIT_REACHED",
                                )
                              ? "discount_customer_limit"
                              : databaseMessage.includes(
                                    "DISCOUNT_CAMPAIGN_BUDGET_EXHAUSTED",
                                  )
                                ? "discount_budget_exhausted"
                                : databaseMessage.includes(
                                      "DISCOUNT_NOT_APPLICABLE",
                                    )
                                  ? "discount_not_applicable"
                                  : databaseMessage.includes(
                                        "PAYMENT_PROOF_REQUIRED",
                                      )
                                    ? "payment_proof_required"
                                    : databaseMessage.includes(
                                          "PHONE_VERIFICATION",
                                        )
                                      ? "verification_expired"
                                      : "order_failed";
    return NextResponse.json(
      { error: code },
      { status: code === "order_failed" ? 503 : 409 },
    );
  }

  const order = data as unknown as {
    id: string;
    order_number: string;
    subtotal_minor: number;
    shipping_minor: number;
    discount_minor: number;
    discount_code?: string;
    total_minor: number;
  };

  if (userId) {
    markCartRecovered(userId, order.id).catch((err) => {
      console.error("[checkout/orders] Failed to mark cart recovered:", err);
    });
  }

  let paymentUrl: string | null = null;
  let paymentWarning: string | null = null;
  if (checkout.paymentMethod === "paymob") {
    try {
      const variants = [
        {
          name: `Scrub Vibe order ${order.order_number}`,
          amountMinor: order.total_minor,
          quantity: 1,
        },
      ];
      const intention = await createPaymobIntention({
        orderNumber: order.order_number,
        totalMinor: order.total_minor,
        items: variants,
        checkout,
      });
      paymentUrl = intention.checkoutUrl;
      await admin
        .from("orders")
        .update({
          paymob_intention_id: intention.intentionId,
          paymob_order_id: intention.orderId,
        })
        .eq("id", order.id);
    } catch {
      paymentWarning = "paymob_start_failed";
    }
  }

  // ── Transactional emails (non-blocking — never fail the order response) ──
  const emailOrder: OrderEmailData = {
    order_number: order.order_number,
    customer_name: checkout.customerName,
    email: checkout.email,
    subtotal_minor: order.subtotal_minor,
    shipping_minor: order.shipping_minor,
    discount_minor: order.discount_minor,
    discount_code: order.discount_code ?? null,
    total_minor: order.total_minor,
    payment_method: checkout.paymentMethod,
    items: checkout.items.map((item) => ({
      title_en: item.variantId.toString(),
      title_ar: item.variantId.toString(),
      colour_en: null,
      colour_ar: null,
      size: null,
      quantity: item.quantity,
      line_total_minor: 0, // line totals not returned by RPC — total shown instead
    })),
  };
  try {
    await Promise.allSettled([
      sendEmail(renderOrderPlaced(emailOrder, checkout.locale)),
      sendStaffEmail(
        `[Scrub Vibe] New order #${order.order_number} — EGP ${(order.total_minor / 100).toFixed(2)}`,
        renderStaffNewOrder(emailOrder).html,
      ),
      sendMetaPurchase({
        eventId: order.order_number,
        sourceUrl: `${getSiteOrigin()}/${checkout.locale}/checkout`,
        email: checkout.email,
        phone: checkout.phone,
        valueMinor: order.total_minor,
        productIds: checkout.items.map((item) => String(item.variantId)),
        clientIp: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
        userAgent: request.headers.get("user-agent") ?? undefined,
      }),
    ]);
  } catch (emailError) {
    console.error("[email] Failed to send order placed emails:", emailError);
  }

  return NextResponse.json({
    orderNumber: order.order_number,
    trackingToken,
    paymentUrl,
    paymentWarning,
    totalMinor: order.total_minor,
  });
}
