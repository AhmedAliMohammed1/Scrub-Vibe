import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";
import type {
  AbandonedCartCandidate,
  CartItemSnapshot,
  CartRecoveryNotification,
  RecoveryStage,
  RecoveryStats,
} from "./types";
import { mapNotificationRow } from "./types";

export async function findCandidates(
  stage: RecoveryStage,
  delayHours: number,
  limit = 20,
): Promise<AbandonedCartCandidate[]> {
  const admin = createAdminClient();

  const { data, error } = await admin.rpc("find_abandoned_cart_candidates", {
    p_stage: stage,
    p_delay_hours: delayHours,
    p_limit: limit,
  });

  if (error || !data) {
    console.error("[cart-recovery/findCandidates] Error querying candidates:", error);
    return [];
  }

  const list = (Array.isArray(data) ? data : []) as Record<string, unknown>[];

  return list.map((row) => {
    const rawItems = (Array.isArray(row.items) ? row.items : []) as Record<string, unknown>[];
    const items: CartItemSnapshot[] = rawItems.map((item) => ({
      variantId: String(item.variant_id ?? ""),
      productId: String(item.product_id ?? ""),
      slug: String(item.slug ?? ""),
      titleEn: String(item.title_en ?? "Scrub Vibe"),
      titleAr: String(item.title_ar ?? "سكراب فايب"),
      colourEn: typeof item.colour_en === "string" ? item.colour_en : null,
      colourAr: typeof item.colour_ar === "string" ? item.colour_ar : null,
      size: typeof item.size === "string" ? item.size : null,
      imageUrl: typeof item.image_url === "string" ? item.image_url : null,
      quantity: Number(item.quantity ?? 1),
      priceMinor: Number(item.price_minor ?? 0),
      lineTotalMinor: Number(item.line_total_minor ?? 0),
    }));

    return {
      userId: String(row.user_id ?? ""),
      email: String(row.email ?? ""),
      fullName: typeof row.full_name === "string" ? row.full_name : null,
      locale: row.locale === "ar" ? "ar" : "en",
      cartValueMinor: Number(row.cart_value_minor ?? 0),
      cartItemCount: Number(row.cart_item_count ?? items.length),
      lastCartActivityAt: String(row.last_cart_activity_at ?? new Date().toISOString()),
      items,
    };
  });
}

export async function recordNotification(params: {
  userId: string;
  stage: RecoveryStage;
  emailSentTo: string;
  cartValueMinor: number;
  cartItemCount: number;
  cartSnapshot: CartItemSnapshot[];
  recoveryDiscountCode?: string | null;
}): Promise<number | null> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("abandoned_cart_notifications")
    .insert({
      user_id: params.userId,
      stage: params.stage,
      email_sent_to: params.emailSentTo,
      cart_value_minor: params.cartValueMinor,
      cart_item_count: params.cartItemCount,
      cart_snapshot: params.cartSnapshot as unknown as Json,
      recovery_discount_code: params.recoveryDiscountCode ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[cart-recovery/recordNotification] Failed to record notification:", error);
    return null;
  }

  return data?.id ? Number(data.id) : null;
}

export async function markCartRecovered(
  userId: string,
  orderId: string,
): Promise<number> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("abandoned_cart_notifications")
    .update({
      recovered_at: new Date().toISOString(),
      recovered_order_id: orderId,
    })
    .eq("user_id", userId)
    .is("recovered_at", null)
    .select("id");

  if (error) {
    console.error("[cart-recovery/markCartRecovered] Failed to mark recovery:", error);
    return 0;
  }

  return (data ?? []).length;
}

export async function optOutUserFromCartRecovery(userId: string): Promise<boolean> {
  const admin = createAdminClient();

  const { error } = await admin
    .from("profiles")
    .update({ cart_recovery_opt_out: true })
    .eq("id", userId);

  if (error) {
    console.error("[cart-recovery/optOutUser] Failed to update opt-out:", error);
    return false;
  }

  return true;
}

export async function getRecoveryStats(): Promise<RecoveryStats> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("abandoned_cart_notifications")
    .select("stage, recovered_at, cart_value_minor");

  if (error || !data) {
    console.error("[cart-recovery/getRecoveryStats] Failed to fetch stats:", error);
    return {
      totalSent: 0,
      totalRecovered: 0,
      recoveryRatePercent: 0,
      recoveredRevenueMinor: 0,
      byStage: {
        firstReminder: { sent: 0, recovered: 0 },
        secondReminder: { sent: 0, recovered: 0 },
        discountOffer: { sent: 0, recovered: 0 },
      },
    };
  }

  let totalSent = 0;
  let totalRecovered = 0;
  let recoveredRevenueMinor = 0;

  const byStage = {
    firstReminder: { sent: 0, recovered: 0 },
    secondReminder: { sent: 0, recovered: 0 },
    discountOffer: { sent: 0, recovered: 0 },
  };

  for (const row of data) {
    totalSent += 1;
    const isRecovered = Boolean(row.recovered_at);
    if (isRecovered) {
      totalRecovered += 1;
      recoveredRevenueMinor += Number(row.cart_value_minor ?? 0);
    }

    if (row.stage === "first_reminder") {
      byStage.firstReminder.sent += 1;
      if (isRecovered) byStage.firstReminder.recovered += 1;
    } else if (row.stage === "second_reminder") {
      byStage.secondReminder.sent += 1;
      if (isRecovered) byStage.secondReminder.recovered += 1;
    } else if (row.stage === "discount_offer") {
      byStage.discountOffer.sent += 1;
      if (isRecovered) byStage.discountOffer.recovered += 1;
    }
  }

  const recoveryRatePercent =
    totalSent > 0 ? Math.round((totalRecovered / totalSent) * 1000) / 10 : 0;

  return {
    totalSent,
    totalRecovered,
    recoveryRatePercent,
    recoveredRevenueMinor,
    byStage,
  };
}

export async function getRecentNotifications(
  limit = 20,
): Promise<CartRecoveryNotification[]> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("abandoned_cart_notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return (data as Record<string, unknown>[]).map(mapNotificationRow);
}
