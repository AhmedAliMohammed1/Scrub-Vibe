import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgePercent,
  LayoutDashboard,
  Ruler,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { isLocale } from "@/lib/i18n";
import { requireRoles } from "@/server/auth/roles";
import { AdminBannersManager } from "@/features/cms/admin-banners-manager";
import { getAllBanners } from "@/features/cms/repository";

export const metadata: Metadata = {
  title: "Storefront Banners & Merchandising | Scrub Vibe Admin",
  robots: { index: false, follow: false },
};

export default async function AdminBannersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase } = await requireRoles(["admin", "super_admin"]);

  const banners = await getAllBanners(supabase);
  const ar = locale === "ar";

  return (
    <main className="min-h-screen bg-[#eef2ef]">
      {/* Admin Header */}
      <section className="border-b border-white/10 bg-[#062f2b] text-white">
        <div className="mx-auto max-w-[1600px] px-5 py-10 md:px-10 md:py-14">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow text-[#81c5b8]">
                SCRUB VIBE · MERCHANDISING CMS
              </p>
              <h1 className="mt-3 font-serif text-5xl md:text-7xl">
                {ar ? "إدارة البانرات والعروض" : "Banners & merchandising"}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">
                {ar
                  ? "تحكم في شريط الإعلانات، وبانرات الواجهة الرئيسية، والأقسام الترويجية مع إمكانية الجدولة واختيار الألوان والصور دون الحاجة لتحديث الكود."
                  : "Manage announcement tickers, hero carousels, and editorial promo sections with custom colors, images, and scheduling without code redeployments."}
              </p>
            </div>

            {/* Cross-admin navigation */}
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/${locale}/admin` as Route}
                className="border border-white/25 px-4 py-3 text-[10px] font-bold uppercase tracking-[.14em]"
              >
                <span className="flex items-center gap-1.5">
                  <LayoutDashboard size={13} />
                  {ar ? "الرئيسية" : "Overview"}
                </span>
              </Link>
              <Link
                href={`/${locale}/admin/discounts` as Route}
                className="border border-white/25 px-4 py-3 text-[10px] font-bold uppercase tracking-[.14em]"
              >
                <span className="flex items-center gap-1.5">
                  <BadgePercent size={13} />
                  {ar ? "الخصومات" : "Discounts"}
                </span>
              </Link>
              <Link
                href={`/${locale}/admin/sizes` as Route}
                className="border border-white/25 px-4 py-3 text-[10px] font-bold uppercase tracking-[.14em]"
              >
                <span className="flex items-center gap-1.5">
                  <Ruler size={13} />
                  {ar ? "المقاسات" : "Sizes"}
                </span>
              </Link>
              <Link
                href={`/${locale}/admin/shipping` as Route}
                className="border border-white/25 px-4 py-3 text-[10px] font-bold uppercase tracking-[.14em]"
              >
                <span className="flex items-center gap-1.5">
                  <Truck size={13} />
                  {ar ? "التوصيل" : "Delivery"}
                </span>
              </Link>
              <Link
                href={`/${locale}/admin/orders` as Route}
                className="border border-white/25 px-4 py-3 text-[10px] font-bold uppercase tracking-[.14em]"
              >
                <span className="flex items-center gap-1.5">
                  <ShoppingBag size={13} />
                  {ar ? "الطلبات" : "Orders"}
                </span>
              </Link>
              <Link
                href={`/${locale}` as Route}
                className="bg-white px-4 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-[#062f2b]"
              >
                {ar ? "معاينة المتجر" : "View store"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main CMS Workspace */}
      <div className="mx-auto max-w-[1600px] px-5 py-8 md:px-10 md:py-12">
        <AdminBannersManager initialBanners={banners} locale={locale} />
      </div>
    </main>
  );
}
