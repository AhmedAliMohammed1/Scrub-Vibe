"use client";

import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import type { Product } from "@/features/catalog/types";
import type { Locale } from "@/lib/i18n";
import { useShop } from "./cart-provider";
import { ProductCard } from "./product-card";

export function WishlistView({
  products,
  locale,
}: {
  products: Product[];
  locale: Locale;
}) {
  const { wishlist } = useShop();
  const ar = locale === "ar";
  const savedProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <main className="mx-auto min-h-[70vh] max-w-[1440px] px-5 py-16 md:px-10 md:py-24">
      <p className="eyebrow text-[#0e7468]">
        {ar ? "قطعك المحفوظة" : "SCRUB VIBE SAVED"}
      </p>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-5xl md:text-7xl">
            {ar ? "قائمة الأمنيات" : "Wishlist"}
          </h1>
          <p className="mt-3 text-sm text-neutral-600">
            {savedProducts.length
              ? ar
                ? `${savedProducts.length} قطع محفوظة في قائمتك`
                : `${savedProducts.length} saved piece${savedProducts.length === 1 ? "" : "s"} in your list`
              : ar
                ? "لا توجد قطع محفوظة حالياً"
                : "No saved pieces yet"}
          </p>
        </div>
        {savedProducts.length > 0 && (
          <Link
            href={`/${locale}/shop`}
            className="text-xs font-bold uppercase tracking-[.14em] text-[#073b36] hover:underline"
          >
            {ar ? "متابعة التسوق" : "Continue shopping"}
          </Link>
        )}
      </div>

      <div className="mt-10 border-t border-black/10 pt-10">
        {savedProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 md:gap-x-6">
            {savedProducts.map((product) => (
              <ProductCard key={product.id} product={product} locale={locale} />
            ))}
          </div>
        ) : (
          <div className="mx-auto max-w-md py-16 text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#f2ede4] text-neutral-600">
              <Heart size={28} strokeWidth={1.5} />
            </div>
            <h2 className="mt-6 font-serif text-3xl">
              {ar ? "قائمتك فارغة" : "Your wishlist is empty"}
            </h2>
            <p className="mt-3 text-xs leading-relaxed text-neutral-600">
              {ar
                ? "احفظ القطع المفضلة لديك بالضغط على أيقونة القلب في صفحة المنتجات للعودة إليها بسهولة لاحقاً."
                : "Save your favorite scrubs and lab coats by tapping the heart icon on any product to easily find them later."}
            </p>
            <Link
              href={`/${locale}/shop`}
              className="mt-8 inline-flex items-center gap-2 bg-[#073b36] px-8 py-4 text-xs font-bold uppercase tracking-[.14em] text-white hover:bg-[#0e7468]"
            >
              <ShoppingBag size={15} />
              {ar ? "استكشف التشكيلة" : "Explore collection"}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
