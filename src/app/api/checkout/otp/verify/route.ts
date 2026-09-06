import { NextResponse } from "next/server";
import { issuePrivateToken, hashToken } from "@/features/checkout/security";
import { isCheckoutPhoneOtpEnabled } from "@/features/checkout/config";
import { checkCheckoutOtp } from "@/features/checkout/twilio";
import { otpVerifySchema } from "@/features/checkout/validation";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  if (!isCheckoutPhoneOtpEnabled()) {
    return NextResponse.json({ error: "otp_disabled" }, { status: 409 });
  }
  const parsed = otpVerifySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_code" }, { status: 400 });

  try {
    if (!(await checkCheckoutOtp(parsed.data.phone, parsed.data.code))) {
      return NextResponse.json({ error: "invalid_code" }, { status: 400 });
    }
    const token = issuePrivateToken();
    const { error } = await createAdminClient().from("checkout_phone_verifications").insert({
      phone: parsed.data.phone,
      token_hash: hashToken(token),
    });
    if (error) throw error;
    return NextResponse.json({ verified: true, token });
  } catch (error) {
    const configuration = error instanceof Error && error.message === "OTP_NOT_CONFIGURED";
    return NextResponse.json({ error: configuration ? "otp_not_configured" : "verification_failed" }, { status: 503 });
  }
}
