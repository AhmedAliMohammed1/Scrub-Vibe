import { NextResponse } from "next/server";
import { optOutUserFromCartRecovery } from "@/features/cart-recovery/repository";
import { verifyUnsubscribeToken } from "@/features/cart-recovery/security";

export const dynamic = "force-dynamic";

function htmlResponse(title: string, heading: string, messageEn: string, messageAr: string) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — Scrub Vibe</title>
  <style>
    body {
      margin: 0;
      padding: 40px 20px;
      background: #f4f7f4;
      font-family: 'Segoe UI', Arial, sans-serif;
      color: #333;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
    }
    .card {
      background: #ffffff;
      border: 1px solid #dde8e5;
      max-width: 520px;
      width: 100%;
      padding: 40px 36px;
      box-sizing: border-box;
      text-align: center;
    }
    .logo {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .15em;
      text-transform: uppercase;
      color: #0e7468;
      margin: 0 0 16px;
    }
    h1 {
      font-size: 24px;
      font-weight: 600;
      color: #062f2b;
      margin: 0 0 20px;
    }
    p {
      font-size: 14px;
      line-height: 1.6;
      color: #555;
      margin: 0 0 12px;
    }
    .ar {
      direction: rtl;
      font-size: 14px;
      color: #777;
      margin: 16px 0 24px;
      border-top: 1px solid #eef2ef;
      padding-top: 16px;
    }
    a.btn {
      display: inline-block;
      background: #062f2b;
      color: #ffffff;
      padding: 12px 28px;
      font-size: 12px;
      font-weight: 700;
      text-decoration: none;
      letter-spacing: .1em;
      text-transform: uppercase;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="card">
    <p class="logo">Scrub Vibe</p>
    <h1>${heading}</h1>
    <p>${messageEn}</p>
    <div class="ar">
      <p>${messageAr}</p>
    </div>
    <a href="/" class="btn">Return to Shop</a>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return htmlResponse(
      "Unsubscribe",
      "Invalid Request",
      "Missing unsubscribe verification token.",
      "رابط إلغاء الاشتراك غير مكتمل أو غير صالح.",
    );
  }

  const userId = verifyUnsubscribeToken(token);
  if (!userId) {
    return htmlResponse(
      "Unsubscribe",
      "Link Expired or Invalid",
      "This unsubscribe link is invalid or has expired.",
      "رابط إلغاء الاشتراك هذا غير صالح أو انتهت صلاحيته.",
    );
  }

  const updated = await optOutUserFromCartRecovery(userId);
  if (!updated) {
    return htmlResponse(
      "Unsubscribe",
      "Temporary Issue",
      "Could not update your notification preferences. Please try again later.",
      "تعذر تحديث تفضيلات الإشعارات الخاصة بك. يرجى المحاولة لاحقاً.",
    );
  }

  return htmlResponse(
    "Unsubscribed",
    "Unsubscribed Successfully",
    "You have been unsubscribed from abandoned cart recovery emails. You will not receive reminder emails for items left in your bag.",
    "تم إلغاء اشتراكك بنجاح من رسائل تذكير السلة. لن تتلقى رسائل تذكير بالمنتجات المحفوظة في سلتك بعد الآن.",
  );
}
