"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Layers3 } from "lucide-react";
import { useShop } from "@/components/store/cart-provider";
import { formatMoney } from "@/lib/money";
import type { Locale } from "@/lib/i18n";
import type { ProductBundle } from "./types";

export function BundleCard({ bundle, locale }: { bundle: ProductBundle; locale: Locale }) {
  const { addToCart } = useShop();
  const [added, setAdded] = useState(false);
  const ar = locale === "ar";
  const available = bundle.products.every((product) => product.inStock);
  const total = bundle.products.reduce((sum, product) => sum + product.price, 0);

  function addSet() {
    bundle.products.forEach((product) => addToCart(product));
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <section className="mt-14 border border-[#0e7468]/20 bg-[#f0f5f3] p-5 sm:p-7">
      <div className="flex items-start gap-3">
        <Layers3 className="mt-1 shrink-0 text-[#0e7468]" size={22} />
        <div>
          <p className="eyebrow text-[#0e7468]">{ar ? "تسوق الإطلالة" : "SHOP THE SET"}</p>
          <h2 className="mt-2 font-serif text-3xl">{bundle.title[locale]}</h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">{bundle.description[locale]}</p>
        </div>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {bundle.products.map((product, index) => (
          <Link key={`${product.id}-${index}`} href={`/${locale}/products/${product.slug}`} className="flex items-center gap-3 bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-sm">
            <div className="relative size-16 shrink-0 overflow-hidden bg-[#e8e5df]">
              <Image src={product.image.src} alt={product.image.alt[locale]} fill sizes="64px" className="object-cover" />
            </div>
            <span className="min-w-0">
              <strong className="block truncate text-sm">{product.title[locale]}</strong>
              <small className="text-[var(--text-muted)]">{formatMoney(product.price, locale)}</small>
            </span>
          </Link>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-[#0e7468]/15 pt-5">
        <strong>{ar ? "إجمالي المجموعة" : "Set total"}: {formatMoney(total, locale)}</strong>
        <button type="button" disabled={!available} onClick={addSet} className="inline-flex min-h-12 items-center justify-center gap-2 bg-[#073b36] px-6 text-xs font-bold uppercase tracking-[.12em] text-white disabled:cursor-not-allowed disabled:opacity-45">
          {added ? <Check size={17} /> : <Layers3 size={17} />}
          {added ? (ar ? "تمت إضافة المجموعة" : "Set added to bag") : available ? (ar ? "أضف المجموعة" : "Add set to bag") : (ar ? "المجموعة غير متاحة" : "Set unavailable")}
        </button>
      </div>
      <p className="sr-only" aria-live="polite">{added ? (ar ? "تمت إضافة كل منتجات المجموعة إلى الحقيبة" : "All set items were added to your bag") : ""}</p>
    </section>
  );
}

