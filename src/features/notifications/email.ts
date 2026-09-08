import { Resend } from "resend";

// ---------------------------------------------------------------------------
// Client — falls back to console preview when the key is absent (local dev)
// ---------------------------------------------------------------------------

function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key || key === "[SENSITIVE]") return null;
  return new Resend(key);
}

export function getFromAddress(): string {
  const custom = process.env.RESEND_FROM_EMAIL?.trim();
  const unverifiedProviders = ["@gmail.com", "@yahoo.com", "@outlook.com", "@hotmail.com", "@icloud.com"];
  if (!custom || unverifiedProviders.some((domain) => custom.toLowerCase().endsWith(domain))) {
    return "Scrub Vibe <onboarding@resend.dev>";
  }
  return custom.includes("<") ? custom : `Scrub Vibe <${custom}>`;
}

export function getStaffEmail(): string {
  return (process.env.STAFF_EMAIL ?? "").trim();
}

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

/** Send an email via Resend, or log it to the console in dev-preview mode. */
export async function sendEmail(payload: EmailPayload): Promise<void> {
  const resend = getResendClient();
  if (!resend) {
    console.log(
      "[email-preview] Would send email:\n" +
        `  To: ${payload.to}\n` +
        `  Subject: ${payload.subject}\n` +
        `  HTML length: ${payload.html.length} chars`,
    );
    return;
  }
  const from = getFromAddress();
  const { error } = await resend.emails.send({
    from,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
  });
  if (error) {
    console.error("[email] Resend error:", error);
  }
}

/** Send a staff alert email if STAFF_EMAIL is configured. */
export async function sendStaffEmail(
  subject: string,
  html: string,
): Promise<void> {
  const staffEmail = getStaffEmail();
  if (!staffEmail) {
    console.log(
      "[email-preview] Staff email skipped (STAFF_EMAIL not configured):\n" +
        `  Subject: ${subject}`,
    );
    return;
  }
  await sendEmail({ to: staffEmail, subject, html });
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Format piastres as EGP string, e.g. 5000 → "EGP 50.00" */
export function formatPriceMajor(minor: number): string {
  return `EGP ${(minor / 100).toFixed(2)}`;
}

function baseLayout(title: string, content: string, isRtl = false): string {
  const dir = isRtl ? "rtl" : "ltr";
  const align = isRtl ? "right" : "left";
  return `<!DOCTYPE html>
<html lang="${isRtl ? "ar" : "en"}" dir="${dir}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f7f4;font-family:'Segoe UI',Arial,sans-serif;direction:${dir};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f4;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #dde8e5;max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:#062f2b;padding:28px 36px;">
            <p style="margin:0;color:#81c5b8;font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;">SCRUB VIBE</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:28px;font-weight:400;">${title}</h1>
          </td>
        </tr>
        <!-- Content -->
        <tr>
          <td style="padding:36px;text-align:${align};">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f4f7f4;padding:20px 36px;border-top:1px solid #dde8e5;">
            <p style="margin:0;font-size:11px;color:#888;text-align:center;">
              ${isRtl ? "© ٢٠٢٦ Scrub Vibe. جميع الحقوق محفوظة." : "© 2026 Scrub Vibe. All rights reserved."}
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function itemsTable(
  items: OrderEmailData["items"],
  locale: "en" | "ar",
): string {
  const isAr = locale === "ar";
  const rows = items
    .map(
      (item) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #eef2ef;font-size:13px;">
        ${isAr ? item.title_ar : item.title_en}
        <small style="display:block;color:#888;margin-top:2px;">
          ${isAr ? (item.colour_ar ?? "") : (item.colour_en ?? "")}
          ${item.size ? ` · ${item.size}` : ""}
          · ×${item.quantity}
        </small>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #eef2ef;font-size:13px;font-weight:700;text-align:${isAr ? "left" : "right"};">
        ${formatPriceMajor(item.line_total_minor)}
      </td>
    </tr>`,
    )
    .join("");

  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:20px 0;">
    ${rows}
    <tr>
      <td style="padding:12px 0;font-size:13px;font-weight:700;">${isAr ? "الإجمالي" : "Total"}</td>
      <td style="padding:12px 0;font-size:16px;font-weight:700;color:#062f2b;text-align:${isAr ? "left" : "right"};">
        ${formatPriceMajor(items.reduce((s, i) => s + i.line_total_minor, 0))}
      </td>
    </tr>
  </table>`;
}

// ---------------------------------------------------------------------------
// Order data shape shared by all templates
// ---------------------------------------------------------------------------

export type OrderEmailData = {
  order_number: string;
  customer_name: string;
  email: string;
  total_minor: number;
  shipping_minor: number;
  subtotal_minor: number;
  payment_method: string;
  courier?: string | null;
  shipment_number?: string | null;
  tracking_url?: string | null;
  items: {
    title_en: string;
    title_ar: string;
    colour_en: string | null;
    colour_ar: string | null;
    size: string | null;
    quantity: number;
    line_total_minor: number;
  }[];
};

// ---------------------------------------------------------------------------
// Template 1 — Order Placed
// ---------------------------------------------------------------------------

export function renderOrderPlaced(
  order: OrderEmailData,
  locale: "en" | "ar",
): EmailPayload {
  const isAr = locale === "ar";
  const subject = isAr
    ? `تم استلام طلبك #${order.order_number} — Scrub Vibe`
    : `Order confirmed #${order.order_number} — Scrub Vibe`;

  const greeting = isAr
    ? `مرحباً ${order.customer_name}،`
    : `Hi ${order.customer_name},`;

  const intro = isAr
    ? `تم استلام طلبك بنجاح وجارٍ مراجعته. ستتلقى إشعاراً فور تأكيده.`
    : `We've received your order and it's being reviewed. You'll hear from us once it's confirmed.`;

  const methodLabel = isAr ? "طريقة الدفع" : "Payment method";
  const methodValue = order.payment_method.replaceAll("_", " ").toUpperCase();

  const shippingLabel = isAr ? "الشحن" : "Shipping";
  const totalLabel = isAr ? "الإجمالي" : "Order total";

  const content = `
    <p style="font-size:15px;color:#333;margin:0 0 8px;">${greeting}</p>
    <p style="font-size:13px;color:#555;margin:0 0 24px;">${intro}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f4;padding:16px;margin:0 0 24px;">
      <tr>
        <td style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#888;">${isAr ? "رقم الطلب" : "Order number"}</td>
        <td style="font-size:20px;font-weight:700;color:#062f2b;text-align:${isAr ? "left" : "right"};">#${order.order_number}</td>
      </tr>
    </table>

    ${itemsTable(order.items, locale)}

    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:12px;color:#555;margin:8px 0 24px;">
      <tr>
        <td style="padding:4px 0;">${shippingLabel}</td>
        <td style="padding:4px 0;text-align:${isAr ? "left" : "right"};">${formatPriceMajor(order.shipping_minor)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;font-weight:700;font-size:14px;color:#062f2b;">${totalLabel}</td>
        <td style="padding:4px 0;font-weight:700;font-size:14px;color:#062f2b;text-align:${isAr ? "left" : "right"};">${formatPriceMajor(order.total_minor)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;">${methodLabel}</td>
        <td style="padding:4px 0;text-align:${isAr ? "left" : "right"};">${methodValue}</td>
      </tr>
    </table>

    <p style="font-size:12px;color:#888;margin:0;">
      ${isAr ? "شكراً لتسوقك مع Scrub Vibe 🌿" : "Thank you for shopping with Scrub Vibe 🌿"}
    </p>`;

  return { to: order.email, subject, html: baseLayout(subject, content, isAr) };
}

// ---------------------------------------------------------------------------
// Template 2 — Payment Approved
// ---------------------------------------------------------------------------

export function renderPaymentApproved(
  order: OrderEmailData,
  locale: "en" | "ar",
): EmailPayload {
  const isAr = locale === "ar";
  const subject = isAr
    ? `تم قبول دفعتك — طلب #${order.order_number}`
    : `Payment approved — Order #${order.order_number}`;

  const greeting = isAr
    ? `مرحباً ${order.customer_name}،`
    : `Hi ${order.customer_name},`;

  const intro = isAr
    ? `تمت مراجعة إيصال الدفع الخاص بك وتأكيد طلبك. سنبدأ بتجهيزه في أقرب وقت ممكن.`
    : `Your payment has been reviewed and your order is confirmed. We'll start preparing it right away.`;

  const content = `
    <p style="font-size:15px;color:#333;margin:0 0 8px;">${greeting}</p>
    <p style="font-size:13px;color:#555;margin:0 0 24px;">${intro}</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#e8f5e9;border:1px solid #a5d6a7;padding:16px;margin:0 0 24px;">
      <tr>
        <td>
          <p style="margin:0;font-size:13px;font-weight:700;color:#2e7d32;">
            ${isAr ? "✓ تم تأكيد الطلب #" + order.order_number : "✓ Order #" + order.order_number + " confirmed"}
          </p>
          <p style="margin:6px 0 0;font-size:12px;color:#555;">
            ${isAr ? "الإجمالي: " : "Total: "}${formatPriceMajor(order.total_minor)}
          </p>
        </td>
      </tr>
    </table>

    ${itemsTable(order.items, locale)}

    <p style="font-size:12px;color:#888;margin:0;">
      ${isAr ? "شكراً لثقتك بنا 🌿" : "Thank you for your trust in Scrub Vibe 🌿"}
    </p>`;

  return { to: order.email, subject, html: baseLayout(subject, content, isAr) };
}

// ---------------------------------------------------------------------------
// Template 3 — Order Shipped
// ---------------------------------------------------------------------------

export function renderOrderShipped(
  order: OrderEmailData,
  locale: "en" | "ar",
): EmailPayload {
  const isAr = locale === "ar";
  const subject = isAr
    ? `طلبك في الطريق إليك — #${order.order_number}`
    : `Your order is on its way — #${order.order_number}`;

  const greeting = isAr
    ? `مرحباً ${order.customer_name}،`
    : `Hi ${order.customer_name},`;

  const intro = isAr
    ? `تم تسليم طلبك إلى شركة الشحن وهو في طريقه إليك.`
    : `Your order has been handed to the courier and is on its way.`;

  const courierSection =
    order.courier || order.shipment_number
      ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f4;padding:16px;margin:16px 0 24px;">
      ${
        order.courier
          ? `<tr><td style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#888;padding:4px 0;">${isAr ? "شركة الشحن" : "Courier"}</td><td style="font-size:13px;text-align:${isAr ? "left" : "right"};">${order.courier}</td></tr>`
          : ""
      }
      ${
        order.shipment_number
          ? `<tr><td style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#888;padding:4px 0;">${isAr ? "رقم الشحنة" : "Tracking number"}</td><td style="font-size:13px;font-weight:700;text-align:${isAr ? "left" : "right"};">${order.shipment_number}</td></tr>`
          : ""
      }
    </table>`
      : "";

  const trackingButton = order.tracking_url
    ? `<p style="margin:0 0 24px;">
        <a href="${order.tracking_url}" style="display:inline-block;background:#062f2b;color:#ffffff;padding:12px 24px;font-size:12px;font-weight:700;text-decoration:none;letter-spacing:.1em;text-transform:uppercase;">
          ${isAr ? "تتبع طلبك" : "Track your order"}
        </a>
      </p>`
    : "";

  const content = `
    <p style="font-size:15px;color:#333;margin:0 0 8px;">${greeting}</p>
    <p style="font-size:13px;color:#555;margin:0 0 16px;">${intro}</p>
    ${courierSection}
    ${trackingButton}
    ${itemsTable(order.items, locale)}
    <p style="font-size:12px;color:#888;margin:0;">
      ${isAr ? "شكراً لتسوقك مع Scrub Vibe 🌿" : "Thank you for shopping with Scrub Vibe 🌿"}
    </p>`;

  return { to: order.email, subject, html: baseLayout(subject, content, isAr) };
}

// ---------------------------------------------------------------------------
// Template 4 — Staff: New Order
// ---------------------------------------------------------------------------

export function renderStaffNewOrder(order: OrderEmailData): EmailPayload {
  const subject = `[Scrub Vibe] New order #${order.order_number} — ${formatPriceMajor(order.total_minor)}`;
  const html = baseLayout(
    `New order #${order.order_number}`,
    `
    <p style="font-size:14px;color:#333;margin:0 0 16px;">
      A new order has been placed on Scrub Vibe.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f4;padding:16px;margin:0 0 24px;font-size:13px;">
      <tr><td style="padding:4px 0;">Customer</td><td style="padding:4px 0;font-weight:700;text-align:right;">${order.customer_name}</td></tr>
      <tr><td style="padding:4px 0;">Payment method</td><td style="padding:4px 0;text-align:right;">${order.payment_method.replaceAll("_", " ").toUpperCase()}</td></tr>
      <tr><td style="padding:4px 0;">Total</td><td style="padding:4px 0;font-weight:700;font-size:15px;color:#062f2b;text-align:right;">${formatPriceMajor(order.total_minor)}</td></tr>
    </table>
    ${itemsTable(order.items, "en")}`,
  );
  return { to: getStaffEmail(), subject, html };
}

// ---------------------------------------------------------------------------
// Template 5 — Staff: Payment Proof Submitted
// ---------------------------------------------------------------------------

export function renderStaffProofSubmitted(order: OrderEmailData): EmailPayload {
  const subject = `[Scrub Vibe] Payment proof submitted — Order #${order.order_number}`;
  const html = baseLayout(
    `Proof submitted — #${order.order_number}`,
    `
    <p style="font-size:14px;color:#333;margin:0 0 16px;">
      A customer has submitted a payment proof for order #${order.order_number}.
      Please review it in the admin panel.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8e1;border:1px solid #ffe082;padding:16px;margin:0 0 24px;font-size:13px;">
      <tr><td style="padding:4px 0;">Customer</td><td style="padding:4px 0;font-weight:700;text-align:right;">${order.customer_name}</td></tr>
      <tr><td style="padding:4px 0;">Order</td><td style="padding:4px 0;text-align:right;">#${order.order_number}</td></tr>
      <tr><td style="padding:4px 0;">Total</td><td style="padding:4px 0;font-weight:700;color:#062f2b;text-align:right;">${formatPriceMajor(order.total_minor)}</td></tr>
    </table>`,
  );
  return { to: getStaffEmail(), subject, html };
}
