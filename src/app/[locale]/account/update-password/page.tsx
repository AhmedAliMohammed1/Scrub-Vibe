import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthForm } from "@/features/auth/auth-form";
import { AuthShell } from "@/features/auth/auth-shell";
import { isLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export default async function UpdatePasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const authenticated = !error && Boolean(data?.claims?.sub);

  return (
    <AuthShell
      eyebrow={locale === "ar" ? "أمان الحساب" : "ACCOUNT SECURITY"}
      title={locale === "ar" ? "كلمة مرور جديدة" : "Choose a new password"}
      body={
        locale === "ar"
          ? "استخدم ثمانية أحرف على الأقل، واختر كلمة لا تستخدمها في مكان آخر."
          : "Use at least eight characters and choose a password you do not reuse elsewhere."
      }
    >
      {authenticated ? (
        <AuthForm mode="update-password" locale={locale} />
      ) : (
        <div className="space-y-5 text-sm leading-6">
          <p>
            {locale === "ar"
              ? "يجب فتح رابط الاستعادة من بريدك الإلكتروني قبل تغيير كلمة المرور."
              : "Open the recovery link from your email before changing your password."}
          </p>
          <Link
            href={`/${locale}/account/forgot-password`}
            className="inline-block underline underline-offset-4"
          >
            {locale === "ar" ? "طلب رابط جديد" : "Request a new link"}
          </Link>
        </div>
      )}
    </AuthShell>
  );
}
