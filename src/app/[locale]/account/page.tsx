import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { signOutAction } from "@/features/auth/actions";
import { AuthForm } from "@/features/auth/auth-form";
import { AuthShell } from "@/features/auth/auth-shell";
import { isLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ password?: string; error?: string }>;
};

export default async function AccountPage({ params, searchParams }: Props) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return (
      <AuthShell
        eyebrow={locale === "ar" ? "حساب سكراب فايب" : "SCRUB VIBE ACCOUNT"}
        title={locale === "ar" ? "مرحباً بعودتك" : "Welcome back"}
        body={
          locale === "ar"
            ? "سجل الدخول للوصول إلى طلباتك وقوائمك وتفاصيل حسابك."
            : "Sign in to access your orders, saved pieces and account details."
        }
      >
        {query.error === "confirmation" && (
          <p className="border border-[#a6432b]/30 bg-[#a6432b]/8 px-4 py-3 text-xs text-[#8c3624]">
            {locale === "ar"
              ? "رابط التأكيد غير صالح أو انتهت صلاحيته."
              : "The confirmation link is invalid or has expired."}
          </p>
        )}
        <AuthForm mode="sign-in" locale={locale} />
      </AuthShell>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name, preferred_locale")
    .eq("id", userId)
    .maybeSingle();
  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const canAdmin = roleRows?.some(
    ({ role }) => role === "admin" || role === "super_admin",
  );
  const email = profile?.email ?? String(claimsData.claims.email ?? "");
  const name = profile?.full_name?.trim() || email.split("@")[0];

  return (
    <main className="mx-auto min-h-[70vh] max-w-[1200px] px-5 py-16 md:px-10 md:py-24">
      <p className="eyebrow text-[#a6432b]">
        {locale === "ar" ? "حساب سكراب فايب" : "SCRUB VIBE ACCOUNT"}
      </p>
      <div className="mt-4 grid gap-12 md:grid-cols-[1.2fr_.8fr]">
        <section>
          <h1 className="max-w-xl font-serif text-5xl leading-none md:text-7xl">
            {locale === "ar" ? `مرحباً، ${name}` : `Welcome, ${name}`}
          </h1>
          <p className="mt-6 text-sm text-neutral-600">{email}</p>
          {query.password === "updated" && (
            <p className="mt-6 max-w-md border border-[#526744]/30 bg-[#526744]/8 px-4 py-3 text-xs text-[#3f5135]">
              {locale === "ar"
                ? "تم تحديث كلمة المرور بنجاح."
                : "Your password has been updated."}
            </p>
          )}
        </section>
        <aside className="border border-black/10 bg-white/35 p-6 md:p-8">
          <h2 className="font-serif text-3xl">
            {locale === "ar" ? "تفاصيل الحساب" : "Account details"}
          </h2>
          <dl className="mt-6 divide-y divide-black/10 text-sm">
            <div className="py-4">
              <dt className="text-[10px] font-bold uppercase tracking-[.14em] text-neutral-500">
                {locale === "ar" ? "البريد الإلكتروني" : "Email"}
              </dt>
              <dd className="mt-2 break-all">{email}</dd>
            </div>
            <div className="py-4">
              <dt className="text-[10px] font-bold uppercase tracking-[.14em] text-neutral-500">
                {locale === "ar" ? "اللغة المفضلة" : "Preferred language"}
              </dt>
              <dd className="mt-2 uppercase">
                {profile?.preferred_locale ?? locale}
              </dd>
            </div>
          </dl>
          <Link
            href={`/${locale}/account/update-password`}
            className="mt-6 inline-block text-xs underline underline-offset-4"
          >
            {locale === "ar" ? "تغيير كلمة المرور" : "Change password"}
          </Link>
          {canAdmin && (
            <Link
              href={`/${locale}/admin` as Route}
              className="mt-4 block bg-[#073b36] px-5 py-4 text-center text-xs font-bold uppercase tracking-[.14em] text-white"
            >
              {locale === "ar" ? "فتح لوحة الإدارة" : "Open admin dashboard"}
            </Link>
          )}
          <form action={signOutAction} className="mt-8">
            <input type="hidden" name="locale" value={locale} />
            <button className="h-12 w-full border border-neutral-950 text-xs font-bold uppercase tracking-[.14em]">
              {locale === "ar" ? "تسجيل الخروج" : "Sign out"}
            </button>
          </form>
        </aside>
      </div>
    </main>
  );
}
