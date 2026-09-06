import { NextResponse } from "next/server";
import { verifyPaymobHmac } from "@/features/checkout/paymob";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const hmac = new URL(request.url).searchParams.get("hmac") ?? "";
  const body = await request.json().catch(() => null) as { obj?: Record<string, unknown> } | null;
  const transaction = body?.obj;
  if (!transaction || !verifyPaymobHmac(transaction, hmac)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }
  const order = transaction.order as Record<string, unknown> | undefined;
  const orderNumber = String(
    transaction.special_reference ?? order?.merchant_order_id ?? order?.special_reference ?? "",
  );
  const amount = Number(transaction.amount_cents ?? 0);
  const success = transaction.success === true && transaction.pending !== true;
  if (!orderNumber || !Number.isSafeInteger(amount)) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
  const { error } = await createAdminClient().rpc("process_paymob_callback", {
    p_order_number: orderNumber,
    p_transaction_id: String(transaction.id ?? ""),
    p_external_order_id: String(order?.id ?? ""),
    p_success: success,
    p_amount_minor: amount,
  });
  if (error) return NextResponse.json({ error: "processing_failed" }, { status: 409 });
  return NextResponse.json({ received: true });
}
