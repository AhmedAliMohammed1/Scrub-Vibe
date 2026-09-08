import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShippingZoneForm, type AdminShippingZone } from "@/features/shipping/shipping-zone-form";
import { isLocale } from "@/lib/i18n";
import { requireRoles } from "@/server/auth/roles";

export const metadata: Metadata = {
  title: "Delivery pricing | Scrub Vibe Admin",
  robots: { index: false, follow: false },
};

export default async function AdminShippingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase } = await requireRoles(["admin", "super_admin"]);
  const { data, error } = await supabase
    .from("shipping_zones")
    .select(`
      id, code, name_en, name_ar, shipping_fee_minor,
      free_shipping_threshold_minor, cod_enabled, cod_surcharge_minor,
      delivery_min_days, delivery_max_days, is_active,
      shipping_governorates(name_en, name_ar, position)
    `)
    .order("position")
    .order("position", { referencedTable: "shipping_governorates" });

  if (error) throw new Error("Delivery zones could not be loaded.");
  const zones = data as unknown as AdminShippingZone[];
  const ar = locale === "ar";

  return (
    <main className="min-h-screen bg-[#eef2ef]">
      <header className="bg-[#062f2b] text-white">
        <div className="mx-auto max-w-6xl px-5 py-10 md:px-10 md:py-14">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="eyebrow text-[#81c5b8]">SCRUB VIBE · DELIVERY CONTROL</p>
              <h1 className="mt-3 font-serif text-5xl md:text-7xl">{ar ? "أسعار التوصيل" : "Delivery pricing"}</h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/65">{ar ? "تحكم في رسوم كل منطقة، وحد الشحن المجاني، وإتاحة الدفع عند الاستلام ومدة التوصيل." : "Control each zone’s fee, free-shipping threshold, COD availability and delivery promise."}</p>
            </div>
            <div className="flex gap-2">
              <Link href={`/${locale}/admin` as Route} className="border border-white/25 px-4 py-3 text-[10px] font-bold uppercase tracking-[.14em]">{ar ? "لوحة الإدارة" : "Dashboard"}</Link>
              <Link href={`/${locale}/admin/banners` as Route} className="border border-white/25 px-4 py-3 text-[10px] font-bold uppercase tracking-[.14em]">{ar ? "البانرات" : "Banners"}</Link>
              <Link href={`/${locale}/checkout` as Route} className="bg-white px-4 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-[#062f2b]">{ar ? "معاينة الدفع" : "Preview checkout"}</Link>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-5 px-5 py-8 md:px-10 md:py-12">
        <section className="border border-[#b47a1d]/25 bg-[#fffaf0] p-5 text-xs leading-6 text-neutral-700">
          {ar ? "الأسعار أدناه إعدادات أولية قابلة للتعديل. يحسب الخادم السعر النهائي عند إنشاء الطلب ويحفظ نسخة ثابتة منه، لذلك لن تتغير الطلبات القديمة عند تعديل الأسعار." : "The values below are editable launch defaults. The server calculates the final amount when an order is created and stores an immutable snapshot, so later price changes never alter past orders."}
        </section>
        {zones.map((zone) => <ShippingZoneForm key={zone.id} zone={zone} locale={locale} />)}
      </div>
    </main>
  );
}
