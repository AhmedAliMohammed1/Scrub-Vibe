import {
  baseLayout,
  formatPriceMajor,
  type EmailPayload,
} from "@/features/notifications/email";
import type { CartItemSnapshot, RecoveryEmailData } from "./types";

function renderItemsTable(
  items: CartItemSnapshot[],
  locale: "en" | "ar",
): string {
  const isAr = locale === "ar";
  const rows = items
    .map((item) => {
      const title = isAr ? item.titleAr : item.titleEn;
      const colour = isAr ? item.colourAr : item.colourEn;
      const details = [colour, item.size, `×${item.quantity}`]
        .filter(Boolean)
        .join(" · ");

      return `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #eef2ef;font-size:13px;line-height:1.4;">
        <strong style="color:#062f2b;">${title}</strong>
        ${details ? `<br /><small style="color:#666;font-size:12px;">${details}</small>` : ""}
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #eef2ef;font-size:13px;font-weight:700;color:#062f2b;text-align:${isAr ? "left" : "right"};white-space:nowrap;">
        ${formatPriceMajor(item.lineTotalMinor)}
      </td>
    </tr>`;
    })
    .join("");

  const total = items.reduce((sum, item) => sum + item.lineTotalMinor, 0);

  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:20px 0;">
    <thead>
      <tr>
        <th style="padding:8px 0;border-bottom:2px solid #dde8e5;text-align:${isAr ? "right" : "left"};font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.08em;">${isAr ? "المنتج" : "Item"}</th>
        <th style="padding:8px 0;border-bottom:2px solid #dde8e5;text-align:${isAr ? "left" : "right"};font-size:11px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.08em;">${isAr ? "السعر" : "Price"}</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
    <tfoot>
      <tr>
        <td style="padding:14px 0;font-size:14px;font-weight:700;color:#062f2b;">${isAr ? "إجمالي السلة" : "Cart subtotal"}</td>
        <td style="padding:14px 0;font-size:16px;font-weight:700;color:#062f2b;text-align:${isAr ? "left" : "right"};">${formatPriceMajor(total)}</td>
      </tr>
    </tfoot>
  </table>`;
}

function renderUnsubscribeFooter(unsubscribeUrl: string, locale: "en" | "ar"): string {
  const isAr = locale === "ar";
  const label = isAr
    ? "لا ترغب في تلقي تذكيرات بالسلة؟ إلغاء الاشتراك هنا"
    : "Don't want to receive cart reminders? Unsubscribe here";
  return `<a href="${unsubscribeUrl}" style="color:#999;font-size:11px;text-decoration:underline;">${label}</a>`;
}

function renderCtaButton(url: string, label: string): string {
  return `
  <div style="margin:28px 0;text-align:center;">
    <a href="${url}" style="display:inline-block;background:#062f2b;color:#ffffff;padding:14px 32px;font-size:13px;font-weight:700;text-decoration:none;letter-spacing:.08em;text-transform:uppercase;border-radius:2px;">
      ${label}
    </a>
  </div>`;
}

// ---------------------------------------------------------------------------
// Stage 1: First Reminder (2 hours)
// ---------------------------------------------------------------------------

export function renderFirstReminder(
  data: RecoveryEmailData,
  locale: "en" | "ar",
): EmailPayload {
  const isAr = locale === "ar";
  const subject = isAr
    ? "هل نسيت شيئاً في سلتك؟ — Scrub Vibe"
    : "Did you leave something behind? — Scrub Vibe";

  const greeting = isAr
    ? `مرحباً ${data.customerName || "عزيزنا العميل"}،`
    : `Hi ${data.customerName || "there"},`;

  const intro = isAr
    ? "لاحظنا أنك تركت بعض المنتجات الرائعة في سلتك. لقد قمنا بحفظها لك حتى تتمكن من إكمال طلبك بكل سهولة."
    : "We noticed you left some pieces in your cart. We've saved them for you so you can easily complete your order whenever you're ready.";

  const ctaLabel = isAr ? "العودة إلى السلة وإكمال الطلب" : "Return to your bag";

  const content = `
    <p style="font-size:15px;color:#333;margin:0 0 10px;">${greeting}</p>
    <p style="font-size:13px;color:#555;line-height:1.6;margin:0 0 20px;">${intro}</p>
    ${renderItemsTable(data.items, locale)}
    ${renderCtaButton(data.restoreCartUrl, ctaLabel)}
    <p style="font-size:12px;color:#888;margin:16px 0 0;text-align:center;">
      ${isAr ? "توصيل سريع لجميع أنحاء مصر · دفع عند الاستلام متاح بمقدم" : "Fast delivery across Egypt · Cash on delivery available with deposit"}
    </p>`;

  return {
    to: data.email,
    subject,
    html: baseLayout(
      isAr ? "سلتك في انتظارك" : "Your cart is waiting",
      content,
      isAr,
      renderUnsubscribeFooter(data.unsubscribeUrl, locale),
    ),
  };
}

// ---------------------------------------------------------------------------
// Stage 2: Second Reminder (24 hours)
// ---------------------------------------------------------------------------

export function renderSecondReminder(
  data: RecoveryEmailData,
  locale: "en" | "ar",
): EmailPayload {
  const isAr = locale === "ar";
  const subject = isAr
    ? "قطعك المفضلة لا تزال بانتظارك — Scrub Vibe"
    : "Your scrubs are still waiting for you — Scrub Vibe";

  const greeting = isAr
    ? `مرحباً ${data.customerName || "عزيزنا العميل"}،`
    : `Hi ${data.customerName || "there"},`;

  const intro = isAr
    ? "لا تزال المنتجات التي اخترتها محفوظة في سلتك، ولكن المقاسات والألوان الأكثر طلباً قد تنفد قريباً. أكمل طلبك الآن لضمان توفر مقاسك المفضل لشفتاتك القادمة."
    : "Your selected scrub wear is still saved in your bag, but popular sizes and colors move fast during shifts. Complete your order today to secure your preferred fit and color.";

  const ctaLabel = isAr ? "إكمال طلبي الآن" : "Complete your order";

  const urgencyNotice = isAr
    ? `<div style="background:#fff8e1;border-right:3px solid #ffb300;padding:12px 16px;margin:16px 0;font-size:13px;color:#6d4c41;">
        <strong>تنبيه:</strong> المخزون محدود للقطع الأكثر طلباً. لا تدع مقاسك يفوتك.
       </div>`
    : `<div style="background:#fff8e1;border-left:3px solid #ffb300;padding:12px 16px;margin:16px 0;font-size:13px;color:#6d4c41;">
        <strong>Note:</strong> Stock is moving quickly. Don't miss out on your favorite fit.
       </div>`;

  const content = `
    <p style="font-size:15px;color:#333;margin:0 0 10px;">${greeting}</p>
    <p style="font-size:13px;color:#555;line-height:1.6;margin:0 0 16px;">${intro}</p>
    ${urgencyNotice}
    ${renderItemsTable(data.items, locale)}
    ${renderCtaButton(data.restoreCartUrl, ctaLabel)}
    <p style="font-size:12px;color:#888;margin:16px 0 0;text-align:center;">
      ${isAr ? "خامات طبية متينة ومريحة مصممة خصيصاً للشفتات الطويلة 🌿" : "Durable, comfortable medical scrubs tailored for long shifts 🌿"}
    </p>`;

  return {
    to: data.email,
    subject,
    html: baseLayout(
      isAr ? "لا تفوت مقاسك" : "Don't miss your fit",
      content,
      isAr,
      renderUnsubscribeFooter(data.unsubscribeUrl, locale),
    ),
  };
}

// ---------------------------------------------------------------------------
// Stage 3: Discount Offer (48 hours)
// ---------------------------------------------------------------------------

export function renderDiscountOffer(
  data: RecoveryEmailData,
  locale: "en" | "ar",
): EmailPayload {
  const isAr = locale === "ar";
  const percent = data.discountPercent ?? 10;
  const code = data.discountCode ?? "RECOVER10";

  const subject = isAr
    ? `عرض خاص: خصم ${percent}٪ لإكمال طلبك — Scrub Vibe`
    : `Special offer: ${percent}% off your cart — Scrub Vibe`;

  const greeting = isAr
    ? `مرحباً ${data.customerName || "عزيزنا العميل"}،`
    : `Hi ${data.customerName || "there"},`;

  const intro = isAr
    ? `يسرنا أن نراك ترتدي سكراب فايب في شفتك القادم! كهدية خاصة، إليك كود خصم حصري بنسبة ${percent}٪ على المنتجات الموجودة في سلتك.`
    : `We'd love to see you wearing Scrub Vibe during your next shift! As a special treat, here is an exclusive ${percent}% discount code for the items in your bag.`;

  const expiryText = data.discountExpiryDate
    ? isAr
      ? `صالح حتى ${data.discountExpiryDate}`
      : `Valid until ${data.discountExpiryDate}`
    : isAr
      ? "لفترة محدودة فقط"
      : "For a limited time only";

  const discountBox = `
  <div style="background:#e8f5e9;border:2px dashed #0e7468;border-radius:4px;padding:20px;margin:24px 0;text-align:center;">
    <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#0e7468;">
      ${isAr ? `كود خصم حصري ${percent}٪` : `Exclusive ${percent}% Discount Code`}
    </p>
    <p style="margin:8px 0;font-size:26px;font-weight:700;font-family:monospace;letter-spacing:.15em;color:#062f2b;">
      ${code}
    </p>
    <p style="margin:4px 0 0;font-size:12px;color:#555;">
      ${expiryText} · ${isAr ? "سيتم تطبيقه تلقائياً عند الضغط على الزر أدناه" : "Will be applied automatically via the button below"}
    </p>
  </div>`;

  const ctaLabel = isAr
    ? `تفعيل خصم ${percent}٪ وإكمال الطلب`
    : `Claim ${percent}% off & checkout`;

  const content = `
    <p style="font-size:15px;color:#333;margin:0 0 10px;">${greeting}</p>
    <p style="font-size:13px;color:#555;line-height:1.6;margin:0 0 16px;">${intro}</p>
    ${discountBox}
    ${renderItemsTable(data.items, locale)}
    ${renderCtaButton(data.restoreCartUrl, ctaLabel)}
    <p style="font-size:12px;color:#888;margin:16px 0 0;text-align:center;">
      ${isAr ? "فريق Scrub Vibe 🌿 · خدمة عملاء على مدار الساعة" : "The Scrub Vibe Team 🌿 · Dedicated customer support"}
    </p>`;

  return {
    to: data.email,
    subject,
    html: baseLayout(
      isAr ? `هدية خاصة: خصم ${percent}٪` : `A special ${percent}% off for you`,
      content,
      isAr,
      renderUnsubscribeFooter(data.unsubscribeUrl, locale),
    ),
  };
}
