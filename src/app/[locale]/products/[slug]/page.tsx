import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Heart, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { AddProduct } from "@/components/store/add-product";
import { catalog } from "@/lib/catalog";
import { discountPercent, formatMoney } from "@/lib/money";
import { isLocale } from "@/lib/i18n";

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
    <main className="mx-auto max-w-[1600px] px-5 py-8 md:px-10 md:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="grid gap-10 lg:grid-cols-[1.35fr_.65fr]">
        <div className="product-art min-h-[520px] bg-[#ebe9e4] lg:min-h-[760px]">
          <Image
            src={p.image.src}
            alt={p.image.alt[locale]}
            fill
            preload
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="object-cover object-top"
          />
        </div>
        <div className="lg:sticky lg:top-6 lg:self-start">
          <p className="eyebrow text-[#0e7468]">SCRUB VIBE · {p.category}</p>
          <h1 className="mt-4 font-serif text-4xl md:text-5xl">
            {p.title[locale]}
          </h1>
          <div className="mt-5 flex gap-3 text-sm">
            <strong>{formatMoney(p.price, locale)}</strong>
            {p.compareAt && (
              <>
                <span className="text-neutral-500 line-through">
                  {formatMoney(p.compareAt, locale)}
                </span>
                <span className="text-[#a6432b]">-{sale}%</span>
              </>
            )}
          </div>
          <p className="mt-7 max-w-lg text-sm leading-7 text-neutral-600">
            {p.description[locale]}
          </p>
          <p className="mt-8 text-xs font-bold uppercase tracking-[.14em]">
            {p.colorName[locale]}
          </p>
          <span
            className="mt-3 block size-8 rounded-full border-2 border-white ring-1 ring-black"
            style={{ background: p.color }}
          />
          <AddProduct product={p} locale={locale} />
          <div className="mt-8 divide-y divide-black/10 border-y border-black/10 text-xs">
            {[
              [Truck, "Delivery across Egypt"],
              [RotateCcw, "14-day returns"],
              [ShieldCheck, "Secure payment or cash on delivery"],
            ].map(([Icon, text]) => {
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
          <button className="mt-6 flex items-center gap-2 text-xs">
            <Heart size={17} />
            {locale === "ar" ? "أضف إلى المفضلة" : "Add to wishlist"}
          </button>
        </div>
      </div>
    </main>
  );
}
