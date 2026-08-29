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
      <section className="relative min-h-[650px] overflow-hidden md:min-h-[780px]">
        <Image
          src="/images/nova-cairo-hero.png"
          alt="NOVA Cairo summer editorial"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[68%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#efe2c8]/95 via-[#efe2c8]/35 to-transparent rtl:bg-gradient-to-l" />
        <div className="relative mx-auto flex min-h-[650px] max-w-[1600px] items-center px-5 py-24 md:min-h-[780px] md:px-12">
          <div className="max-w-2xl">
            <p className="eyebrow mb-7">{t.eyebrow}</p>
            <h1 className="hero-title max-w-xl">{t.title}</h1>
            <p className="mt-7 max-w-md text-sm leading-6 md:text-base">
              {t.heroBody}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href={`/${locale}/shop?category=women`}
                className="bg-neutral-950 px-6 py-4 text-[11px] font-bold uppercase tracking-[.14em] text-white"
              >
                {t.shopWomen}
              </Link>
              <Link
                href={`/${locale}/shop?category=men`}
                className="border border-neutral-950 px-6 py-4 text-[11px] font-bold uppercase tracking-[.14em]"
              >
                {t.shopMen}
              </Link>
            </div>
          </div>
          <ArrowDown
            className="absolute bottom-7 start-1/2 animate-bounce"
            size={20}
          />
        </div>
      </section>
      <section className="mx-auto max-w-[1600px] px-5 py-20 md:px-10 md:py-28">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="eyebrow text-[#a6432b]">JUST LANDED</p>
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
      <section className="grid min-h-[640px] overflow-hidden md:grid-cols-2">
        <div className="relative min-h-[480px] min-w-0 overflow-hidden bg-[#a6432b]">
          <div className="absolute -end-20 -top-20 size-96 rounded-full border border-white/20" />
          <div className="absolute -bottom-32 -start-20 size-[34rem] rounded-full border border-white/20" />
          <div className="absolute inset-0 grid place-items-center">
            <div className="relative h-[68%] w-[48%] rotate-[-7deg] bg-[#e6d7bd] shadow-2xl">
              <div className="absolute inset-4 border border-black/15" />
              <span className="absolute bottom-7 start-7 font-serif text-3xl">
                N° 01
              </span>
            </div>
          </div>
        </div>
        <div className="flex min-w-0 items-center overflow-hidden bg-[#ded4c1] px-8 py-20 md:px-16">
          <div className="min-w-0 max-w-lg">
            <p className="eyebrow text-[#a6432b]">{t.curated}</p>
            <h2 className="mt-5 font-serif text-5xl leading-[.98] md:text-7xl">
              {locale === "ar"
                ? "خزانة أخف، باختيارات أدق."
                : "A lighter wardrobe, considered."}
            </h2>
            <p className="mt-7 max-w-md text-sm leading-7 text-neutral-700">
              {locale === "ar"
                ? "قطع أساسية قابلة للتنسيق، مصنوعة لتُلبس كثيراً وتدوم طويلاً."
                : "Versatile essentials built to be worn often, combined freely, and kept for longer."}
            </p>
            <Link
              href={`/${locale}/shop?edit=essentials`}
              className="mt-9 inline-flex items-center gap-2 border-b border-current pb-1 text-[10px] font-bold uppercase tracking-[.15em]"
            >
              {t.viewAll}
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </section>
      <section className="trust-grid grid grid-cols-2 md:grid-cols-4">
        {[
          [Truck, "Free shipping", "Over 1,500 EGP"],
          [PackageCheck, "Easy returns", "Within 14 days"],
          [ShieldCheck, "Secure checkout", "Protected payments"],
          [Headphones, "Here to help", "Every day, 10–10"],
        ].map(([Icon, title, body]) => {
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
        <span>© 2026 NOVA CAIRO</span>
        <div className="flex flex-wrap gap-6">
          <Link href="#">Shipping</Link>
          <Link href="#">Returns</Link>
          <Link href="#">Privacy</Link>
          <Link href="#">Instagram</Link>
        </div>
      </footer>
    </main>
  );
}
