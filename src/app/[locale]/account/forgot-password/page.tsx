import { notFound } from "next/navigation";
import { AuthForm } from "@/features/auth/auth-form";
import { AuthShell } from "@/features/auth/auth-shell";
import { isLocale } from "@/lib/i18n";

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <AuthShell
      eyebrow={locale === "ar" ? "استعادة الحساب" : "ACCOUNT RECOVERY"}
      title={locale === "ar" ? "لنعد إلى حسابك" : "Let’s get you back"}
      body={
        locale === "ar"
          ? "أدخل بريدك الإلكتروني وسنرسل رابطاً آمناً لاختيار كلمة مرور جديدة."
          : "Enter your email and we’ll send a secure link to choose a new password."
      }
    >
      <AuthForm mode="forgot-password" locale={locale} />
    </AuthShell>
  );
}
