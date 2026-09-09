import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  Headphones,
  PackageCheck,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/store/product-card";
import { Newsletter } from "@/components/store/newsletter";
import { HeroCarousel } from "@/features/cms/hero-carousel";
import { PromoSection } from "@/features/cms/promo-section";
import { getActiveBanners } from "@/features/cms/repository";
import type { CmsBanner } from "@/features/cms/types";
import { catalog } from "@/lib/catalog";
import { copy, isLocale } from "@/lib/i18n";
import { hasSupabaseEnvironment } from "@/lib/supabase/config";
import { createPublicClient } from "@/lib/supabase/public";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = copy[locale];
  const ar = locale === "ar";

  const [products, banners] = await Promise.all([
    catalog.featured(),
    loadCmsBanners(),
  ]);

  const heroBanners = banners.heroes;
  const promoBanners = banners.promos;

  return (
    <main>
      {heroBanners.length > 0 ? (
        <HeroCarousel banners={heroBanners} locale={locale} />
      ) : (
        <section className="relative min-h-[620px] overflow-hidden bg-[#073b36] md:min-h-[760px]">
          <Image
            src="/images/scrub-vibe/female-collection.webp"
            alt={
              ar
                ? "فريق طبي يرتدي سكراب فايب"
                : "Medical professionals wearing Scrub Vibe sets"
            }
            fill
            preload
            sizes="100vw"
            className="object-cover object-[55%_58%] md:object-[60%_55%]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#062e2a]/95 via-[#062e2a]/65 to-black/20 rtl:bg-gradient-to-l" />
          <div className="relative mx-auto flex min-h-[620px] max-w-[1440px] items-center px-6 py-24 md:min-h-[760px] md:px-12">
            <div className="max-w-2xl text-white">
              <p className="eyebrow mb-5 text-[#81c5b8]">{t.eyebrow}</p>
              <h1 className="hero-title max-w-xl">{t.title}</h1>
              <p className="mt-6 max-w-lg text-sm leading-relaxed text-white/85 sm:text-base">
                {t.heroBody}
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href={`/${locale}/shop?category=women`}
                  className="inline-flex min-h-12 items-center justify-center rounded-xs bg-white px-8 text-xs font-bold uppercase tracking-[.14em] text-[#073b36] shadow-sm transition hover:bg-[#81c5b8] hover:text-[#073b36]"
                >
                  {t.shopWomen}
                </Link>
                <Link
                  href={`/${locale}/shop?category=men`}
                  className="inline-flex min-h-12 items-center justify-center rounded-xs border border-white/80 px-8 text-xs font-bold uppercase tracking-[.14em] text-white transition hover:bg-white/10"
                >
                  {t.shopMen}
                </Link>
              </div>
            </div>
            <ArrowDown
              className="absolute bottom-8 start-1/2 -translate-x-1/2 animate-bounce text-white/70"
              size={22}
              aria-hidden="true"
            />
          </div>
        </section>
      )}

      {/* Featured Collection Section */}
      <section className="mx-auto max-w-[1440px] px-5 py-20 md:px-10 md:py-28">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <p className="eyebrow text-[#0e7468]">
              {ar ? "تشكيلة جديدة" : "NEW COLLECTION"}
            </p>
            <h2 className="mt-3 font-serif text-3xl md:text-5xl lg:text-6xl">
              {t.arrivals}
            </h2>
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              {t.arrivalsBody}
            </p>
          </div>
          <Link
            href={`/${locale}/shop`}
            className="hidden items-center gap-2 border-b border-current pb-1 text-xs font-bold uppercase tracking-[.14em] text-[#073b36] transition hover:text-[#0e7468] md:flex"
          >
            {t.viewAll}
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-4 lg:gap-8">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              locale={locale}
              priority={index < 4}
            />
          ))}
        </div>
        <div className="mt-12 text-center md:hidden">
          <Link
            href={`/${locale}/shop`}
            className="inline-flex min-h-12 items-center justify-center rounded-xs border border-[var(--border-subtle)] bg-white px-8 text-xs font-bold uppercase tracking-[.14em] text-[#073b36]"
          >
            {t.viewAll}
          </Link>
        </div>
      </section>

      {/* Brand Quality Feature Block */}
      {promoBanners.length > 0 ? (
        <PromoSection banners={promoBanners} locale={locale} />
      ) : (
        <section
          id="quality"
          className="grid min-h-[600px] overflow-hidden md:grid-cols-2"
        >
          <div className="relative min-h-[480px] min-w-0 overflow-hidden bg-[#0e7468]">
            <Image
              src="/images/scrub-vibe/male-collection.jpg"
              alt={
                ar
                  ? "سكراب رجالي من سكراب فايب"
                  : "Scrub Vibe male scrub collection"
              }
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover object-center"
            />
          </div>
          <div className="flex min-w-0 items-center overflow-hidden bg-[#dce9e5] px-8 py-16 sm:px-12 md:px-16 lg:px-20">
            <div className="min-w-0 max-w-lg">
              <p className="eyebrow text-[#0e7468]">{t.curated}</p>
              <h2 className="mt-4 font-serif text-3xl md:text-5xl lg:text-6xl">
                {ar
                  ? "صُنع للراحة. مصمم ليدوم."
                  : "Made for comfort. Built to last."}
              </h2>
              <p className="mt-6 max-w-md text-sm leading-relaxed text-neutral-700 sm:text-base">
                {ar
                  ? "نصنع السكراب في مصنعنا بخامات عالية الجودة، وقصات مضبوطة، وجيوب عملية مصممة خصيصاً للتعامل مع ضغط الشيفتات وساعات العمل الطويلة."
                  : "Manufactured in our own factory with premium breathable fabric, precision tailoring, and practical pockets engineered to endure your longest shifts."}
              </p>
              <Link
                href={`/${locale}/shop`}
                className="mt-8 inline-flex items-center gap-2 border-b border-current pb-1 text-xs font-bold uppercase tracking-[.14em] text-[#073b36] transition hover:text-[#0e7468]"
              >
                {t.viewAll}
                <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Trust & Guarantees Grid */}
      <section className="trust-grid border-y border-[var(--border-subtle)] bg-white">
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 divide-y divide-black/10 sm:divide-y-0 sm:divide-x md:grid-cols-4 rtl:sm:divide-x-reverse">
          {(ar
            ? [
                [Truck, "توصيل لكل مصر", "شحن سريع لجميع المحافظات الـ ٢٧"],
                [PackageCheck, "استبدال واسترجاع سهل", "سياسة واضحة ومرنة خلال ١٤ يوماً"],
                [ShieldCheck, "دفع آمن ومضمون", "فودافون كاش وإنستاباي والدفع عند الاستلام بمقدم"],
                [Headphones, "دعم متواصل", "فريق المساعدة جاهز لخدمتك يومياً"],
              ]
            : [
                [Truck, "Egypt-wide delivery", "Fast delivery to all 27 governorates"],
                [PackageCheck, "Easy exchange & returns", "Simple 14-day replacement policy"],
                [ShieldCheck, "Protected checkout", "Vodafone Cash, InstaPay & COD deposit"],
                [Headphones, "Dedicated support", "Our team is here to assist daily"],
              ]
          ).map(([Icon, title, body]) => {
            const C = Icon as typeof Truck;
            return (
              <div key={String(title)} className="p-8 text-center md:p-10">
                <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#f0f5f3] text-[#073b36]">
                  <C size={22} strokeWidth={1.6} aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-xs font-bold uppercase tracking-[.12em] text-[var(--text-strong)]">
                  {title as string}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">
                  {body as string}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Newsletter */}
      <Newsletter locale={locale} />
    </main>
  );
}

async function loadCmsBanners(): Promise<{
  heroes: CmsBanner[];
  promos: CmsBanner[];
}> {
  if (!hasSupabaseEnvironment()) return { heroes: [], promos: [] };
  try {
    const supabase = createPublicClient();
    const [heroes, promos] = await Promise.all([
      getActiveBanners(supabase, "hero"),
      getActiveBanners(supabase, "promo"),
    ]);
    return { heroes, promos };
  } catch {
    return { heroes: [], promos: [] };
  }
}
