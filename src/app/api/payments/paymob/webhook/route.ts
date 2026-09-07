import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import {
  isConfiguredPaymobIntegration,
} from "@/features/checkout/paymob-config";
import { verifyPaymobHmac } from "@/features/checkout/paymob-webhook";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const hmac = new URL(request.url).searchParams.get("hmac") ?? "";
  const rawBody = await request.text();
  type PaymobCallbackBody = {
    type?: unknown;
    obj?: Record<string, unknown>;
  };
  let body: PaymobCallbackBody | null = null;
  try {
    body = JSON.parse(rawBody) as PaymobCallbackBody;
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
  const transaction = body?.obj;
  if (
    String(body?.type ?? "TRANSACTION").toUpperCase() !== "TRANSACTION" ||
    !transaction ||
    !verifyPaymobHmac(transaction, hmac)
  ) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }
  const order = transaction.order as Record<string, unknown> | undefined;
  const orderNumber = String(
    transaction.special_reference ?? order?.merchant_order_id ?? order?.special_reference ?? "",
  );
  const amount = Number(transaction.amount_cents ?? 0);
  const transactionId = String(transaction.id ?? "");
  const externalOrderId = String(order?.id ?? "");
  const integrationId = Number(transaction.integration_id ?? 0);
  const currency = String(transaction.currency ?? "").toUpperCase();
  const success = transaction.success === true && transaction.pending !== true;
  if (
    !orderNumber ||
    !transactionId ||
    !externalOrderId ||
    !Number.isSafeInteger(amount) ||
    amount <= 0 ||
    !isConfiguredPaymobIntegration(integrationId)
  ) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }
  const { data, error } = await createAdminClient().rpc("process_paymob_callback", {
    p_event_id: `transaction:${transactionId}`,
    p_order_number: orderNumber,
    p_transaction_id: transactionId,
    p_external_order_id: externalOrderId,
    p_integration_id: integrationId,
    p_success: success,
    p_amount_minor: amount,
    p_currency: currency,
    p_payload_digest: createHash("sha256").update(rawBody).digest("hex"),
  });
  if (error) {
    console.error("[paymob/webhook] Processing failed", {
      code: error.code,
      message: error.message,
      transactionId,
    });
    return NextResponse.json({ error: "processing_failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true, result: data });
}
