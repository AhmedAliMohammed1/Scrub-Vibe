"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Check, Heart, Plus, Star } from "lucide-react";
import type { Product } from "@/features/catalog/types";
import { discountPercent, formatMoney } from "@/lib/money";
import type { Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { useShop } from "./cart-provider";

export function ProductCard({
  product,
  locale,
  priority = false,
}: {
  product: Product;
  locale: Locale;
  priority?: boolean;
}) {
  const { addToCart, toggleWishlist, wishlist } = useShop();
  const [added, setAdded] = useState(false);
  const [feedbackVersion, setFeedbackVersion] = useState(0);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wished = wishlist.includes(product.id);
  const discount = discountPercent(product.price, product.compareAt);
  const quickColour = product.colors.find((colour) => colour.inStock);
  const ar = locale === "ar";

  useEffect(
    () => () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    },
    [],
  );

  const handleQuickAdd = () => {
    addToCart(product);
    setAdded(true);
    setFeedbackVersion((version) => version + 1);

    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setAdded(false), 1400);
  };

  const quickAddLabel = ar ? "إضافة سريعة" : "Quick add";
  const addedLabel = ar ? "تمت الإضافة للحقيبة" : "Added to bag";

  return (
    <article className="group flex flex-col justify-between overflow-hidden">
      <div>
        {/* Media Frame */}
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xs border border-[var(--border-subtle)] bg-[#ebe9e4]">
          <Link
            href={`/${locale}/products/${product.slug}`}
            tabIndex={-1}
            className="relative block size-full"
          >
            <Image
              src={product.image.src}
              alt={product.image.alt[locale]}
              fill
              preload={priority}
              sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
              className="object-cover transition duration-500 ease-out group-hover:scale-[1.03]"
            />
          </Link>

          {/* Status Badge */}
          <div className="absolute start-2.5 top-2.5 z-10 flex flex-col gap-1 sm:start-3 sm:top-3">
            {product.badge === "sale" && discount ? (
              <span className="rounded-xs bg-[#a5472f] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[.14em] text-white shadow-xs sm:text-[10px]">
                -{discount}%
              </span>
            ) : product.badge === "low" ? (
              <span className="rounded-xs bg-[#f0f5f3] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[.14em] text-[#073b36] shadow-xs sm:text-[10px]">
                {ar ? "كمية محدودة" : "Low stock"}
              </span>
            ) : (
              <span className="rounded-xs bg-white/95 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[.14em] text-[#073b36] shadow-xs sm:text-[10px]">
                {ar ? "جديد" : "New in"}
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={() => toggleWishlist(product.id)}
            className={`absolute end-2.5 top-2.5 z-10 grid size-11 place-items-center rounded-full bg-white/95 shadow-xs transition hover:scale-105 sm:end-3 sm:top-3 ${
              wished
                ? "text-[#a5472f]"
                : "text-[var(--text-strong)] hover:text-[#073b36]"
            }`}
            aria-label={
              wished
                ? ar
                  ? "إزالة من قائمة الأمنيات"
                  : "Remove from wishlist"
                : ar
                  ? "إضافة إلى قائمة الأمنيات"
                  : "Add to wishlist"
            }
          >
            <Heart
              size={18}
              strokeWidth={1.8}
              fill={wished ? "currentColor" : "none"}
              aria-hidden="true"
            />
          </button>

          {/* Quick Add Button */}
          <Button
            type="button"
            onClick={handleQuickAdd}
            disabled={!quickColour}
            aria-label={added ? addedLabel : quickAddLabel}
            className={`absolute inset-x-2 bottom-2 z-10 min-h-11 px-3 text-[10px] tracking-[.12em] shadow-sm transition-all duration-200 sm:inset-x-3 sm:bottom-3 sm:text-[11px] lg:translate-y-2 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 lg:focus-visible:translate-y-0 lg:focus-visible:opacity-100 ${
              added
                ? "border-[#18794e] bg-[#18794e] text-white hover:bg-[#18794e]"
                : "border-[var(--border-subtle)] bg-white/98 text-[#073b36] hover:border-[#0e7468] hover:bg-[#f0f5f3]"
            }`}
          >
            <span
              key={feedbackVersion}
              className={
                added ? "quick-add-confirm" : "flex items-center gap-2"
              }
              aria-hidden="true"
            >
              {added ? (
                <Check size={16} strokeWidth={2.5} />
              ) : (
                <Plus size={15} />
              )}
              {added ? addedLabel : quickAddLabel}
            </span>
          </Button>
          <span className="sr-only" aria-live="polite" aria-atomic="true">
            {added
              ? ar
                ? `تمت إضافة ${product.title.ar} إلى الحقيبة`
                : `${product.title.en} added to bag`
              : ""}
          </span>
        </div>

        {/* Product Meta */}
        <div className="pt-3.5 sm:pt-4">
          <Link
            href={`/${locale}/products/${product.slug}`}
            className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--text-strong)] transition-colors hover:text-[#0e7468]"
          >
            {product.title[locale]}
          </Link>

          {product.rating && product.rating.count > 0 && (
            <Link
              href={`/${locale}/products/${product.slug}#reviews`}
              aria-label={
                ar
                  ? `${product.rating.average} من 5، ${product.rating.count} تقييم`
                  : `${product.rating.average} out of 5, ${product.rating.count} reviews`
              }
              className="mt-2 flex min-h-6 w-fit items-center gap-1.5 text-[11px] font-semibold text-[var(--text-muted)] hover:text-[#0e7468]"
            >
              <Star size={13} fill="currentColor" className="text-[#bd6b2c]" aria-hidden="true" />
              <span>{product.rating.average.toFixed(1)}</span>
              <span className="text-black/35">({product.rating.count})</span>
            </Link>
          )}

          {/* Color swatches */}
          <div
            className="mt-2.5 flex min-h-5 items-center gap-1.5"
            aria-label={`${product.colors.length} ${ar ? "ألوان" : "colours"}`}
          >
            {product.colors.slice(0, 5).map((colour) => (
              <span
                key={colour.code}
                className={`size-3.5 rounded-full border border-black/20 shadow-2xs ${
                  colour.inStock ? "" : "opacity-30"
                }`}
                style={{ backgroundColor: colour.swatch }}
                title={colour.name[locale]}
              />
            ))}
            {product.colors.length > 5 && (
              <span className="text-[10px] font-semibold text-[var(--text-muted)]">
                +{product.colors.length - 5}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Pricing and size info */}
      <div className="mt-2 pt-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <strong className="text-sm font-bold text-[var(--text-strong)] sm:text-base">
            {formatMoney(product.price, locale)}
          </strong>
          {product.compareAt && (
            <span className="text-xs text-[var(--text-muted)] line-through">
              {formatMoney(product.compareAt, locale)}
            </span>
          )}
        </div>
        <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
          {product.sizes.length} {ar ? "مقاسات متاحة" : "sizes available"}
        </p>
      </div>
    </article>
  );
}
