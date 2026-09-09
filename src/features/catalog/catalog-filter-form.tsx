import Form from "next/form";
import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { Locale } from "../../lib/i18n";
import type { CatalogFilters } from "./filters";
import type { Product, ProductColour } from "./types";

const content = {
  en: {
    filter: "Filter & sort",
    search: "Search catalog",
    searchPlaceholder: "Search scrub set, lab coat, colour…",
    audience: "Category",
    all: "All scrubs",
    new: "New in",
    women: "Female scrubs",
    men: "Male scrubs",
    kids: "Kids",
    unisex: "Unisex",
    accessories: "Accessories",
    size: "Size",
    color: "Colour",
    price: "Price range",
    anyPrice: "Any price",
    under: "Under 700 EGP",
    middle: "700–900 EGP",
    over: "Over 900 EGP",
    availability: "Availability",
    sale: "Sale items only",
    stock: "In stock only",
    sort: "Sort by",
    featured: "Featured",
    lowHigh: "Price: Low to High",
    highLow: "Price: High to Low",
    name: "Alphabetical",
    apply: "Apply filters",
    reset: "Clear all filters",
  },
  ar: {
    filter: "تصفية وترتيب",
    search: "بحث في التشكيلة",
    searchPlaceholder: "طقم سكراب، بالطو طبي، لون…",
    audience: "الفئة",
    all: "جميع السكراب",
    new: "وصل حديثاً",
    women: "سكراب حريمي",
    men: "سكراب رجالي",
    kids: "أطفال",
    unisex: "للجميع",
    accessories: "إكسسوارات",
    size: "المقاس",
    color: "اللون",
    price: "نطاق السعر",
    anyPrice: "جميع الأسعار",
    under: "أقل من ٧٠٠ ج.م",
    middle: "٧٠٠–٩٠٠ ج.م",
    over: "أكثر من ٩٠٠ ج.م",
    availability: "حالة التوفر",
    sale: "العروض والتخفيضات فقط",
    stock: "المتوفر بالمخزن فقط",
    sort: "الترتيب حسب",
    featured: "المقترحة",
    lowHigh: "السعر: من الأقل للأعلى",
    highLow: "السعر: من الأعلى للأقل",
    name: "الاسم الأبجدي",
    apply: "تطبيق التصفية",
    reset: "إعادة تعيين الفلاتر",
  },
} as const;

const sizeOrder = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

function uniqueSizes(products: Product[]) {
  return [...new Set(products.flatMap((product) => product.sizes))].toSorted(
    (a, b) => {
      const aIndex = sizeOrder.indexOf(a);
      const bIndex = sizeOrder.indexOf(b);
      return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
    },
  );
}

function uniqueColors(products: Product[]) {
  return [
    ...new Map(
      products
        .flatMap((product) => product.colors)
        .map((colour) => [colour.code, colour] as const),
    ).values(),
  ].toSorted((a: ProductColour, b: ProductColour) =>
    a.name.en.localeCompare(b.name.en),
  );
}

export function CatalogFilterForm({
  locale,
  filters,
  products,
}: {
  locale: Locale;
  filters: CatalogFilters;
  products: Product[];
}) {
  const t = content[locale];
  const sizes = uniqueSizes(products);
  const colors = uniqueColors(products);

  const activeCount =
    filters.sizes.length +
    filters.colors.length +
    Number(filters.saleOnly) +
    Number(filters.inStockOnly) +
    Number(Boolean(filters.category || filters.price || filters.query));

  return (
    <details id="catalog-search" className="group py-4">
      <summary className="flex min-h-12 list-none items-center justify-between gap-3 rounded-xs border border-[var(--border-subtle)] bg-white px-5 text-xs font-bold uppercase tracking-[.14em] text-[var(--text-strong)] marker:hidden hover:border-[#0e7468] sm:w-fit">
        <span className="flex items-center gap-2.5">
          <SlidersHorizontal size={16} strokeWidth={1.8} aria-hidden="true" />
          {t.filter}
        </span>
        {activeCount > 0 && (
          <span className="grid size-5 place-items-center rounded-full bg-[#0e7468] text-[10px] font-bold text-white">
            {activeCount}
          </span>
        )}
      </summary>

      <Form
        action={`/${locale}/shop`}
        className="mt-4 space-y-6 rounded-xs border border-[var(--border-subtle)] bg-white p-5 shadow-xs sm:p-7"
      >
        {/* Search input */}
        <label className="block max-w-2xl text-[11px] font-bold uppercase tracking-[.14em] text-[var(--text-muted)]">
          {t.search}
          <span className="mt-2 flex h-12 items-center rounded-xs border border-[var(--border-subtle)] bg-[var(--surface-canvas)] px-4 focus-within:border-[#0e7468] focus-within:bg-white">
            <Search size={17} className="text-[var(--text-muted)]" aria-hidden="true" />
            <input
              name="q"
              type="search"
              defaultValue={filters.query}
              maxLength={80}
              placeholder={t.searchPlaceholder}
              className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm font-normal text-[var(--text-strong)] outline-none placeholder:text-neutral-400"
            />
          </span>
        </label>

        {/* Filter controls grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {/* Category */}
          <label className="text-[11px] font-bold uppercase tracking-[.14em] text-[var(--text-muted)]">
            {t.audience}
            <select
              name="category"
              defaultValue={filters.category ?? ""}
              className="mt-2 h-11 w-full rounded-xs border border-[var(--border-subtle)] bg-white px-3 text-xs font-normal text-[var(--text-strong)] outline-none focus:border-[#0e7468]"
            >
              <option value="">{t.all}</option>
              <option value="new">{t.new}</option>
              <option value="women">{t.women}</option>
              <option value="men">{t.men}</option>
              <option value="unisex">{t.unisex}</option>
            </select>
          </label>

          {/* Sizes */}
          <fieldset>
            <legend className="text-[11px] font-bold uppercase tracking-[.14em] text-[var(--text-muted)]">
              {t.size}
            </legend>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {sizes.map((size) => (
                <label key={size} className="cursor-pointer">
                  <input
                    className="peer sr-only"
                    type="checkbox"
                    name="size"
                    value={size}
                    defaultChecked={filters.sizes.includes(size)}
                  />
                  <span className="grid size-10 place-items-center rounded-xs border border-[var(--border-subtle)] bg-[var(--surface-canvas)] text-xs font-bold text-[var(--text-strong)] peer-checked:border-[#073b36] peer-checked:bg-[#073b36] peer-checked:text-white">
                    {size}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Colors */}
          <fieldset>
            <legend className="text-[11px] font-bold uppercase tracking-[.14em] text-[var(--text-muted)]">
              {t.color}
            </legend>
            <div className="mt-2 max-h-40 space-y-2 overflow-y-auto pe-1">
              {colors.map((colour) => (
                <label
                  key={colour.code}
                  className="flex cursor-pointer items-center gap-2.5 text-xs text-[var(--text-strong)] hover:text-[#0e7468]"
                >
                  <input
                    type="checkbox"
                    name="color"
                    value={colour.code}
                    defaultChecked={filters.colors.includes(colour.code)}
                    className="rounded-xs accent-[#0e7468]"
                  />
                  <span
                    className="size-3.5 rounded-full border border-black/20"
                    style={{ backgroundColor: colour.swatch }}
                  />
                  <span>{colour.name[locale]}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Price Range */}
          <label className="text-[11px] font-bold uppercase tracking-[.14em] text-[var(--text-muted)]">
            {t.price}
            <select
              name="price"
              defaultValue={filters.price ?? ""}
              className="mt-2 h-11 w-full rounded-xs border border-[var(--border-subtle)] bg-white px-3 text-xs font-normal text-[var(--text-strong)] outline-none focus:border-[#0e7468]"
            >
              <option value="">{t.anyPrice}</option>
              <option value="under-700">{t.under}</option>
              <option value="700-900">{t.middle}</option>
              <option value="over-900">{t.over}</option>
            </select>
          </label>

          {/* Sort & Availability */}
          <div className="space-y-4">
            <label className="block text-[11px] font-bold uppercase tracking-[.14em] text-[var(--text-muted)]">
              {t.sort}
              <select
                name="sort"
                defaultValue={filters.sort}
                className="mt-2 h-11 w-full rounded-xs border border-[var(--border-subtle)] bg-white px-3 text-xs font-normal text-[var(--text-strong)] outline-none focus:border-[#0e7468]"
              >
                <option value="featured">{t.featured}</option>
                <option value="price-asc">{t.lowHigh}</option>
                <option value="price-desc">{t.highLow}</option>
                <option value="name">{t.name}</option>
              </select>
            </label>
            <fieldset>
              <legend className="sr-only">{t.availability}</legend>
              <div className="space-y-2 pt-1 text-xs text-[var(--text-strong)]">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="sale"
                    value="1"
                    defaultChecked={filters.saleOnly}
                    className="rounded-xs accent-[#0e7468]"
                  />
                  <span>{t.sale}</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="stock"
                    value="1"
                    defaultChecked={filters.inStockOnly}
                    className="rounded-xs accent-[#0e7468]"
                  />
                  <span>{t.stock}</span>
                </label>
              </div>
            </fieldset>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-4 border-t border-[var(--border-subtle)] pt-5">
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-xs bg-[#073b36] px-8 text-xs font-bold uppercase tracking-[.14em] text-white shadow-xs hover:bg-[#0e7468]"
          >
            {t.apply}
          </button>
          <Link
            href={`/${locale}/shop`}
            className="inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[#a5472f]"
          >
            <X size={15} aria-hidden="true" />
            {t.reset}
          </Link>
        </div>
      </Form>
    </details>
  );
}
