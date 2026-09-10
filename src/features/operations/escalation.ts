import "server-only";

import { getOperationsConfig } from "@/features/operations/config";
import { sendStaffEmail } from "@/features/notifications/email";
import { createAdminClient } from "@/lib/supabase/admin";

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

export type OperationsEscalation = {
  expiredReservationsReleased: number;
  staleProofs: number;
  stalePaymentReviews: number;
  rejectedWebhooks: number;
  alerted: boolean;
};

export async function processOperationsEscalation(): Promise<OperationsEscalation> {
  const config = getOperationsConfig();
  const admin = createAdminClient();
  const [release, proofs, reviews, webhooks] = await Promise.all([
    admin.rpc("release_expired_order_reservations"),
    admin
      .from("payment_proofs")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .lte("created_at", hoursAgo(config.proofReviewHours)),
    admin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "payment_review")
      .lte("updated_at", hoursAgo(config.paymentReviewHours)),
    admin
      .from("payment_webhook_events")
      .select("id", { count: "exact", head: true })
      .eq("outcome", "rejected")
      .gte("received_at", hoursAgo(config.webhookLookbackHours)),
  ]);

  const errors = [
    release.error,
    proofs.error,
    reviews.error,
    webhooks.error,
  ].filter(Boolean);
  if (errors.length) {
    throw new Error("Operational database scan failed");
  }

  const result = {
    expiredReservationsReleased: Number(release.data ?? 0),
    staleProofs: proofs.count ?? 0,
    stalePaymentReviews: reviews.count ?? 0,
    rejectedWebhooks: webhooks.count ?? 0,
  };
  const alerted =
    result.staleProofs > 0 ||
    result.stalePaymentReviews > 0 ||
    result.rejectedWebhooks > 0;

  if (alerted) {
    await sendStaffEmail(
      "[Scrub Vibe] Production operations action required",
      `<p>The daily operations scan found work requiring attention.</p><ul><li>Payment proofs waiting more than ${config.proofReviewHours}h: <strong>${result.staleProofs}</strong></li><li>Orders in payment review more than ${config.paymentReviewHours}h: <strong>${result.stalePaymentReviews}</strong></li><li>Rejected Paymob callbacks in the last ${config.webhookLookbackHours}h: <strong>${result.rejectedWebhooks}</strong></li><li>Expired reservations released: <strong>${result.expiredReservationsReleased}</strong></li></ul><p>Open the orders dashboard and Vercel runtime logs, then follow the payment incident runbook.</p>`,
    );
  }

  return { ...result, alerted };
}
