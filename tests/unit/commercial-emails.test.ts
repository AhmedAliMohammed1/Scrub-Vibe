import { describe, expect, it } from "vitest";
import {
  renderBackInStock,
  renderBackInStockSubscription,
  renderReturnSubmitted,
  renderReturnUpdate,
} from "@/features/notifications/email";

describe("commercial lifecycle emails", () => {
  it("renders a localized stock subscription confirmation", () => {
    const email = renderBackInStockSubscription({
      email: "doctor@example.com",
      locale: "ar",
      productUrl: "https://scrubvibe.example/ar/products/design-9",
      unsubscribeUrl:
        "https://scrubvibe.example/api/stock/unsubscribe?token=safe",
    });
    expect(email.to).toBe("doctor@example.com");
    expect(email.html).toContain('dir="rtl"');
    expect(email.html).toContain("إلغاء التنبيه");
  });

  it("renders a back-in-stock call to action", () => {
    const email = renderBackInStock({
      email: "doctor@example.com",
      locale: "en",
      productName: "Design 9",
      productUrl: "https://scrubvibe.example/en/products/design-9",
    });
    expect(email.subject).toContain("Design 9");
    expect(email.html).toContain("Shop now");
  });

  it("renders submitted and updated return messages", () => {
    const input = {
      email: "doctor@example.com",
      customerName: "Mona",
      orderNumber: "SV-100",
      returnNumber: "SVR-2026-ABCD",
      requestType: "exchange",
      locale: "en" as const,
    };
    expect(renderReturnSubmitted(input).html).toContain("SV-100");
    expect(
      renderReturnUpdate({
        ...input,
        status: "approved",
        resolution: "exchange",
        refundAmountMinor: 0,
        refundMethod: null,
        refundReference: null,
        note: "Bring the item sealed.",
      }).html,
    ).toContain("Bring the item sealed.");
  });

  it("escapes customer-facing return notes and includes refund settlement details", () => {
    const email = renderReturnUpdate({
      email: "doctor@example.com",
      customerName: "Mona <script>",
      orderNumber: "SV-100",
      returnNumber: "SVR-2026-ABCD",
      requestType: "return",
      status: "completed",
      resolution: "refund",
      refundAmountMinor: 42550,
      refundMethod: "instapay",
      refundReference: "IPN-42",
      note: "Sent <b>today</b>",
      locale: "en",
    });
    expect(email.html).toContain("EGP 425.50");
    expect(email.html).toContain("InstaPay");
    expect(email.html).toContain("IPN-42");
    expect(email.html).toContain("Sent &lt;b&gt;today&lt;/b&gt;");
    expect(email.html).not.toContain("<script>");
  });
});
