export const RECOVERY_STAGES = [
  "first_reminder",
  "second_reminder",
  "discount_offer",
] as const;

export type RecoveryStage = (typeof RECOVERY_STAGES)[number];

export function isRecoveryStage(value: string): value is RecoveryStage {
  return RECOVERY_STAGES.includes(value as RecoveryStage);
}

export interface CartItemSnapshot {
  variantId: string;
  productId: string;
  slug: string;
  titleEn: string;
  titleAr: string;
  colourEn: string | null;
  colourAr: string | null;
  size: string | null;
  imageUrl: string | null;
  quantity: number;
  priceMinor: number;
  lineTotalMinor: number;
}

export interface AbandonedCartCandidate {
  userId: string;
  email: string;
  fullName: string | null;
  locale: "en" | "ar";
  cartValueMinor: number;
  cartItemCount: number;
  lastCartActivityAt: string;
  items: CartItemSnapshot[];
}

export interface CartRecoveryNotification {
  id: number;
  userId: string;
  stage: RecoveryStage;
  emailSentTo: string;
  cartValueMinor: number;
  cartItemCount: number;
  cartSnapshot: CartItemSnapshot[];
  recoveryDiscountCode: string | null;
  recoveredAt: string | null;
  recoveredOrderId: string | null;
  createdAt: string;
}

export interface RecoveryEmailData {
  customerName: string;
  email: string;
  items: CartItemSnapshot[];
  cartValueMinor: number;
  discountCode?: string | null;
  discountPercent?: number | null;
  discountExpiryDate?: string | null;
  restoreCartUrl: string;
  unsubscribeUrl: string;
}

export interface RecoveryStats {
  totalSent: number;
  totalRecovered: number;
  recoveryRatePercent: number;
  recoveredRevenueMinor: number;
  byStage: {
    firstReminder: { sent: number; recovered: number };
    secondReminder: { sent: number; recovered: number };
    discountOffer: { sent: number; recovered: number };
  };
}

export function mapNotificationRow(
  row: Record<string, unknown>,
): CartRecoveryNotification {
  let snapshot: CartItemSnapshot[] = [];
  if (Array.isArray(row.cart_snapshot)) {
    snapshot = row.cart_snapshot as unknown as CartItemSnapshot[];
  } else if (typeof row.cart_snapshot === "string") {
    try {
      snapshot = JSON.parse(row.cart_snapshot) as CartItemSnapshot[];
    } catch {
      snapshot = [];
    }
  }

  return {
    id: Number(row.id),
    userId: String(row.user_id),
    stage: String(row.stage) as RecoveryStage,
    emailSentTo: String(row.email_sent_to),
    cartValueMinor: Number(row.cart_value_minor ?? 0),
    cartItemCount: Number(row.cart_item_count ?? 0),
    cartSnapshot: snapshot,
    recoveryDiscountCode:
      typeof row.recovery_discount_code === "string"
        ? row.recovery_discount_code
        : null,
    recoveredAt:
      typeof row.recovered_at === "string" ? row.recovered_at : null,
    recoveredOrderId:
      typeof row.recovered_order_id === "string"
        ? row.recovered_order_id
        : null,
    createdAt: String(row.created_at),
  };
}
