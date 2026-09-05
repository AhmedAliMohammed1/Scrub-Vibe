import type { EmailOtpType } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { safeAuthNext } from "@/features/auth/validation";
import { isLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

const otpTypes: EmailOtpType[] = [
  "email",
  "recovery",
  "invite",
  "email_change",
  "magiclink",
  "signup",
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    return NextResponse.redirect(new URL("/en/account", request.url));
  }

  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const next = safeAuthNext(request.nextUrl.searchParams.get("next"), locale);
  const supabase = await createClient();
  let error: Error | null = null;

  if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } else if (tokenHash && type && otpTypes.includes(type as EmailOtpType)) {
    ({ error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    }));
  } else {
    error = new Error("Missing authentication confirmation token.");
  }

  if (error) {
    return NextResponse.redirect(
      new URL(`/${locale}/account?error=confirmation`, request.url),
    );
  }

  return NextResponse.redirect(new URL(next, request.url));
}
