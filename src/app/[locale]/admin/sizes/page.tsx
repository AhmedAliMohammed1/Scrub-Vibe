import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n";
import { requireRoles } from "@/server/auth/roles";
import { getAdminSizeChartOverview } from "@/features/catalog/size-guide-repository";
import { AdminSizeEditor } from "@/features/catalog/admin-size-editor";

export const metadata: Metadata = {
  title: "Size Guide & Measurements | Scrub Vibe Admin",
  robots: { index: false, follow: false },
};

export default async function AdminSizesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string; error?: string; success?: string }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  await requireRoles(["admin", "super_admin"]);

  const overview = await getAdminSizeChartOverview();
  const ar = locale === "ar";

  return (
    <main className="min-h-screen bg-[#eef2ef]">
      <header className="bg-[#062f2b] text-white">
        <div className="mx-auto max-w-[1600px] px-5 py-10 md:px-10 md:py-14">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="eyebrow text-[#81c5b8]">
                SCRUB VIBE · SIZING CONTROL
              </p>
              <h1 className="mt-3 font-serif text-5xl md:text-7xl">
                {ar ? "دليل المقاسات والقياسات" : "Sizes & measurements"}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/65">
                {ar
                  ? "تحكم في أبعاد كل مقاس (الصدر، الخصر، الأرداف، الطول) للمجموعات المختلفة أو خصص مقاسات فريدة لمنتج محدد."
                  : "Control exact chest, waist, hip, and length dimensions for collections, or customize unique measurements for specific products."}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/${locale}/admin` as Route}
                className="border border-white/25 px-4 py-3 text-[10px] font-bold uppercase tracking-[.14em]"
              >
                {ar ? "لوحة الإدارة" : "Dashboard"}
              </Link>
              <Link
                href={`/${locale}/admin/banners` as Route}
                className="border border-white/25 px-4 py-3 text-[10px] font-bold uppercase tracking-[.14em]"
              >
                {ar ? "البانرات" : "Banners"}
              </Link>
              <Link
                href={`/${locale}/shop` as Route}
                className="bg-white px-4 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-[#062f2b]"
              >
                {ar ? "معاينة المتجر" : "Storefront"}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-5 py-8 md:px-10 md:py-12">
        {query.error && (
          <aside className="mb-6 border border-rose-300 bg-rose-50 p-4 text-xs font-semibold text-rose-900">
            ⚠️ {query.error}
          </aside>
        )}
        {query.success && (
          <aside className="mb-6 border border-emerald-300 bg-emerald-50 p-4 text-xs font-semibold text-emerald-900">
            ✓ {query.success}
          </aside>
        )}

        <AdminSizeEditor
          overview={overview}
          locale={locale as Locale}
          activeTab={query.tab}
        />
      </div>
    </main>
  );
}
