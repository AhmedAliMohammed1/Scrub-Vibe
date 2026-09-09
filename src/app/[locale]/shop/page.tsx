import { notFound } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import { Sparkles } from "lucide-react";
import { ProductCard } from "@/components/store/product-card";
import { CatalogFilterForm } from "@/features/catalog/catalog-filter-form";
import {
  filterCatalog,
  hasCatalogFilters,
  parseCatalogFilters,
  type CatalogSearchParams,
} from "@/features/catalog/filters";
import { catalog } from "@/lib/catalog";
import { isLocale } from "@/lib/i18n";

const headings = {
  en: {
    all: "All scrubs & lab coats",
    new: "New in",
    women: "Female scrubs",
    men: "Male scrubs",
    kids: "Kids",
    unisex: "Unisex",
    accessories: "Accessories",
    collection: "SCRUB VIBE COLLECTION",
    piece: "item",
    pieces: "items",
    empty: "No scrubs match your selection",
    emptyBody:
      "Try resetting your filters, expanding your price range, or searching for a different clinical term.",
    clear: "Clear all filters",
    categories: {
      all: "All",
      new: "New in",
      women: "Female scrubs",
      men: "Male scrubs",
      labCoat: "Lab coats",
      sale: "Sale",
    },
  },
  ar: {
    all: "جميع السكراب والأردية الطبية",
    new: "وصل حديثاً",
    women: "سكراب حريمي",
    men: "سكراب رجالي",
    kids: "أطفال",
    unisex: "للجميع",
    accessories: "إكسسوارات",
    collection: "تشكيلة سكراب فايب",
    piece: "قطعة",
    pieces: "قطع",
    empty: "لم نجد قطعاً مطابقة لاختيارك",
    emptyBody:
      "جرّب إزالة أحد الفلاتر أو توسيع نطاق السعر أو البحث بكلمات مختلفة.",
    clear: "مسح جميع الفلاتر",
    categories: {
      all: "الكل",
      new: "وصل حديثاً",
      women: "سكراب حريمي",
      men: "سكراب رجالي",
      labCoat: "بالطو طبي",
      sale: "العروض",
    },
  },
} as const;

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<CatalogSearchParams>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const ar = locale === "ar";
  const filters = parseCatalogFilters(query);
  const allProducts = await catalog.featured();
  const products = filterCatalog(allProducts, filters, locale);
  const t = headings[locale];

  const heading = filters.query
    ? ar
      ? `نتائج البحث عن “${filters.query}”`
      : `Results for “${filters.query}”`
    : t[filters.category ?? "all"];

  // Quick navigation pills
  const activeCategory = filters.category;
  const isSale = filters.saleOnly;
  const isLabCoat = filters.query?.toLowerCase().includes("lab coat") || filters.query?.toLowerCase().includes("بالطو");

  const categoryPills = [
    { label: t.categories.all, href: `/${locale}/shop`, active: !activeCategory && !isSale && !isLabCoat && !filters.query },
    { label: t.categories.women, href: `/${locale}/shop?category=women`, active: activeCategory === "women" },
    { label: t.categories.men, href: `/${locale}/shop?category=men`, active: activeCategory === "men" },
    { label: t.categories.new, href: `/${locale}/shop?category=new`, active: activeCategory === "new" },
    { label: t.categories.labCoat, href: `/${locale}/shop?q=lab+coat`, active: isLabCoat },
    { label: t.categories.sale, href: `/${locale}/shop?sale=1`, active: Boolean(isSale) },
  ];

  return (
    <main className="mx-auto max-w-[1440px] px-5 py-10 sm:px-6 md:px-10 md:py-16">
      {/* Header breadcrumb & title */}
      <div>
        <p className="eyebrow text-[#0e7468]">{t.collection}</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4 pb-4">
          <div>
            <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl text-[var(--text-strong)]">
              {heading}
            </h1>
            <p className="mt-3 text-xs font-semibold text-[var(--text-muted)]">
              {products.length} {products.length === 1 ? t.piece : t.pieces}{" "}
              {ar ? "متوفرة" : "available"}
            </p>
          </div>
        </div>
      </div>

      {/* Category Quick Pills */}
      <div className="mt-4 flex flex-wrap gap-2 overflow-x-auto pb-2">
        {categoryPills.map((pill) => (
          <Link
            key={pill.label}
            href={pill.href as Route}
            className={`inline-flex min-h-10 items-center justify-center rounded-xs px-4 text-xs font-bold uppercase tracking-[.12em] transition ${
              pill.active
                ? "bg-[#073b36] text-white shadow-xs"
                : "border border-[var(--border-subtle)] bg-white text-[var(--text-strong)] hover:border-[#0e7468] hover:text-[#0e7468]"
            }`}
          >
            {pill.label}
          </Link>
        ))}
      </div>

      {/* Interactive Filter Drawer */}
      <CatalogFilterForm
        locale={locale}
        filters={filters}
        products={allProducts}
      />

      {/* Product Catalog Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-12 py-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4 lg:gap-8">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              locale={locale}
              priority={index < 4}
            />
          ))}
        </div>
      ) : (
        /* Empty Results State */
        <section className="my-12 rounded-xs border border-[var(--border-subtle)] bg-white px-6 py-20 text-center shadow-xs">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#f0f5f3] text-[#073b36]">
            <Sparkles size={28} strokeWidth={1.6} aria-hidden="true" />
          </div>
          <h2 className="mt-6 font-serif text-2xl md:text-3xl text-[var(--text-strong)]">
            {t.empty}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--text-muted)]">
            {t.emptyBody}
          </p>
          {hasCatalogFilters(filters) && (
            <Link
              href={`/${locale}/shop`}
              className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xs bg-[#073b36] px-8 text-xs font-bold uppercase tracking-[.14em] text-white shadow-xs hover:bg-[#0e7468]"
            >
              {t.clear}
            </Link>
          )}
        </section>
      )}
    </main>
  );
}
