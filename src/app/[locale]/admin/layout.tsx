import type { Route } from "next";
import Link from "next/link";
import { BadgePercent, ImageIcon, LayoutDashboard, Package, Ruler, ShoppingBag, Truck } from "lucide-react";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";

export default async function AdminLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ar = locale === "ar";
  const items = [
    [LayoutDashboard, ar ? "الرئيسية" : "Overview", `/${locale}/admin`],
    [ShoppingBag, ar ? "الطلبات" : "Orders", `/${locale}/admin/orders`],
    [Package, ar ? "المنتجات" : "Products", `/${locale}/admin#products`],
    [Truck, ar ? "الشحن" : "Shipping", `/${locale}/admin/shipping`],
    [BadgePercent, ar ? "الخصومات" : "Discounts", `/${locale}/admin/discounts`],
    [ImageIcon, ar ? "المحتوى" : "Content", `/${locale}/admin/banners`],
    [Ruler, ar ? "المقاسات" : "Sizes", `/${locale}/admin/sizes`],
  ] as const;
  return (
    <div className="min-h-screen bg-[#eef2ef]">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#052c28] text-white shadow-sm">
        <div className="mx-auto flex min-h-16 max-w-[1600px] items-center gap-5 overflow-x-auto px-4 md:px-8">
          <Link href={`/${locale}/admin` as Route} className="shrink-0 border-e border-white/15 pe-5 text-sm font-black tracking-[-.04em]">
            SCRUB <span className="font-light text-[#81c5b8]">VIBE</span><span className="ms-2 text-[9px] font-semibold uppercase tracking-[.14em] text-white/50">Admin</span>
          </Link>
          <nav className="flex min-h-16 items-stretch" aria-label={ar ? "تنقل لوحة الإدارة" : "Admin navigation"}>
            {items.map(([Icon, label, href]) => (
              <Link key={href} href={href as Route} className="flex min-w-max items-center gap-2 px-3 text-[10px] font-bold uppercase tracking-[.1em] text-white/68 hover:bg-white/8 hover:text-white">
                <Icon size={15} aria-hidden="true" />{label}
              </Link>
            ))}
          </nav>
          <Link href={`/${locale}`} className="ms-auto shrink-0 px-3 text-[10px] font-bold uppercase tracking-[.1em] text-[#81c5b8] hover:text-white">{ar ? "عرض المتجر" : "View store"}</Link>
        </div>
      </header>
      {children}
    </div>
  );
}
