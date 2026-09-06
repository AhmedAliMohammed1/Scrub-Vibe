import { NextResponse } from "next/server";
import { otpRequestSchema } from "@/features/checkout/validation";
import { isCheckoutPhoneOtpEnabled } from "@/features/checkout/config";
import { requestIpHash } from "@/features/checkout/security";
import { sendCheckoutOtp } from "@/features/checkout/twilio";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  if (!isCheckoutPhoneOtpEnabled()) {
    return NextResponse.json({ error: "otp_disabled" }, { status: 409 });
  }
  const parsed = otpRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_phone" }, { status: 400 });

  const admin = createAdminClient();
  const since = new Date(Date.now() - 10 * 60_000).toISOString();
  const ipHash = requestIpHash(request);
  const [phoneAttempts, ipAttempts] = await Promise.all([
    admin.from("checkout_otp_requests").select("id", { count: "exact", head: true }).eq("phone", parsed.data.phone).gte("created_at", since),
    admin.from("checkout_otp_requests").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", since),
  ]);
  if ((phoneAttempts.count ?? 0) >= 3 || (ipAttempts.count ?? 0) >= 10) {
    return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
  }

  try {
    const result = await sendCheckoutOtp(parsed.data.phone);
    await admin.from("checkout_otp_requests").insert({
      phone: parsed.data.phone,
      ip_hash: ipHash,
      provider_request_id: result.sid ?? null,
    });
    return NextResponse.json({ sent: true });
  } catch (error) {
    const configuration = error instanceof Error && error.message === "OTP_NOT_CONFIGURED";
    return NextResponse.json({ error: configuration ? "otp_not_configured" : "otp_delivery_failed" }, { status: 503 });
  }
}
