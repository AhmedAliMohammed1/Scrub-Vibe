import { notFound } from "next/navigation";
import Link from "next/link";
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
    all: "Shop all",
    new: "New in",
    women: "Women",
    men: "Men",
    kids: "Kids",
    unisex: "Unisex",
    accessories: "Accessories",
    collection: "NOVA COLLECTION",
    piece: "piece",
    pieces: "pieces",
    empty: "Nothing matched your edit.",
    emptyBody: "Try removing a filter or searching for a different piece.",
    clear: "Clear all filters",
  },
  ar: {
    all: "تسوق الكل",
    new: "وصل حديثاً",
    women: "نساء",
    men: "رجال",
    kids: "أطفال",
    unisex: "للجميع",
    accessories: "إكسسوارات",
    collection: "مجموعة نوفا",
    piece: "قطعة",
    pieces: "قطع",
    empty: "لم نجد قطعاً مطابقة.",
    emptyBody: "جرّب إزالة أحد الفلاتر أو البحث بكلمات مختلفة.",
    clear: "مسح كل الفلاتر",
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
  const filters = parseCatalogFilters(query);
  const allProducts = await catalog.featured();
  const products = filterCatalog(allProducts, filters, locale);
  const t = headings[locale];
  const heading = filters.query
    ? locale === "ar"
      ? `نتائج “${filters.query}”`
      : `Results for “${filters.query}”`
    : t[filters.category ?? "all"];

  return (
    <main className="mx-auto max-w-[1600px] px-5 py-14 md:px-10">
      <p className="eyebrow text-[#a6432b]">{t.collection}</p>
      <div className="mt-3 flex items-end justify-between border-b border-black/15 pb-8">
        <div>
          <h1 className="font-serif text-5xl md:text-7xl">{heading}</h1>
          <p className="mt-4 text-xs text-neutral-500">
            {products.length} {products.length === 1 ? t.piece : t.pieces}
          </p>
        </div>
      </div>
      <CatalogFilterForm
        locale={locale}
        filters={filters}
        products={allProducts}
      />
      {products.length ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-12 py-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} locale={locale} />
          ))}
        </div>
      ) : (
        <section className="py-24 text-center">
          <h2 className="font-serif text-4xl">{t.empty}</h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-neutral-600">
            {t.emptyBody}
          </p>
          {hasCatalogFilters(filters) && (
            <Link
              href={`/${locale}/shop`}
              className="mt-7 inline-block border-b border-black pb-1 text-xs"
            >
              {t.clear}
            </Link>
          )}
        </section>
      )}
    </main>
  );
}
