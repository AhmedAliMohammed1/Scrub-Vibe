"use client";

import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, Heart, ShoppingBag } from "lucide-react";
import type { Product } from "@/features/catalog/types";
import type { Locale } from "@/lib/i18n";
import { PaginationNav } from "@/components/ui/pagination-nav";
import { paginateItems } from "@/lib/pagination";
import { useShop } from "./cart-provider";
import { ProductCard } from "./product-card";

const PRODUCTS_PER_PAGE = 12;

export function WishlistView({
  products,
  locale,
  initialPage,
}: {
  products: Product[];
  locale: Locale;
  initialPage: number;
}) {
  const { wishlist } = useShop();
  const ar = locale === "ar";
  const savedProducts = products.filter((p) => wishlist.includes(p.id));
  const pagedProducts = paginateItems(
    savedProducts,
    initialPage,
    PRODUCTS_PER_PAGE,
  );

  return (
    <main className="mx-auto min-h-[70vh] max-w-[1440px] px-5 py-10 sm:px-6 md:px-10 md:py-16">
      <p className="eyebrow text-[#0e7468]">
        {ar ? "قطعك المحفوظة" : "SCRUB VIBE SAVED"}
      </p>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-6xl text-[var(--text-strong)]">
            {ar ? "قائمة الأمنيات" : "Wishlist"}
          </h1>
          <p className="mt-2 text-xs font-semibold text-[var(--text-muted)]">
            {savedProducts.length
              ? ar
                ? `${savedProducts.length} قطع محفوظة في قائمتك المفضلة`
                : `${savedProducts.length} saved piece${savedProducts.length === 1 ? "" : "s"} in your list`
              : ar
                ? "لا توجد قطع محفوظة حالياً"
                : "No saved pieces yet"}
          </p>
        </div>

        {savedProducts.length > 0 && (
          <Link
            href={`/${locale}/shop` as Route}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.14em] text-[#073b36] transition hover:text-[#0e7468]"
          >
            {ar ? "متابعة التسوق" : "Continue shopping"}
            <ArrowRight
              size={14}
              className="rtl:rotate-180"
              aria-hidden="true"
            />
          </Link>
        )}
      </div>

      <div className="mt-8">
        {savedProducts.length > 0 ? (
          <>
            <PaginationNav
              locale={locale}
              pathname={`/${locale}/wishlist`}
              currentPage={pagedProducts.pagination.currentPage}
              totalItems={savedProducts.length}
              pageSize={PRODUCTS_PER_PAGE}
              anchor="wishlist-grid"
              itemLabel={{ en: "saved items", ar: "قطعة محفوظة" }}
            />
            <div
              id="wishlist-grid"
              className="mt-8 grid scroll-mt-6 grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-8"
            >
              {pagedProducts.items.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  locale={locale}
                />
              ))}
            </div>
            <PaginationNav
              locale={locale}
              pathname={`/${locale}/wishlist`}
              currentPage={pagedProducts.pagination.currentPage}
              totalItems={savedProducts.length}
              pageSize={PRODUCTS_PER_PAGE}
              anchor="wishlist-grid"
              itemLabel={{ en: "saved items", ar: "قطعة محفوظة" }}
              hideWhenSinglePage
              className="mt-8"
            />
          </>
        ) : (
          <div className="my-12 rounded-xs border border-[var(--border-subtle)] bg-white px-6 py-20 text-center shadow-xs">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#f0f5f3] text-[#073b36]">
              <Heart size={28} strokeWidth={1.6} aria-hidden="true" />
            </div>
            <h2 className="mt-6 font-serif text-2xl md:text-3xl text-[var(--text-strong)]">
              {ar ? "قائمتك المفضلة فارغة" : "Your wishlist is empty"}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--text-muted)]">
              {ar
                ? "احفظ القطع المفضلة لديك بالضغط على أيقونة القلب على أي منتج لتتمكن من الرجوع إليها وإتمام طلبك في أي وقت."
                : "Save your favorite scrubs, lab coats, and accessories by tapping the heart icon on any product to easily return and purchase them later."}
            </p>
            <Link
              href={`/${locale}/shop` as Route}
              className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xs bg-[#073b36] px-8 text-xs font-bold uppercase tracking-[.14em] text-white shadow-xs hover:bg-[#0e7468]"
            >
              <ShoppingBag size={16} aria-hidden="true" />
              {ar ? "استكشف التشكيلة الطبية" : "Explore collection"}
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
