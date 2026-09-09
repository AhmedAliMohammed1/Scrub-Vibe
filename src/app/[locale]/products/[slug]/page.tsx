import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { AddProduct } from "@/components/store/add-product";
import { catalog } from "@/lib/catalog";
import { discountPercent, formatMoney } from "@/lib/money";
import { isLocale } from "@/lib/i18n";
import { getSizeChartForProduct } from "@/features/catalog/size-guide-repository";
import type { SizeCategory } from "@/features/catalog/size-guide-types";

type Props = { params: Promise<{ locale: string; slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const p = await catalog.bySlug(slug);
  return p
    ? {
        title: p.title[locale],
        description: p.description[locale],
      }
    : {};
}
export default async function ProductPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const p = await catalog.bySlug(slug);
  if (!p) notFound();
  const sizeChartResult = await getSizeChartForProduct({
    productId: Number(p.id) || null,
    category: (p.category as SizeCategory) || "unisex",
  });
  const sale = discountPercent(p.price, p.compareAt);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.title[locale],
    description: p.description[locale],
    image: p.image.src,
    sku: p.id,
    offers: {
      "@type": "Offer",
      price: p.price / 100,
      priceCurrency: "EGP",
      availability: "https://schema.org/InStock",
    },
  };
  return (
    <main
      className="mx-auto max-w-[1440px] px-5 py-5 md:px-10 md:py-10"
      data-product-id={p.id}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label={locale === "ar" ? "مسار التنقل" : "Breadcrumb"} className="mb-5 flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <Link href={`/${locale}/shop`} className="hover:text-[#0e7468]">{locale === "ar" ? "المتجر" : "Shop"}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="truncate">{p.title[locale]}</span>
      </nav>
      <div className="grid gap-7 lg:grid-cols-[1.15fr_.85fr] lg:gap-14">
        <div
          className="product-art relative aspect-[4/5] min-h-0 bg-[#ebe9e4] lg:aspect-auto lg:min-h-[720px]"
          style={{ position: "relative" }}
        >
          <Image
            src={p.image.src}
            alt={p.image.alt[locale]}
            fill
            preload
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="object-cover object-top"
          />
        </div>
        <div className="min-w-0 lg:sticky lg:top-28 lg:self-start lg:py-4">
          <p className="eyebrow text-[#0e7468]">SCRUB VIBE · {p.category}</p>
          <h1 className="mt-3 text-balance font-serif text-4xl leading-[1.02] md:text-5xl">
            {p.title[locale]}
          </h1>
          <div className="mt-5 flex flex-wrap items-center gap-3 text-base">
            <strong className="text-lg">{formatMoney(p.price, locale)}</strong>
            {p.compareAt && (
              <>
                <span className="text-neutral-600 line-through">
                  {formatMoney(p.compareAt, locale)}
                </span>
                <span className="text-[#a6432b]">-{sale}%</span>
              </>
            )}
          </div>
          <p className="mt-5 max-w-lg text-sm leading-7 text-[var(--text-muted)]">
            {p.description[locale]}
          </p>
          <AddProduct
            product={p}
            locale={locale}
            sizeChartEntries={sizeChartResult.entries}
            isProductOverride={sizeChartResult.isProductOverride}
          />
          <div className="mt-8 divide-y divide-black/10 border-y border-black/10 text-xs">
            {(locale === "ar"
              ? [
                  [Truck, "توصيل لجميع أنحاء مصر"],
                  [RotateCcw, "استبدال واسترجاع خلال ١٤ يوماً"],
                  [ShieldCheck, "دفع آمن أو الدفع عند الاستلام بمقدم"],
                ]
              : [
                  [Truck, "Delivery across Egypt"],
                  [RotateCcw, "14-day returns"],
                  [
                    ShieldCheck,
                    "Secure payment or cash on delivery with deposit",
                  ],
                ]
            ).map(([Icon, text]) => {
              const C = Icon as typeof Truck;
              return (
                <div
                  key={String(text)}
                  className="flex items-center gap-3 py-4"
                >
                  <C size={18} strokeWidth={1.4} />
                  {text as string}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
