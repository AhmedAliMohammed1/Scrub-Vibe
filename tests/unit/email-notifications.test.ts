/**
 * Unit tests for transactional email notification templates and send helpers.
 * These tests run entirely in-process with no network calls.
 * Resend is never imported — we only test the pure TypeScript template functions
 * and the console-fallback behaviour of sendEmail.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import {
  renderOrderPlaced,
  renderPaymentApproved,
  renderOrderShipped,
  renderOrderProcessing,
  renderOrderOutForDelivery,
  renderOrderDelivered,
  renderOrderCancelled,
  renderOrderStatusNote,
  renderStaffNewOrder,
  renderStaffProofSubmitted,
  sendEmail,
  sendStaffEmail,
  formatPriceMajor,
  getFromAddress,
  getStaffEmail,
  type OrderEmailData,
} from "../../src/features/notifications/email";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ITEMS: OrderEmailData["items"] = [
  {
    title_en: "Classic Scrub Top",
    title_ar: "قميص سكراب كلاسيك",
    colour_en: "Navy",
    colour_ar: "كحلي",
    size: "M",
    quantity: 2,
    line_total_minor: 19800,
  },
  {
    title_en: "Scrub Pants",
    title_ar: "بنطال سكراب",
    colour_en: null,
    colour_ar: null,
    size: "L",
    quantity: 1,
    line_total_minor: 14900,
  },
];

const ORDER: OrderEmailData = {
  order_number: "SV-1001",
  customer_name: "Ahmed Ali",
  email: "ahmed@example.com",
  subtotal_minor: 34700,
  shipping_minor: 5000,
  total_minor: 39700,
  payment_method: "vodafone_cash",
  courier: "Aramex",
  shipment_number: "ARX-9988776",
  tracking_url: "https://track.aramex.com/ARX-9988776",
  items: ITEMS,
};

// ---------------------------------------------------------------------------
// formatPriceMajor
// ---------------------------------------------------------------------------

describe("formatPriceMajor", () => {
  it("formats 5000 piastres as EGP 50.00", () => {
    expect(formatPriceMajor(5000)).toBe("EGP 50.00");
  });

  it("formats 100 piastres as EGP 1.00", () => {
    expect(formatPriceMajor(100)).toBe("EGP 1.00");
  });

  it("formats 0 piastres as EGP 0.00", () => {
    expect(formatPriceMajor(0)).toBe("EGP 0.00");
  });

  it("formats 39700 piastres as EGP 397.00", () => {
    expect(formatPriceMajor(39700)).toBe("EGP 397.00");
  });
});

// ---------------------------------------------------------------------------
// getFromAddress & getStaffEmail
// ---------------------------------------------------------------------------

describe("getFromAddress", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to onboarding@resend.dev when RESEND_FROM_EMAIL is not set", () => {
    vi.stubEnv("RESEND_FROM_EMAIL", "");
    expect(getFromAddress()).toBe("Scrub Vibe <onboarding@resend.dev>");
  });

  it("falls back to onboarding@resend.dev when given a @gmail.com address", () => {
    vi.stubEnv("RESEND_FROM_EMAIL", "mytest@gmail.com");
    expect(getFromAddress()).toBe("Scrub Vibe <onboarding@resend.dev>");
  });

  it("falls back to onboarding@resend.dev when given a @yahoo.com address", () => {
    vi.stubEnv("RESEND_FROM_EMAIL", "store@yahoo.com");
    expect(getFromAddress()).toBe("Scrub Vibe <onboarding@resend.dev>");
  });

  it("uses custom verified domain when provided", () => {
    vi.stubEnv("RESEND_FROM_EMAIL", "noreply@scrub-vibe.com");
    expect(getFromAddress()).toBe("Scrub Vibe <noreply@scrub-vibe.com>");
  });
});

describe("getStaffEmail", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns trimmed staff email when set", () => {
    vi.stubEnv("STAFF_EMAIL", "  ops@scrub-vibe.com  ");
    expect(getStaffEmail()).toBe("ops@scrub-vibe.com");
  });

  it("returns empty string when unset", () => {
    vi.stubEnv("STAFF_EMAIL", "");
    expect(getStaffEmail()).toBe("");
  });
});

// ---------------------------------------------------------------------------
// renderOrderPlaced
// ---------------------------------------------------------------------------

describe("renderOrderPlaced", () => {
  it("EN: includes order number in subject", () => {
    const { subject } = renderOrderPlaced(ORDER, "en");
    expect(subject).toContain("SV-1001");
  });

  it("EN: email goes to customer address", () => {
    const { to } = renderOrderPlaced(ORDER, "en");
    expect(to).toBe("ahmed@example.com");
  });

  it("EN: HTML contains customer name", () => {
    const { html } = renderOrderPlaced(ORDER, "en");
    expect(html).toContain("Ahmed Ali");
  });

  it("EN: HTML contains formatted total", () => {
    const { html } = renderOrderPlaced(ORDER, "en");
    expect(html).toContain("EGP 397.00");
  });

  it("EN: HTML contains item title", () => {
    const { html } = renderOrderPlaced(ORDER, "en");
    expect(html).toContain("Classic Scrub Top");
  });

  it("AR: subject is in Arabic", () => {
    const { subject } = renderOrderPlaced(ORDER, "ar");
    expect(subject).toContain("تم استلام طلبك");
    expect(subject).toContain("SV-1001");
  });

  it("AR: HTML is RTL", () => {
    const { html } = renderOrderPlaced(ORDER, "ar");
    expect(html).toContain('dir="rtl"');
  });

  it("AR: HTML contains Arabic item title", () => {
    const { html } = renderOrderPlaced(ORDER, "ar");
    expect(html).toContain("قميص سكراب كلاسيك");
  });

  it("returns valid HTML structure", () => {
    const { html } = renderOrderPlaced(ORDER, "en");
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("</html>");
    expect(html).toContain("SCRUB VIBE");
  });
});

// ---------------------------------------------------------------------------
// renderPaymentApproved
// ---------------------------------------------------------------------------

describe("renderPaymentApproved", () => {
  it("EN: subject mentions payment and order number", () => {
    const { subject } = renderPaymentApproved(ORDER, "en");
    expect(subject).toContain("Payment approved");
    expect(subject).toContain("SV-1001");
  });

  it("EN: HTML contains confirmation message", () => {
    const { html } = renderPaymentApproved(ORDER, "en");
    expect(html).toContain("confirmed");
    expect(html).toContain("SV-1001");
  });

  it("AR: subject is in Arabic", () => {
    const { subject } = renderPaymentApproved(ORDER, "ar");
    expect(subject).toContain("تم قبول دفعتك");
  });

  it("AR: HTML contains Arabic confirmation text", () => {
    const { html } = renderPaymentApproved(ORDER, "ar");
    expect(html).toContain("تم تأكيد الطلب");
  });

  it("email goes to customer address", () => {
    const { to } = renderPaymentApproved(ORDER, "en");
    expect(to).toBe("ahmed@example.com");
  });
});

// ---------------------------------------------------------------------------
// renderOrderShipped
// ---------------------------------------------------------------------------

describe("renderOrderShipped", () => {
  it("EN: subject mentions order in transit", () => {
    const { subject } = renderOrderShipped(ORDER, "en");
    expect(subject).toContain("on its way");
    expect(subject).toContain("SV-1001");
  });

  it("EN: HTML contains courier name", () => {
    const { html } = renderOrderShipped(ORDER, "en");
    expect(html).toContain("Aramex");
  });

  it("EN: HTML contains tracking number", () => {
    const { html } = renderOrderShipped(ORDER, "en");
    expect(html).toContain("ARX-9988776");
  });

  it("EN: HTML contains tracking URL as a link", () => {
    const { html } = renderOrderShipped(ORDER, "en");
    expect(html).toContain("https://track.aramex.com/ARX-9988776");
  });

  it("AR: subject is in Arabic", () => {
    const { subject } = renderOrderShipped(ORDER, "ar");
    expect(subject).toContain("طلبك في الطريق إليك");
  });

  it("omits tracking button when tracking_url is null", () => {
    const orderNoTracking: OrderEmailData = { ...ORDER, tracking_url: null };
    const { html } = renderOrderShipped(orderNoTracking, "en");
    expect(html).not.toContain("Track your order");
  });

  it("omits courier section when both courier and shipment_number are null", () => {
    const orderNoCourier: OrderEmailData = {
      ...ORDER,
      courier: null,
      shipment_number: null,
      tracking_url: null,
    };
    const { html } = renderOrderShipped(orderNoCourier, "en");
    expect(html).not.toContain("Courier");
    expect(html).not.toContain("Tracking number");
  });
});

// ---------------------------------------------------------------------------
// renderStaffNewOrder
// ---------------------------------------------------------------------------

describe("renderStaffNewOrder", () => {
  it("subject includes order number and total", () => {
    const { subject } = renderStaffNewOrder(ORDER);
    expect(subject).toContain("SV-1001");
    expect(subject).toContain("397.00");
  });

  it("HTML contains customer name", () => {
    const { html } = renderStaffNewOrder(ORDER);
    expect(html).toContain("Ahmed Ali");
  });

  it("HTML contains payment method", () => {
    const { html } = renderStaffNewOrder(ORDER);
    expect(html).toContain("VODAFONE CASH");
  });

  it("HTML contains item title", () => {
    const { html } = renderStaffNewOrder(ORDER);
    expect(html).toContain("Classic Scrub Top");
  });
});

// ---------------------------------------------------------------------------
// renderStaffProofSubmitted
// ---------------------------------------------------------------------------

describe("renderStaffProofSubmitted", () => {
  it("subject mentions proof submitted and order number", () => {
    const { subject } = renderStaffProofSubmitted(ORDER);
    expect(subject).toContain("Payment proof submitted");
    expect(subject).toContain("SV-1001");
  });

  it("HTML contains order number", () => {
    const { html } = renderStaffProofSubmitted(ORDER);
    expect(html).toContain("SV-1001");
  });

  it("HTML prompts staff to review in admin panel", () => {
    const { html } = renderStaffProofSubmitted(ORDER);
    expect(html).toContain("admin panel");
  });
});

// ---------------------------------------------------------------------------
// sendEmail — dev-preview mode (no RESEND_API_KEY)
// ---------------------------------------------------------------------------

describe("sendEmail (dev-preview mode)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("does NOT throw when RESEND_API_KEY is absent", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const payload = renderOrderPlaced(ORDER, "en");
    await expect(sendEmail(payload)).resolves.toBeUndefined();
  });

  it("logs to console in dev-preview mode", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const payload = renderOrderPlaced(ORDER, "en");
    await sendEmail(payload);
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("[email-preview]"),
    );
  });

  it("logs the recipient and subject", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const payload = renderOrderPlaced(ORDER, "en");
    await sendEmail(payload);
    const logCall = spy.mock.calls[0]?.[0] as string;
    expect(logCall).toContain("ahmed@example.com");
    expect(logCall).toContain("SV-1001");
  });
});

// ---------------------------------------------------------------------------
// sendStaffEmail — no STAFF_EMAIL configured
// ---------------------------------------------------------------------------

describe("sendStaffEmail (no STAFF_EMAIL)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("does NOT throw when STAFF_EMAIL is absent", async () => {
    vi.stubEnv("STAFF_EMAIL", "");
    vi.stubEnv("RESEND_API_KEY", "");
    await expect(
      sendStaffEmail("Test subject", "<p>Test</p>"),
    ).resolves.toBeUndefined();
  });

  it("logs a skip message when STAFF_EMAIL is not configured", async () => {
    vi.stubEnv("STAFF_EMAIL", "");
    vi.stubEnv("RESEND_API_KEY", "");
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await sendStaffEmail("Test subject", "<p>Test</p>");
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("Staff email skipped"),
    );
  });
});

// ---------------------------------------------------------------------------
// Additional Status Templates
// ---------------------------------------------------------------------------

describe("renderOrderProcessing", () => {
  it("renders EN processing email with customer name and items", () => {
    const { subject, html } = renderOrderProcessing(ORDER, "en", "Special packaging requested");
    expect(subject).toContain("SV-1001");
    expect(subject).toContain("preparing");
    expect(html).toContain("Ahmed Ali");
    expect(html).toContain("Special packaging requested");
    expect(html).toContain("Classic Scrub Top");
  });

  it("renders AR processing email with Arabic copy", () => {
    const { subject, html } = renderOrderProcessing(ORDER, "ar");
    expect(subject).toContain("قيد التجهيز");
    expect(subject).toContain("SV-1001");
    expect(html).toContain("dir=\"rtl\"");
    expect(html).toContain("قميص سكراب كلاسيك");
  });
});

describe("renderOrderOutForDelivery", () => {
  it("renders EN out for delivery email with tracking and note", () => {
    const { subject, html } = renderOrderOutForDelivery(ORDER, "en", "Driver will call before arrival");
    expect(subject).toContain("out for delivery today");
    expect(html).toContain("Driver will call before arrival");
    expect(html).toContain("https://track.aramex.com");
  });

  it("renders AR out for delivery email", () => {
    const { subject, html } = renderOrderOutForDelivery(ORDER, "ar");
    expect(subject).toContain("مع مندوب التوصيل اليوم");
    expect(html).toContain("dir=\"rtl\"");
  });
});

describe("renderOrderDelivered", () => {
  it("renders EN delivered email with thank you copy", () => {
    const { subject, html } = renderOrderDelivered(ORDER, "en");
    expect(subject).toContain("delivered");
    expect(html).toContain("Delivered successfully");
  });

  it("renders AR delivered email", () => {
    const { subject, html } = renderOrderDelivered(ORDER, "ar", "شكراً لاختياركم سكراب فايب");
    expect(subject).toContain("تم تسليم طلبك بنجاح");
    expect(html).toContain("شكراً لاختياركم سكراب فايب");
  });
});

describe("renderOrderCancelled", () => {
  it("renders EN cancelled email with cancellation reason", () => {
    const { subject, html } = renderOrderCancelled(ORDER, "en", "Customer requested cancellation");
    expect(subject).toContain("cancelled");
    expect(html).toContain("Customer requested cancellation");
  });

  it("renders AR cancelled email", () => {
    const { subject, html } = renderOrderCancelled(ORDER, "ar", "بناء على طلب العميل");
    expect(subject).toContain("تم إلغاء طلبك");
    expect(html).toContain("بناء على طلب العميل");
  });
});

describe("renderOrderStatusNote", () => {
  it("renders note update email with status and message", () => {
    const { subject, html } = renderOrderStatusNote(ORDER, "en", "We added extra embroidery per your request", "processing");
    expect(subject).toContain("Update on your order");
    expect(html).toContain("We added extra embroidery per your request");
    expect(html).toContain("PROCESSING");
  });
});
