import { describe, expect, it } from "vitest";
import { getCartRecoveryConfig } from "@/features/cart-recovery/config";
import {
  renderDiscountOffer,
  renderFirstReminder,
  renderSecondReminder,
} from "@/features/cart-recovery/emails";
import {
  createUnsubscribeToken,
  verifyUnsubscribeToken,
} from "@/features/cart-recovery/security";
import {
  isRecoveryStage,
  mapNotificationRow,
  RECOVERY_STAGES,
  type CartItemSnapshot,
  type RecoveryEmailData,
} from "@/features/cart-recovery/types";

describe("Abandoned Cart Recovery", () => {
  const sampleItems: CartItemSnapshot[] = [
    {
      variantId: "101",
      productId: "1",
      slug: "scrub-top-classic",
      titleEn: "Classic Scrub Top",
      titleAr: "قميص سكراب كلاسيك",
      colourEn: "Navy Blue",
      colourAr: "أزرق كحلي",
      size: "M",
      imageUrl: "/images/scrub-vibe/female-collection.webp",
      quantity: 2,
      priceMinor: 99000,
      lineTotalMinor: 198000,
    },
    {
      variantId: "102",
      productId: "2",
      slug: "scrub-pants-cargo",
      titleEn: "Cargo Scrub Pants",
      titleAr: "بنطلون سكراب كارجو",
      colourEn: "Navy Blue",
      colourAr: "أزرق كحلي",
      size: "L",
      imageUrl: "/images/scrub-vibe/female-collection.webp",
      quantity: 1,
      priceMinor: 89000,
      lineTotalMinor: 89000,
    },
  ];

  const sampleEmailData: RecoveryEmailData = {
    customerName: "Dr. Sarah",
    email: "sarah@example.com",
    items: sampleItems,
    cartValueMinor: 287000,
    discountCode: "RECOVER-ABC123",
    discountPercent: 10,
    discountExpiryDate: "2026-09-15",
    restoreCartUrl: "https://scrubvibe.com/en/cart",
    unsubscribeUrl: "https://scrubvibe.com/api/cart/unsubscribe?token=sample.token",
  };

  describe("Configuration", () => {
    it("returns sensible default configuration", () => {
      const config = getCartRecoveryConfig();
      expect(config.enabled).toBe(true);
      expect(config.firstDelayHours).toBe(2);
      expect(config.secondDelayHours).toBe(24);
      expect(config.discountDelayHours).toBe(48);
      expect(config.discountPercent).toBe(10);
      expect(config.discountExpiryHours).toBe(72);
      expect(config.batchSize).toBe(20);
      expect(config.siteUrl).toBeDefined();
    });

    it("parses custom environment values", () => {
      const origEnabled = process.env.CART_RECOVERY_ENABLED;
      const origFirst = process.env.CART_RECOVERY_FIRST_DELAY_HOURS;
      const origPercent = process.env.CART_RECOVERY_DISCOUNT_PERCENT;

      try {
        process.env.CART_RECOVERY_ENABLED = "false";
        process.env.CART_RECOVERY_FIRST_DELAY_HOURS = "4";
        process.env.CART_RECOVERY_DISCOUNT_PERCENT = "15";

        const config = getCartRecoveryConfig();
        expect(config.enabled).toBe(false);
        expect(config.firstDelayHours).toBe(4);
        expect(config.discountPercent).toBe(15);
      } finally {
        process.env.CART_RECOVERY_ENABLED = origEnabled;
        process.env.CART_RECOVERY_FIRST_DELAY_HOURS = origFirst;
        process.env.CART_RECOVERY_DISCOUNT_PERCENT = origPercent;
      }
    });

    it("falls back safely on invalid numeric env values", () => {
      const origBatch = process.env.CART_RECOVERY_BATCH_SIZE;
      try {
        process.env.CART_RECOVERY_BATCH_SIZE = "invalid";
        const config = getCartRecoveryConfig();
        expect(config.batchSize).toBe(20);
      } finally {
        process.env.CART_RECOVERY_BATCH_SIZE = origBatch;
      }
    });
  });

  describe("Types & Stages", () => {
    it("validates recovery stages correctly", () => {
      expect(RECOVERY_STAGES).toEqual([
        "first_reminder",
        "second_reminder",
        "discount_offer",
      ]);
      expect(isRecoveryStage("first_reminder")).toBe(true);
      expect(isRecoveryStage("second_reminder")).toBe(true);
      expect(isRecoveryStage("discount_offer")).toBe(true);
      expect(isRecoveryStage("fourth_reminder")).toBe(false);
      expect(isRecoveryStage("")).toBe(false);
    });

    it("maps raw database row to CartRecoveryNotification domain type", () => {
      const row = {
        id: 42,
        user_id: "u-12345",
        stage: "first_reminder",
        email_sent_to: "user@example.com",
        cart_value_minor: 150000,
        cart_item_count: 2,
        cart_snapshot: sampleItems,
        recovery_discount_code: null,
        recovered_at: null,
        recovered_order_id: null,
        created_at: "2026-09-08T12:00:00Z",
      };

      const notification = mapNotificationRow(row);
      expect(notification.id).toBe(42);
      expect(notification.userId).toBe("u-12345");
      expect(notification.stage).toBe("first_reminder");
      expect(notification.emailSentTo).toBe("user@example.com");
      expect(notification.cartValueMinor).toBe(150000);
      expect(notification.cartItemCount).toBe(2);
      expect(notification.cartSnapshot).toHaveLength(2);
      expect(notification.cartSnapshot[0].titleEn).toBe("Classic Scrub Top");
      expect(notification.recoveryDiscountCode).toBeNull();
      expect(notification.recoveredAt).toBeNull();
    });

    it("parses stringified JSON cart_snapshot in row mapping", () => {
      const row = {
        id: 43,
        user_id: "u-67890",
        stage: "discount_offer",
        email_sent_to: "user2@example.com",
        cart_value_minor: 99000,
        cart_item_count: 1,
        cart_snapshot: JSON.stringify([sampleItems[0]]),
        recovery_discount_code: "RECOVER-123",
        recovered_at: "2026-09-08T14:00:00Z",
        recovered_order_id: "ord-999",
        created_at: "2026-09-08T13:00:00Z",
      };

      const notification = mapNotificationRow(row);
      expect(notification.cartSnapshot).toHaveLength(1);
      expect(notification.recoveryDiscountCode).toBe("RECOVER-123");
      expect(notification.recoveredOrderId).toBe("ord-999");
    });
  });

  describe("Security: Unsubscribe Tokens", () => {
    it("creates and verifies valid unsubscribe tokens", () => {
      const userId = "550e8400-e29b-41d4-a716-446655440000";
      const token = createUnsubscribeToken(userId);

      expect(typeof token).toBe("string");
      expect(token).toContain(".");

      const verifiedUserId = verifyUnsubscribeToken(token);
      expect(verifiedUserId).toBe(userId);
    });

    it("rejects tampered tokens", () => {
      const userId = "550e8400-e29b-41d4-a716-446655440000";
      const token = createUnsubscribeToken(userId);
      const tampered = token.replace("a", "b");

      const result = verifyUnsubscribeToken(tampered);
      expect(result).toBeNull();
    });

    it("rejects malformed tokens", () => {
      expect(verifyUnsubscribeToken("")).toBeNull();
      expect(verifyUnsubscribeToken("not-a-token")).toBeNull();
      expect(verifyUnsubscribeToken("one.two.three")).toBeNull();
      expect(verifyUnsubscribeToken("short.hex")).toBeNull();
    });
  });

  describe("Email Templates", () => {
    describe("Stage 1: First Reminder (2h)", () => {
      it("renders English first reminder with items and restore link", () => {
        const payload = renderFirstReminder(sampleEmailData, "en");
        expect(payload.to).toBe("sarah@example.com");
        expect(payload.subject).toContain("leave something behind");
        expect(payload.html).toContain("Hi Dr. Sarah");
        expect(payload.html).toContain("Classic Scrub Top");
        expect(payload.html).toContain("Navy Blue");
        expect(payload.html).toContain("· M ·");
        expect(payload.html).toContain("EGP 1980.00");
        expect(payload.html).toContain(sampleEmailData.restoreCartUrl);
        expect(payload.html).toContain(sampleEmailData.unsubscribeUrl);
        expect(payload.html).toContain('dir="ltr"');
      });

      it("renders Arabic first reminder with RTL and Arabic copy", () => {
        const payload = renderFirstReminder(sampleEmailData, "ar");
        expect(payload.to).toBe("sarah@example.com");
        expect(payload.subject).toContain("هل نسيت شيئاً في سلتك");
        expect(payload.html).toContain("مرحباً Dr. Sarah");
        expect(payload.html).toContain("قميص سكراب كلاسيك");
        expect(payload.html).toContain("أزرق كحلي");
        expect(payload.html).toContain("العودة إلى السلة");
        expect(payload.html).toContain('dir="rtl"');
      });
    });

    describe("Stage 2: Second Reminder (24h)", () => {
      it("renders English second reminder with urgency notice", () => {
        const payload = renderSecondReminder(sampleEmailData, "en");
        expect(payload.to).toBe("sarah@example.com");
        expect(payload.subject).toContain("scrubs are still waiting");
        expect(payload.html).toContain("Stock is moving quickly");
        expect(payload.html).toContain("Complete your order");
        expect(payload.html).toContain(sampleEmailData.unsubscribeUrl);
      });

      it("renders Arabic second reminder with RTL and Arabic urgency text", () => {
        const payload = renderSecondReminder(sampleEmailData, "ar");
        expect(payload.to).toBe("sarah@example.com");
        expect(payload.subject).toContain("قطعك المفضلة لا تزال بانتظارك");
        expect(payload.html).toContain("المخزون محدود");
        expect(payload.html).toContain("إكمال طلبي الآن");
        expect(payload.html).toContain('dir="rtl"');
      });
    });

    describe("Stage 3: Discount Offer (48h)", () => {
      it("renders English discount offer with code and expiry", () => {
        const payload = renderDiscountOffer(sampleEmailData, "en");
        expect(payload.to).toBe("sarah@example.com");
        expect(payload.subject).toContain("10% off");
        expect(payload.html).toContain("RECOVER-ABC123");
        expect(payload.html).toContain("Valid until 2026-09-15");
        expect(payload.html).toContain("Claim 10% off");
        expect(payload.html).toContain(sampleEmailData.unsubscribeUrl);
      });

      it("renders Arabic discount offer with RTL and Arabic code box", () => {
        const payload = renderDiscountOffer(sampleEmailData, "ar");
        expect(payload.to).toBe("sarah@example.com");
        expect(payload.subject).toContain("خصم 10٪");
        expect(payload.html).toContain("RECOVER-ABC123");
        expect(payload.html).toContain("صالح حتى 2026-09-15");
        expect(payload.html).toContain("تفعيل خصم 10٪");
        expect(payload.html).toContain('dir="rtl"');
      });

      it("uses fallback customer greeting when name is omitted", () => {
        const anonymousData: RecoveryEmailData = {
          ...sampleEmailData,
          customerName: "",
        };
        const enPayload = renderFirstReminder(anonymousData, "en");
        expect(enPayload.html).toContain("Hi there,");

        const arPayload = renderFirstReminder(anonymousData, "ar");
        expect(arPayload.html).toContain("مرحباً عزيزنا العميل،");
      });

      it("handles missing discount expiry date with limited-time copy", () => {
        const noExpiryData: RecoveryEmailData = {
          ...sampleEmailData,
          discountExpiryDate: null,
        };
        const enPayload = renderDiscountOffer(noExpiryData, "en");
        expect(enPayload.html).toContain("For a limited time only");

        const arPayload = renderDiscountOffer(noExpiryData, "ar");
        expect(arPayload.html).toContain("لفترة محدودة فقط");
      });
    });
  });

  describe("Snapshot & Calculation Edge Cases", () => {
    it("handles invalid JSON string gracefully in mapNotificationRow", () => {
      const row = {
        id: 99,
        user_id: "u-invalid",
        stage: "first_reminder",
        email_sent_to: "test@example.com",
        cart_value_minor: 0,
        cart_item_count: 0,
        cart_snapshot: "INVALID_JSON{{[",
        recovery_discount_code: null,
        recovered_at: null,
        recovered_order_id: null,
        created_at: "2026-09-08T12:00:00Z",
      };

      const notification = mapNotificationRow(row);
      expect(notification.cartSnapshot).toEqual([]);
    });

    it("calculates accurate total minor value across multiple quantities", () => {
      const total = sampleItems.reduce((sum, item) => sum + item.lineTotalMinor, 0);
      expect(total).toBe(287000);
      expect(sampleItems[0].lineTotalMinor).toBe(sampleItems[0].priceMinor * sampleItems[0].quantity);
      expect(sampleItems[1].lineTotalMinor).toBe(sampleItems[1].priceMinor * sampleItems[1].quantity);
    });
  });
});
