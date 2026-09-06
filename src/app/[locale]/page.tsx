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
import { catalog } from "@/lib/catalog";
import { copy, isLocale } from "@/lib/i18n";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = copy[locale];
  const products = await catalog.featured();
  return (
    <main>
      <section className="relative min-h-[650px] overflow-hidden bg-[#073b36] md:min-h-[780px]">
        <Image
          src="/images/scrub-vibe/female-collection.webp"
          alt={
            locale === "ar"
              ? "فريق طبي يرتدي سكراب فايب"
              : "Medical professionals wearing Scrub Vibe sets"
          }
          fill
          preload
          sizes="100vw"
          className="object-cover object-[55%_58%] md:object-[60%_55%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#062e2a]/95 via-[#062e2a]/55 to-black/10 rtl:bg-gradient-to-l" />
        <div className="relative mx-auto flex min-h-[650px] max-w-[1600px] items-center px-5 py-24 md:min-h-[780px] md:px-12">
          <div className="max-w-2xl text-white">
            <p className="eyebrow mb-7">{t.eyebrow}</p>
            <h1 className="hero-title max-w-xl">{t.title}</h1>
            <p className="mt-7 max-w-md text-sm leading-6 md:text-base">
              {t.heroBody}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href={`/${locale}/shop?category=women`}
                className="bg-white px-6 py-4 text-[11px] font-bold uppercase tracking-[.14em] text-[#073b36]"
              >
                {t.shopWomen}
              </Link>
              <Link
                href={`/${locale}/shop?category=men`}
                className="border border-white px-6 py-4 text-[11px] font-bold uppercase tracking-[.14em]"
              >
                {t.shopMen}
              </Link>
            </div>
          </div>
          <ArrowDown
            className="absolute bottom-7 start-1/2 animate-bounce text-white"
            size={20}
          />
        </div>
      </section>
      <section className="mx-auto max-w-[1600px] px-5 py-20 md:px-10 md:py-28">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="eyebrow text-[#0e7468]">NEW COLLECTION</p>
            <h2 className="mt-3 font-serif text-4xl md:text-6xl">
              {t.arrivals}
            </h2>
            <p className="mt-3 text-sm text-neutral-600">{t.arrivalsBody}</p>
          </div>
          <Link
            href={`/${locale}/shop`}
            className="hidden items-center gap-2 border-b border-current pb-1 text-[10px] font-bold uppercase tracking-[.15em] md:flex"
          >
            {t.viewAll}
            <ArrowUpRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-10 lg:grid-cols-4 lg:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} locale={locale} />
          ))}
        </div>
      </section>
      <section
        id="quality"
        className="grid min-h-[640px] overflow-hidden md:grid-cols-2"
      >
        <div className="relative min-h-[540px] min-w-0 overflow-hidden bg-[#0e7468]">
          <Image
            src="/images/scrub-vibe/male-collection.jpg"
            alt={
              locale === "ar"
                ? "سكراب رجالي من سكراب فايب"
                : "Scrub Vibe male scrub collection"
            }
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover object-center"
          />
        </div>
        <div className="flex min-w-0 items-center overflow-hidden bg-[#dce9e5] px-8 py-20 md:px-16">
          <div className="min-w-0 max-w-lg">
            <p className="eyebrow text-[#0e7468]">{t.curated}</p>
            <h2 className="mt-5 font-serif text-5xl leading-[.98] md:text-7xl">
              {locale === "ar"
                ? "صُنع للراحة. مصمم ليدوم."
                : "Made for comfort. Built to last."}
            </h2>
            <p className="mt-7 max-w-md text-sm leading-7 text-neutral-700">
              {locale === "ar"
                ? "نصنع السكراب في مصنعنا بخامات عالية الجودة، وقصات مضبوطة، وجيوب عملية تساعدك في كل شيفت."
                : "Manufactured in our own factory with premium fabric, a precise fit and practical pockets that work as hard as you do."}
            </p>
            <Link
              href={`/${locale}/shop`}
              className="mt-9 inline-flex items-center gap-2 border-b border-current pb-1 text-[10px] font-bold uppercase tracking-[.15em]"
            >
              {t.viewAll}
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </section>
      <section className="trust-grid grid grid-cols-2 md:grid-cols-4">
        {(locale === "ar"
          ? [
              [Truck, "توصيل لكل مصر", "إلى جميع المحافظات"],
              [PackageCheck, "استبدال سهل", "سياسة واضحة وبسيطة"],
              [ShieldCheck, "دفع آمن", "مدفوعات محمية"],
              [Headphones, "نحن هنا لمساعدتك", "الأحد–الخميس، ١٠–٦"],
            ]
          : [
              [Truck, "Egypt-wide delivery", "To every governorate"],
              [PackageCheck, "Easy exchange", "Clear, simple policy"],
              [ShieldCheck, "Secure checkout", "Protected payments"],
              [Headphones, "Here to help", "Sunday–Thursday, 10–6"],
            ]
        ).map(([Icon, title, body]) => {
          const C = Icon as typeof Truck;
          return (
            <div key={String(title)} className="p-8 text-center md:p-12">
              <C className="mx-auto" strokeWidth={1.3} />
              <h3 className="mt-4 text-xs font-bold uppercase tracking-[.12em]">
                {title as string}
              </h3>
              <p className="mt-2 text-xs text-neutral-500">{body as string}</p>
            </div>
          );
        })}
      </section>
      <Newsletter locale={locale} />
      <footer className="flex flex-col justify-between gap-8 px-6 py-10 text-[10px] font-semibold uppercase tracking-[.13em] md:flex-row md:px-10">
        <span>© 2026 SCRUB VIBE EGYPT</span>
        <div className="flex flex-wrap gap-6">
          <Link href="mailto:scrubvibe30@gmail.com">
            {locale === "ar" ? "تواصل معنا" : "Contact"}
          </Link>
          <Link href="tel:01096733209">01096733209</Link>
          <Link href="https://www.instagram.com/scrubvibe_egy/">Instagram</Link>
        </div>
      </footer>
    </main>
  );
}
