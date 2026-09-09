"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Plus } from "lucide-react";
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
  const wished = wishlist.includes(product.id);
  const discount = discountPercent(product.price, product.compareAt);
  const quickColour = product.colors.find((colour) => colour.inStock);
  return (
    <article className="group min-w-0 overflow-hidden">
      <div
        className="product-art relative bg-[#ebe9e4]"
        style={{ position: "relative" }}
      >
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
            className="object-cover transition duration-300 motion-safe:group-hover:scale-[1.015]"
          />
        </Link>
        <span className="absolute start-3 top-3 bg-[#f6f2ea] px-2 py-1 text-[9px] font-bold uppercase tracking-[.16em]">
          {product.badge === "sale"
            ? `-${discount}%`
            : product.badge === "low"
              ? locale === "ar"
                ? "كمية محدودة"
                : "Low stock"
              : locale === "ar"
                ? "جديد"
                : "New"}
        </span>
        <button
          onClick={() => toggleWishlist(product.id)}
          className="absolute end-2 top-2 grid size-11 place-items-center rounded-full bg-white/92 shadow-sm hover:bg-white sm:end-3 sm:top-3"
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={17} fill={wished ? "currentColor" : "none"} />
        </button>
        <Button
          onClick={() => addToCart(product)}
          disabled={!quickColour}
          className="absolute inset-x-2 bottom-2 min-h-11 bg-white/94 px-2 text-[9px] tracking-[.08em] text-[#073b36] opacity-100 hover:bg-white sm:inset-x-3 sm:bottom-3 sm:text-[11px] sm:tracking-[.14em] lg:translate-y-2 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 lg:focus:translate-y-0 lg:focus:opacity-100"
        >
          <Plus size={15} /> {locale === "ar" ? "إضافة سريعة" : "Quick add"}
        </Button>
      </div>
      <div className="pt-3 sm:pt-4">
        <div className="mb-2 min-w-0">
          <Link
            href={`/${locale}/products/${product.slug}`}
            className="line-clamp-2 text-sm font-semibold leading-5 hover:text-[#0e7468]"
          >
            {product.title[locale]}
          </Link>
          <span className="mt-2 flex min-h-5 items-center gap-1.5" aria-label={`${product.colors.length} ${locale === "ar" ? "ألوان" : "colours"}`}>
            {product.colors.slice(0, 4).map((colour) => (
              <span
                key={colour.code}
                className={`size-3.5 rounded-full border border-black/20 ${colour.inStock ? "" : "opacity-25"}`}
                style={{ backgroundColor: colour.swatch }}
                title={colour.name[locale]}
              />
            ))}
            {product.colors.length > 4 && <span className="text-[10px] text-neutral-600">+{product.colors.length - 4}</span>}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <strong>{formatMoney(product.price, locale)}</strong>
          {product.compareAt && (
            <span className="text-neutral-600 line-through">
              {formatMoney(product.compareAt, locale)}
            </span>
          )}
        </div>
        <p className="mt-2 truncate text-xs text-[var(--text-muted)]">
          {product.sizes.length} {locale === "ar" ? "مقاسات متاحة" : "sizes available"}
        </p>
      </div>
    </article>
  );
}
