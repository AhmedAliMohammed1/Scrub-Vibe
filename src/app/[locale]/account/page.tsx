import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { signOutAction } from "@/features/auth/actions";
import { AuthForm } from "@/features/auth/auth-form";
import { AuthShell } from "@/features/auth/auth-shell";
import { isLocale } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import { getCustomerAddresses } from "@/features/addresses/repository";
import { AddressBook } from "@/features/addresses/address-book";
import { getShippingLocations } from "@/features/shipping/repository";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ password?: string; error?: string }>;
};

function isWithinReturnWindow(deliveredAt: string | null): boolean {
  if (!deliveredAt) return false;
  return Date.now() <= new Date(deliveredAt).getTime() + 14 * 86400000;
}

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
        <div className="mt-8 border-t border-[var(--border-subtle)] pt-6 text-center">
          <p className="text-xs text-[var(--text-muted)]">
            {locale === "ar" ? "مشرف أو مدير المتجر؟" : "Store staff or manager?"}
          </p>
          <Link
            href={`/${locale}/admin` as Route}
            className="mt-2.5 inline-flex items-center gap-2 rounded-xs border border-[#073b36]/30 bg-[#073b36]/5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#073b36] transition-all hover:bg-[#073b36] hover:text-white"
          >
            <span>{locale === "ar" ? "الدخول إلى لوحة الإدارة (Staff)" : "Open Admin Dashboard (Staff)"}</span>
          </Link>
        </div>
      </AuthShell>
    );
  }

  const [
    { data: profile },
    { data: roleRows },
    { data: orderRows },
    addresses,
    shippingLocations,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("email, full_name, preferred_locale")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId),
    supabase
      .from("orders")
      .select("id, order_number, status, payment_status, total_minor, created_at, delivered_at")
      .order("created_at", { ascending: false })
      .limit(8),
    getCustomerAddresses(supabase, userId),
    getShippingLocations(supabase).catch(() => []),
  ]);
  const canAdmin = roleRows?.some(
    ({ role }) => role === "admin" || role === "super_admin",
  );
  const email = profile?.email ?? String(claimsData.claims.email ?? "");
  const name = profile?.full_name?.trim() || email.split("@")[0];

  return (
    <main className="mx-auto min-h-[70vh] max-w-[1200px] px-5 py-16 md:px-10 md:py-24">
      <p className="eyebrow text-[var(--color-accent)]">
        {locale === "ar" ? "حساب سكراب فايب" : "SCRUB VIBE ACCOUNT"}
      </p>
      <div className="mt-4 grid gap-12 lg:grid-cols-[1.25fr_.75fr]">
        <section>
          <h1 className="max-w-xl font-serif text-4xl leading-[1.1] md:text-6xl text-[var(--text-primary)]">
            {locale === "ar" ? `مرحباً، ${name}` : `Welcome, ${name}`}
          </h1>
          <p className="mt-3 text-sm text-[var(--text-secondary)]">{email}</p>
          {query.password === "updated" && (
            <p className="mt-6 max-w-md rounded-xs border border-[#0e7468]/30 bg-[#0e7468]/10 px-4 py-3 text-xs text-[#073b36]">
              {locale === "ar"
                ? "تم تحديث كلمة المرور بنجاح."
                : "Your password has been updated."}
            </p>
          )}
          <div className="mt-12">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-serif text-2xl md:text-3xl text-[var(--text-primary)]">
                {locale === "ar" ? "طلباتك" : "Your orders"}
              </h2>
            </div>
            {orderRows?.length ? (
              <div className="mt-5 divide-y divide-[var(--border-subtle)] rounded-xs border border-[var(--border-subtle)] bg-[var(--surface-raised)] shadow-subtle overflow-hidden">
                {orderRows.map((order) => (
                  <article
                    key={order.id}
                    className="group flex items-center justify-between gap-4 p-4 transition-colors hover:bg-[var(--surface-sunken)]/60"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
                          {order.order_number}
                        </strong>
                        <span className="rounded-xs bg-[var(--color-secondary)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--color-primary-dark)]">
                          {order.status.replaceAll("_", " ")}
                        </span>
                      </div>
                      <small className="mt-1.5 block text-[10px] uppercase text-[var(--text-muted)]">
                        {order.payment_status.replaceAll("_", " ")}
                      </small>
                      <span className="mt-2 flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-[.08em] text-[var(--color-primary)]">
                        <Link href={`/${locale}/track/${order.order_number}` as Route}>{locale === "ar" ? "تتبع" : "Track"}</Link>
                        <Link href={`/${locale}/account/orders/${order.order_number}/invoice` as Route}>{locale === "ar" ? "الفاتورة" : "Invoice"}</Link>
                        {order.status === "delivered" && isWithinReturnWindow(order.delivered_at) && <Link href={`/${locale}/account/returns/new?order=${order.id}` as Route}>{locale === "ar" ? "استرجاع / استبدال" : "Return / exchange"}</Link>}
                      </span>
                    </div>
                    <div className="text-end">
                      <strong className="block text-sm font-semibold text-[var(--text-primary)]">
                        {formatMoney(order.total_minor, locale)}
                      </strong>
                      <small className="mt-1.5 block text-[10px] text-[var(--text-muted)]">
                        {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(order.created_at))}
                      </small>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-xs border border-dashed border-[var(--border-subtle)] bg-[var(--surface-raised)] p-8 text-center">
                <p className="text-sm text-[var(--text-muted)]">
                  {locale === "ar" ? "لا توجد طلبات مرتبطة بهذا الحساب بعد." : "No orders are linked to this account yet."}
                </p>
                <Link
                  href={`/${locale}/shop`}
                  className="mt-4 inline-block text-xs font-bold uppercase tracking-[.12em] text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-hover)]"
                >
                  {locale === "ar" ? "استكشف التشكيلة" : "Browse catalog"}
                </Link>
              </div>
            )}
          </div>

          <AddressBook
            initialAddresses={addresses}
            shippingLocations={shippingLocations}
            locale={locale}
          />
        </section>
        <aside className="self-start rounded-xs border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-6 shadow-subtle md:p-8 backdrop-blur-sm">
          <h2 className="font-serif text-2xl md:text-3xl text-[var(--text-primary)]">
            {locale === "ar" ? "تفاصيل الحساب" : "Account details"}
          </h2>
          <dl className="mt-6 divide-y divide-[var(--border-subtle)] text-sm">
            <div className="py-4">
              <dt className="text-[10px] font-bold uppercase tracking-[.14em] text-[var(--text-muted)]">
                {locale === "ar" ? "البريد الإلكتروني" : "Email"}
              </dt>
              <dd className="mt-2 break-all text-[var(--text-primary)] font-mono text-xs">{email}</dd>
            </div>
            <div className="py-4">
              <dt className="text-[10px] font-bold uppercase tracking-[.14em] text-[var(--text-muted)]">
                {locale === "ar" ? "اللغة المفضلة" : "Preferred language"}
              </dt>
              <dd className="mt-2 uppercase font-medium text-[var(--text-primary)]">
                {profile?.preferred_locale ?? locale}
              </dd>
            </div>
          </dl>
          <Link
            href={`/${locale}/account/update-password`}
            className="mt-6 inline-block text-xs text-[var(--text-secondary)] underline underline-offset-4 hover:text-[var(--color-primary)] transition-colors"
          >
            {locale === "ar" ? "تغيير كلمة المرور" : "Change password"}
          </Link>
          <Link href={`/${locale}/account/returns` as Route} className="mt-4 block text-xs text-[var(--text-secondary)] underline underline-offset-4 hover:text-[var(--color-primary)]">{locale === "ar" ? "طلبات الاسترجاع والاستبدال" : "Returns & exchanges"}</Link>
          <Link
            href={`/${locale}/admin` as Route}
            className="mt-4 block rounded-xs bg-[var(--color-primary)] px-5 py-3.5 text-center text-xs font-bold uppercase tracking-[.14em] text-white shadow-subtle transition-all hover:bg-[var(--color-primary-hover)] active:scale-[0.99]"
          >
            {locale === "ar"
              ? canAdmin
                ? "لوحة الإدارة والتحكم"
                : "فتح لوحة الإدارة (Staff)"
              : canAdmin
                ? "Admin Dashboard"
                : "Open Admin Dashboard (Staff)"}
          </Link>
          <form action={signOutAction} className="mt-6">
            <input type="hidden" name="locale" value={locale} />
            <button className="h-12 w-full rounded-xs border border-[var(--border-subtle)] bg-white text-xs font-bold uppercase tracking-[.14em] text-[var(--text-primary)] transition-all hover:border-[var(--border-strong)] hover:bg-[var(--surface-sunken)] active:scale-[0.99]">
              {locale === "ar" ? "تسجيل الخروج" : "Sign out"}
            </button>
          </form>
        </aside>
      </div>
    </main>
  );
}
