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
}: {
  product: Product;
  locale: Locale;
}) {
  const { addToCart, toggleWishlist, wishlist } = useShop();
  const wished = wishlist.includes(product.id);
  const discount = discountPercent(product.price, product.compareAt);
  return (
    <article className="group min-w-0">
      <div className="product-art bg-[#ebe9e4]">
        <Link href={`/${locale}/products/${product.slug}`} tabIndex={-1}>
          <Image
            src={product.image.src}
            alt={product.image.alt[locale]}
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className="object-cover transition duration-500 group-hover:scale-[1.025]"
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
          className="absolute end-3 top-3 grid size-9 place-items-center rounded-full bg-white/85"
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart size={17} fill={wished ? "currentColor" : "none"} />
        </button>
        <Button
          onClick={addToCart}
          className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 focus:translate-y-0 focus:opacity-100"
        >
          <Plus size={15} /> {locale === "ar" ? "إضافة سريعة" : "Quick add"}
        </Button>
      </div>
      <div className="pt-4">
        <div className="mb-2 flex items-start justify-between gap-3">
          <Link
            href={`/${locale}/products/${product.slug}`}
            className="text-sm font-medium hover:underline"
          >
            {product.title[locale]}
          </Link>
          <span
            className="mt-1 size-3 shrink-0 rounded-full border border-black/15"
            style={{ backgroundColor: product.color }}
            title={product.colorName[locale]}
          />
        </div>
        <div className="flex gap-2 text-xs">
          <span>{formatMoney(product.price, locale)}</span>
          {product.compareAt && (
            <span className="text-neutral-500 line-through">
              {formatMoney(product.compareAt, locale)}
            </span>
          )}
        </div>
        <div className="mt-3 flex gap-1.5">
          {product.sizes.map((size) => (
            <span
              key={size}
              className="border border-black/15 px-2 py-1 text-[9px]"
            >
              {size}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
