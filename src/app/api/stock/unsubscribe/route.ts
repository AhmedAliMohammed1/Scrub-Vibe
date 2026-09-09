import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { data, error } = await createAdminClient()
    .from("stock_subscriptions")
    .update({ status: "unsubscribed" })
    .eq("unsubscribe_token_hash", tokenHash)
    .eq("status", "active")
    .select("id")
    .maybeSingle();
  const success = Boolean(data) && !error;
  const title = success ? "Stock alert cancelled" : "Link unavailable";
  const message = success
    ? "You will no longer receive this back-in-stock alert."
    : "This link is invalid, expired, or was already used.";
  const messageAr = success
    ? "لن تتلقى هذا التنبيه مرة أخرى."
    : "الرابط غير صالح أو منتهي أو تم استخدامه من قبل.";

  return new NextResponse(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title} — Scrub Vibe</title></head><body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#f0f5f3;color:#073b36;font-family:Arial,sans-serif"><main style="max-width:520px;background:white;border:1px solid #d9e6e2;padding:40px;text-align:center"><p style="letter-spacing:.15em;font-size:11px;font-weight:700">SCRUB VIBE</p><h1>${title}</h1><p>${message}</p><p dir="rtl">${messageAr}</p></main></body></html>`,
    {
      status: success ? 200 : 400,
      headers: { "content-type": "text/html; charset=utf-8" },
    },
  );
}
