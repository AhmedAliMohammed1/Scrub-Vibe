import Form from "next/form";
import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import type { Locale } from "../../lib/i18n";
import type { CatalogFilters } from "./filters";
import type { Product, ProductColour } from "./types";

const content = {
  en: {
    filter: "Filter & sort",
    search: "Search the collection",
    searchPlaceholder: "Scrub set, lab coat, navy…",
    audience: "Audience",
    all: "All",
    new: "New in",
    women: "Women",
    men: "Men",
    kids: "Kids",
    unisex: "Unisex",
    accessories: "Accessories",
    size: "Size",
    color: "Colour",
    price: "Price",
    anyPrice: "Any price",
    under: "Under 700 EGP",
    middle: "700–900 EGP",
    over: "Over 900 EGP",
    availability: "Availability",
    sale: "Sale only",
    stock: "In stock only",
    sort: "Sort by",
    featured: "Featured",
    lowHigh: "Price: low to high",
    highLow: "Price: high to low",
    name: "Name",
    apply: "Apply filters",
    reset: "Clear all",
  },
  ar: {
    filter: "تصفية وترتيب",
    search: "ابحث في المجموعة",
    searchPlaceholder: "طقم سكراب، بالطو، كحلي…",
    audience: "الفئة",
    all: "الكل",
    new: "وصل حديثاً",
    women: "نساء",
    men: "رجال",
    kids: "أطفال",
    unisex: "للجميع",
    accessories: "إكسسوارات",
    size: "المقاس",
    color: "اللون",
    price: "السعر",
    anyPrice: "كل الأسعار",
    under: "أقل من ٧٠٠ جنيه",
    middle: "٧٠٠–٩٠٠ جنيه",
    over: "أكثر من ٩٠٠ جنيه",
    availability: "التوفر",
    sale: "التخفيضات فقط",
    stock: "المتوفر فقط",
    sort: "الترتيب",
    featured: "المميز",
    lowHigh: "السعر: من الأقل للأعلى",
    highLow: "السعر: من الأعلى للأقل",
    name: "الاسم",
    apply: "تطبيق الفلاتر",
    reset: "مسح الكل",
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

  return (
    <details id="catalog-search" className="group border-b border-black/15 py-5">
      <summary className="flex min-h-12 list-none items-center justify-between gap-3 border border-black/15 bg-white px-4 text-[11px] font-bold uppercase tracking-[.14em] marker:hidden hover:border-[#0e7468] sm:w-fit">
        <span className="flex items-center gap-2">
        <SlidersHorizontal size={15} />
        {t.filter}
        </span>
        {(filters.sizes.length + filters.colors.length + Number(filters.saleOnly) + Number(filters.inStockOnly) + Number(Boolean(filters.category || filters.price || filters.query))) > 0 && (
          <span className="grid size-6 place-items-center rounded-full bg-[#0e7468] text-[10px] text-white">
            {filters.sizes.length + filters.colors.length + Number(filters.saleOnly) + Number(filters.inStockOnly) + Number(Boolean(filters.category || filters.price || filters.query))}
          </span>
        )}
      </summary>
      <Form action={`/${locale}/shop`} className="mt-5 space-y-7 border border-black/10 bg-white p-4 sm:p-6">
        <label className="block max-w-2xl text-[10px] font-bold uppercase tracking-[.14em]">
          {t.search}
          <span className="mt-2 flex h-12 items-center border border-black/20 bg-white/30 px-4 focus-within:border-black">
            <Search size={16} aria-hidden="true" />
            <input
              name="q"
              type="search"
              defaultValue={filters.query}
              maxLength={80}
              placeholder={t.searchPlaceholder}
              className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm font-normal normal-case outline-none placeholder:text-neutral-400"
            />
          </span>
        </label>

        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-[10px] font-bold uppercase tracking-[.14em]">
            {t.audience}
            <select
              name="category"
              defaultValue={filters.category ?? ""}
              className="mt-2 h-11 w-full border border-black/20 bg-transparent px-3 text-xs font-normal normal-case"
            >
              <option value="">{t.all}</option>
              <option value="new">{t.new}</option>
              <option value="women">{t.women}</option>
              <option value="men">{t.men}</option>
              <option value="unisex">{t.unisex}</option>
            </select>
          </label>

          <fieldset>
            <legend className="text-[10px] font-bold uppercase tracking-[.14em]">
              {t.size}
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {sizes.map((size) => (
                <label key={size} className="cursor-pointer">
                  <input
                    className="peer sr-only"
                    type="checkbox"
                    name="size"
                    value={size}
                    defaultChecked={filters.sizes.includes(size)}
                  />
                  <span className="grid min-h-11 min-w-11 place-items-center border border-black/20 px-2 py-2 text-[10px] peer-checked:border-[#073b36] peer-checked:bg-[#073b36] peer-checked:text-white">
                    {size}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-[10px] font-bold uppercase tracking-[.14em]">
              {t.color}
            </legend>
            <div className="mt-3 space-y-2">
              {colors.map((colour) => (
                <label
                  key={colour.code}
                  className="flex cursor-pointer items-center gap-2 text-xs"
                >
                  <input
                    type="checkbox"
                    name="color"
                    value={colour.code}
                    defaultChecked={filters.colors.includes(colour.code)}
                  />
                  <span
                    className="size-3 rounded-full border border-black/15"
                    style={{ backgroundColor: colour.swatch }}
                  />
                  {colour.name[locale]}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="text-[10px] font-bold uppercase tracking-[.14em]">
            {t.price}
            <select
              name="price"
              defaultValue={filters.price ?? ""}
              className="mt-2 h-11 w-full border border-black/20 bg-transparent px-3 text-xs font-normal normal-case"
            >
              <option value="">{t.anyPrice}</option>
              <option value="under-700">{t.under}</option>
              <option value="700-900">{t.middle}</option>
              <option value="over-900">{t.over}</option>
            </select>
          </label>

          <div className="space-y-4">
            <label className="block text-[10px] font-bold uppercase tracking-[.14em]">
              {t.sort}
              <select
                name="sort"
                defaultValue={filters.sort}
                className="mt-2 h-11 w-full border border-black/20 bg-transparent px-3 text-xs font-normal normal-case"
              >
                <option value="featured">{t.featured}</option>
                <option value="price-asc">{t.lowHigh}</option>
                <option value="price-desc">{t.highLow}</option>
                <option value="name">{t.name}</option>
              </select>
            </label>
            <fieldset>
              <legend className="sr-only">{t.availability}</legend>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  name="sale"
                  value="1"
                  defaultChecked={filters.saleOnly}
                />
                {t.sale}
              </label>
              <label className="mt-2 flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  name="stock"
                  value="1"
                  defaultChecked={filters.inStockOnly}
                />
                {t.stock}
              </label>
            </fieldset>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button className="h-11 bg-neutral-950 px-7 text-[10px] font-bold uppercase tracking-[.14em] text-white">
            {t.apply}
          </button>
          <Link
            href={`/${locale}/shop`}
            className="text-xs underline underline-offset-4"
          >
            {t.reset}
          </Link>
        </div>
      </Form>
    </details>
  );
}
