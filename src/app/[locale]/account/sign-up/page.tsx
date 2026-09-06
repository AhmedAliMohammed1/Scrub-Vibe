import { notFound } from "next/navigation";
import { AuthForm } from "@/features/auth/auth-form";
import { AuthShell } from "@/features/auth/auth-shell";
import { isLocale } from "@/lib/i18n";

export default async function SignUpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <AuthShell
      eyebrow={locale === "ar" ? "انضم إلى سكراب فايب" : "JOIN SCRUB VIBE"}
      title={
        locale === "ar" ? "جاهز لشيفتك القادمة" : "Ready for your next shift"
      }
      body={
        locale === "ar"
          ? "أنشئ حساباً لمتابعة الطلبات وحفظ القطع المفضلة وتسريع عملية الشراء."
          : "Create an account to follow orders, save favourites and move through checkout faster."
      }
    >
      <AuthForm mode="sign-up" locale={locale} />
    </AuthShell>
  );
}
