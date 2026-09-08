import "server-only";

import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/features/notifications/email";
import { getCartRecoveryConfig } from "./config";
import {
  renderDiscountOffer,
  renderFirstReminder,
  renderSecondReminder,
} from "./emails";
import { findCandidates, recordNotification } from "./repository";
import { createUnsubscribeToken } from "./security";
import type { AbandonedCartCandidate, RecoveryStage } from "./types";

let cachedCampaignId: number | null = null;

async function getOrCreateRecoveryCampaign(): Promise<number | null> {
  if (cachedCampaignId) return cachedCampaignId;

  const admin = createAdminClient();

  // 1. Look for existing cart recovery campaign
  const { data: existing } = await admin
    .from("discount_campaigns")
    .select("id")
    .eq("utm_campaign", "cart_recovery")
    .maybeSingle();

  if (existing?.id) {
    cachedCampaignId = Number(existing.id);
    return cachedCampaignId;
  }

  // 2. Create default recovery campaign if not found
  const today = new Date().toISOString().slice(0, 10);
  const { data: created, error } = await admin
    .from("discount_campaigns")
    .insert({
      name_en: "Cart Recovery",
      name_ar: "استعادة السلات المتروكة",
      description_en: "Automated discounts for abandoned cart recovery",
      description_ar: "أكواد خصم تلقائية لاستعادة سلات التسوق المتروكة",
      channel: "email",
      utm_campaign: "cart_recovery",
      starts_on: today,
      ends_on: "2030-12-31",
      is_active: true,
    })
    .select("id")
    .single();

  if (error || !created) {
    console.error("[cart-recovery/campaign] Could not create campaign:", error);
    return null;
  }

  cachedCampaignId = Number(created.id);
  return cachedCampaignId;
}

export async function createRecoveryDiscountCode(
  discountPercent: number,
  expiryHours: number,
): Promise<{ code: string; expiryDateString: string } | null> {
  const campaignId = await getOrCreateRecoveryCampaign();
  const admin = createAdminClient();

  const randomPart = randomBytes(3).toString("hex").toUpperCase();
  const code = `RECOVER-${randomPart}`;

  const now = new Date();
  const expiryDate = new Date(now.getTime() + expiryHours * 60 * 60 * 1000);
  const todayStr = now.toISOString().slice(0, 10);
  const endsOnStr = expiryDate.toISOString().slice(0, 10);

  // Percentage value stored as basis points (e.g. 10% = 1000)
  const basisPoints = Math.round(discountPercent * 100);

  const { error } = await admin.from("discount_codes").insert({
    campaign_id: campaignId,
    code,
    discount_type: "percentage",
    value: basisPoints,
    minimum_subtotal_minor: 0,
    per_customer_limit: 1,
    usage_limit: 1,
    starts_on: todayStr,
    ends_on: endsOnStr,
    is_active: true,
  });

  if (error) {
    console.error("[cart-recovery/createDiscountCode] Failed to create discount code:", error);
    return null;
  }

  return { code, expiryDateString: endsOnStr };
}

export async function processAbandonedCarts(): Promise<{
  processed: number;
  sent: number;
  errors: string[];
}> {
  const config = getCartRecoveryConfig();
  if (!config.enabled) {
    return {
      processed: 0,
      sent: 0,
      errors: ["Cart recovery feature is disabled in configuration"],
    };
  }

  const stages: { stage: RecoveryStage; delayHours: number }[] = [
    { stage: "first_reminder", delayHours: config.firstDelayHours },
    { stage: "second_reminder", delayHours: config.secondDelayHours },
    { stage: "discount_offer", delayHours: config.discountDelayHours },
  ];

  let totalProcessed = 0;
  let totalSent = 0;
  const errors: string[] = [];

  for (const { stage, delayHours } of stages) {
    let candidates: AbandonedCartCandidate[] = [];
    try {
      candidates = await findCandidates(stage, delayHours, config.batchSize);
    } catch (err) {
      const msg = `Error finding candidates for ${stage}: ${err instanceof Error ? err.message : String(err)}`;
      console.error("[cart-recovery/process]", msg);
      errors.push(msg);
      continue;
    }

    for (const candidate of candidates) {
      totalProcessed += 1;
      try {
        const unsubscribeToken = createUnsubscribeToken(candidate.userId);
        const unsubscribeUrl = `${config.siteUrl}/api/cart/unsubscribe?token=${unsubscribeToken}`;

        let discountCode: string | null = null;
        let discountExpiryDate: string | null = null;

        if (stage === "discount_offer") {
          const discountInfo = await createRecoveryDiscountCode(
            config.discountPercent,
            config.discountExpiryHours,
          );
          if (discountInfo) {
            discountCode = discountInfo.code;
            discountExpiryDate = discountInfo.expiryDateString;
          }
        }

        const restoreCartUrl =
          stage === "discount_offer" && discountCode
            ? `${config.siteUrl}/${candidate.locale}/checkout?discount=${discountCode}`
            : `${config.siteUrl}/${candidate.locale}/cart`;

        const emailData = {
          customerName: candidate.fullName ?? "",
          email: candidate.email,
          items: candidate.items,
          cartValueMinor: candidate.cartValueMinor,
          discountCode,
          discountPercent: config.discountPercent,
          discountExpiryDate,
          restoreCartUrl,
          unsubscribeUrl,
        };

        const payload =
          stage === "first_reminder"
            ? renderFirstReminder(emailData, candidate.locale)
            : stage === "second_reminder"
              ? renderSecondReminder(emailData, candidate.locale)
              : renderDiscountOffer(emailData, candidate.locale);

        await sendEmail(payload);

        await recordNotification({
          userId: candidate.userId,
          stage,
          emailSentTo: candidate.email,
          cartValueMinor: candidate.cartValueMinor,
          cartItemCount: candidate.cartItemCount,
          cartSnapshot: candidate.items,
          recoveryDiscountCode: discountCode,
        });

        totalSent += 1;
      } catch (sendErr) {
        const msg = `Failed to process candidate ${candidate.userId} at stage ${stage}: ${sendErr instanceof Error ? sendErr.message : String(sendErr)}`;
        console.error("[cart-recovery/process]", msg);
        errors.push(msg);
      }
    }
  }

  return {
    processed: totalProcessed,
    sent: totalSent,
    errors,
  };
}
