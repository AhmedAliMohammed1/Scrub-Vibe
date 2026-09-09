import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { AddProduct } from "@/components/store/add-product";
import { ProductCard } from "@/components/store/product-card";
import { BundleCard } from "@/features/commercial/bundle-card";
import { StockNotifyForm } from "@/features/commercial/stock-notify-form";
import { getProductMerchandising } from "@/features/commercial/repository";
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
        title: `${p.title[locale]} — Scrub Vibe`,
        description: p.description[locale],
      }
    : {};
}

export default async function ProductPage({ params }: Props) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const ar = locale === "ar";
  const p = await catalog.bySlug(slug);
  if (!p) notFound();

  const [sizeChartResult, merchandising] = await Promise.all([
    getSizeChartForProduct({
      productId: Number(p.id) || null,
      category: (p.category as SizeCategory) || "unisex",
    }),
    getProductMerchandising(Number(p.id)),
  ]);
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
      availability: p.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <main
      className="mx-auto max-w-[1440px] px-5 py-6 sm:px-6 md:px-10 md:py-12"
      data-product-id={p.id}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb Navigation */}
      <nav
        aria-label={ar ? "مسار التنقل" : "Breadcrumb"}
        className="mb-8 flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]"
      >
        <Link
          href={`/${locale}/shop`}
          className="transition-colors hover:text-[#0e7468]"
        >
          {ar ? "المتجر" : "Shop"}
        </Link>
        <ChevronRight size={14} className="rtl:rotate-180 text-black/30" aria-hidden="true" />
        <Link
          href={`/${locale}/shop?category=${p.category}`}
          className="capitalize transition-colors hover:text-[#0e7468]"
        >
          {p.category}
        </Link>
        <ChevronRight size={14} className="rtl:rotate-180 text-black/30" aria-hidden="true" />
        <span aria-current="page" className="truncate text-[var(--text-strong)]">
          {p.title[locale]}
        </span>
      </nav>

      {/* Main PDP Grid */}
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        {/* Media Frame */}
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xs border border-[var(--border-subtle)] bg-[#ebe9e4] shadow-xs lg:aspect-auto lg:min-h-[720px]">
          <Image
            src={p.image.src}
            alt={p.image.alt[locale]}
            fill
            preload
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="object-cover object-top"
          />
        </div>

        {/* Product Purchase Pane */}
        <div className="min-w-0 lg:sticky lg:top-24 lg:self-start lg:py-2">
          <p className="eyebrow text-[#0e7468]">
            SCRUB VIBE · {p.category}
          </p>

          <h1 className="mt-3 font-serif text-3xl sm:text-4xl lg:text-5xl text-[var(--text-strong)] leading-tight">
            {p.title[locale]}
          </h1>

          {/* Pricing Row */}
          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <strong className="text-2xl font-bold text-[var(--text-strong)]">
              {formatMoney(p.price, locale)}
            </strong>
            {p.compareAt && (
              <>
                <span className="text-sm text-[var(--text-muted)] line-through">
                  {formatMoney(p.compareAt, locale)}
                </span>
                <span className="rounded-xs bg-[#a5472f] px-2 py-0.5 text-xs font-bold text-white shadow-2xs">
                  -{sale}%
                </span>
              </>
            )}
          </div>

          {/* Description */}
          <p className="mt-5 max-w-lg text-sm leading-relaxed text-[var(--text-muted)] sm:text-base">
            {p.description[locale]}
          </p>

          {/* Color & Size Selectors with Add to Bag */}
          <AddProduct
            product={p}
            locale={locale}
            sizeChartEntries={sizeChartResult.entries}
            isProductOverride={sizeChartResult.isProductOverride}
          />
          {(!p.inStock || p.colors.some((colour) =>
            Object.values(colour.stockBySize).some((quantity) => quantity <= 0),
          )) && <StockNotifyForm product={p} locale={locale} />}

          {/* Trust Assurances */}
          <div className="mt-10 divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-strong)]">
            {(ar
              ? [
                  [Truck, "توصيل سريع لجميع محافظات مصر الـ ٢٧"],
                  [RotateCcw, "استبدال واسترجاع مرن خلال ١٤ يوماً من الاستلام"],
                  [ShieldCheck, "دفع آمن ومحمي، مع خيار الدفع عند الاستلام بمقدم"],
                ]
              : [
                  [Truck, "Fast delivery across all 27 Egypt governorates"],
                  [RotateCcw, "14-day hassle-free replacement and returns"],
                  [
                    ShieldCheck,
                    "Secure payment, with cash on delivery with deposit option",
                  ],
                ]
            ).map(([Icon, text]) => {
              const C = Icon as typeof Truck;
              return (
                <div
                  key={String(text)}
                  className="flex items-center gap-3.5 py-4"
                >
                  <C size={18} className="shrink-0 text-[#0e7468]" strokeWidth={1.8} aria-hidden="true" />
                  <span>{text as string}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {merchandising.bundles.map((bundle) => (
        <BundleCard key={bundle.id} bundle={bundle} locale={locale} />
      ))}

      {merchandising.related.length > 0 && (
        <section className="mt-20 border-t border-[var(--border-subtle)] pt-10">
          <p className="eyebrow text-[#0e7468]">{ar ? "أكمل الإطلالة" : "COMPLETE THE LOOK"}</p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <h2 className="font-serif text-3xl sm:text-4xl">{ar ? "اختيارات مناسبة مع هذا المنتج" : "Pairs well with your choice"}</h2>
            <Link href={`/${locale}/shop`} className="shrink-0 text-xs font-bold underline underline-offset-4">{ar ? "عرض الكل" : "View all"}</Link>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 lg:gap-x-5">
            {merchandising.related.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} locale={locale} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
