import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { paymentProofExtension } from "@/features/checkout/payment-proof";
import { hashToken } from "@/features/checkout/security";
import { matchEgyptianPhone } from "@/features/checkout/validation";
import { sendStaffEmail } from "@/features/notifications/email";
import { getSiteOrigin } from "@/features/auth/site-url";
import { formatMoney } from "@/lib/money";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function equalHash(left: string, right: string) {
  const a = Buffer.from(left, "hex");
  const b = Buffer.from(right, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ orderNumber: string }> },
) {
  const { orderNumber } = await context.params;
  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const proof = formData.get("proof");
  const trackingToken = String(formData.get("trackingToken") ?? "");
  const phone = String(formData.get("phone") ?? "");
  const locale = formData.get("locale") === "ar" ? "ar" : "en";
  const ar = locale === "ar";

  if (!(proof instanceof File) || proof.size === 0) {
    return NextResponse.json(
      {
        error: ar
          ? "يرجى اختيار صورة إيصال الدفع."
          : "Please select a payment proof image.",
      },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: order, error: orderError } = await admin
    .from("orders")
    .select(
      "id, order_number, user_id, status, payment_status, payment_method, total_minor, cod_deposit_minor, tracking_token_hash, customer_name, email, phone",
    )
    .eq("order_number", orderNumber.toUpperCase())
    .maybeSingle();

  if (orderError || !order) {
    return NextResponse.json(
      { error: ar ? "الطلب غير موجود." : "Order not found." },
      { status: 404 },
    );
  }

  // Authorize caller: authenticated owner OR valid tracking token OR matching phone
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub ?? null;
  const isOwner = Boolean(userId && userId === order.user_id);

  let isAuthorized = isOwner;
  if (!isAuthorized && trackingToken && trackingToken.length >= 32) {
    isAuthorized = equalHash(hashToken(trackingToken), order.tracking_token_hash);
  }
  if (!isAuthorized && phone) {
    isAuthorized = matchEgyptianPhone(phone, order.phone);
  }

  if (!isAuthorized) {
    return NextResponse.json(
      {
        error: ar
          ? "غير مصرح لك بتحديث هذا الطلب."
          : "Unauthorized to update this order.",
      },
      { status: 401 },
    );
  }

  if (order.status === "cancelled" || order.status === "returned") {
    return NextResponse.json(
      {
        error: ar
          ? "لا يمكن تعديل طلب ملغى أو مرتجع."
          : "Cannot update a cancelled or returned order.",
      },
      { status: 400 },
    );
  }

  const allowedMethods = ["vodafone_cash", "instapay", "cod"];
  if (!allowedMethods.includes(order.payment_method)) {
    return NextResponse.json(
      {
        error: ar
          ? "طريقة الدفع لا تتطلب إيصال دفع."
          : "Payment method does not require a payment proof.",
      },
      { status: 400 },
    );
  }

  // Validate file signature and size
  const extension = await paymentProofExtension(proof);
  if (!extension) {
    return NextResponse.json(
      {
        error: ar
          ? "صيغة الملف غير مدعومة أو الحجم أكبر من ٥ ميجابايت (المدعوم: JPEG, PNG, WEBP)."
          : "Unsupported file or size exceeds 5MB (Supported: JPEG, PNG, WEBP).",
      },
      { status: 400 },
    );
  }

  // 1. Remove previous proof file(s) and previous database records to replace the old proof
  const { data: oldProofs } = await admin
    .from("payment_proofs")
    .select("id, storage_path")
    .eq("order_id", order.id);

  if (oldProofs && oldProofs.length > 0) {
    const pathsToRemove = oldProofs.map((p) => p.storage_path).filter(Boolean);
    if (pathsToRemove.length > 0) {
      await admin.storage.from("payment-proofs").remove(pathsToRemove);
    }
    await admin.from("payment_proofs").delete().eq("order_id", order.id);
  }

  // 2. Upload new proof file to storage
  const newProofPath = `submissions/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await admin.storage
    .from("payment-proofs")
    .upload(newProofPath, proof, {
      contentType: proof.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("[payment-proof] Storage upload failed", uploadError);
    return NextResponse.json(
      {
        error: ar
          ? "فشل رفع الملف إلى الخادم. يرجى المحاولة لاحقاً."
          : "Failed to upload file to storage. Please try again.",
      },
      { status: 503 },
    );
  }

  // 3. Insert fresh payment_proofs record with status 'pending'
  const proofAmount =
    order.payment_method === "cod"
      ? order.cod_deposit_minor
      : order.total_minor;

  const { error: proofInsertError } = await admin
    .from("payment_proofs")
    .insert({
      order_id: order.id,
      storage_path: newProofPath,
      status: "pending",
      submitted_by: userId ?? null,
      amount_minor: proofAmount,
    });

  if (proofInsertError) {
    console.error("[payment-proof] Proof record insertion failed", proofInsertError);
    await admin.storage.from("payment-proofs").remove([newProofPath]);
    return NextResponse.json(
      {
        error: ar
          ? "تعذر تسجيل الإيصال في النظام."
          : "Could not register proof in database.",
      },
      { status: 500 },
    );
  }

  // 4. Update order status to payment_review & payment_status to proof_submitted
  await admin
    .from("orders")
    .update({
      status: "payment_review",
      payment_status: "proof_submitted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  // 5. Append audit note to order_status_history
  await admin.from("order_status_history").insert({
    order_id: order.id,
    status: "payment_review",
    payment_status: "proof_submitted",
    note: ar
      ? "تم رفع إيصال دفع بديل بواسطة العميل وهو قيد المراجعة"
      : "Replacement payment confirmation uploaded by customer and under review",
    actor_id: userId ?? null,
  });

  // 6. Revalidate routes
  revalidatePath(`/${locale}/track/${order.order_number}`);
  revalidatePath(`/${locale}/account`);
  revalidatePath(`/${locale}/admin/orders`);

  // 7. Notify staff by email
  try {
    const formattedAmount = formatMoney(proofAmount, locale);
    await sendStaffEmail(
      `New Payment Proof Uploaded #${order.order_number}`,
      `<p>Customer <strong>${order.customer_name}</strong> uploaded a replacement payment confirmation for order <strong>#${order.order_number}</strong>.</p><p>Amount: ${formattedAmount}</p><p><a href="${getSiteOrigin()}/${locale}/admin/orders?status=payment_review">Review Order in Admin Dashboard</a></p>`,
    );
  } catch (emailErr) {
    console.warn("[payment-proof] Staff notification failed non-fatally", emailErr);
  }

  return NextResponse.json({
    success: true,
    message: ar
      ? "تم إرسال إيصال الدفع الجديد بنجاح وهو قيد المراجعة حالياً."
      : "New payment confirmation submitted successfully and is now under review.",
    status: "payment_review",
    payment_status: "proof_submitted",
  });
}
