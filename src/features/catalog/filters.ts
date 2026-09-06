import type { Locale } from "../../lib/i18n";
import type { Product } from "./types";

export type CatalogCategory =
  | "new"
  | "women"
  | "men"
  | "kids"
  | "unisex"
  | "accessories";
export type CatalogPrice = "under-700" | "700-900" | "over-900";
export type CatalogSort = "featured" | "price-asc" | "price-desc" | "name";

export type CatalogFilters = {
  query: string;
  category?: CatalogCategory;
  sizes: string[];
  colors: string[];
  price?: CatalogPrice;
  saleOnly: boolean;
  inStockOnly: boolean;
  sort: CatalogSort;
};

export type CatalogSearchParams = Record<string, string | string[] | undefined>;

const categories = new Set<CatalogCategory>([
  "new",
  "women",
  "men",
  "kids",
  "unisex",
  "accessories",
]);
const prices = new Set<CatalogPrice>(["under-700", "700-900", "over-900"]);
const sorts = new Set<CatalogSort>([
  "featured",
  "price-asc",
  "price-desc",
  "name",
]);

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function list(value: string | string[] | undefined, pattern: RegExp) {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return [
    ...new Set(
      values.map((item) => item.trim()).filter((item) => pattern.test(item)),
    ),
  ];
}

export function parseCatalogFilters(
  searchParams: CatalogSearchParams,
): CatalogFilters {
  const query = (first(searchParams.q) ?? "").trim().slice(0, 80);
  const categoryValue = first(searchParams.category);
  const priceValue = first(searchParams.price);
  const sortValue = first(searchParams.sort);

  return {
    query,
    category:
      categoryValue && categories.has(categoryValue as CatalogCategory)
        ? (categoryValue as CatalogCategory)
        : undefined,
    sizes: [
      ...new Set(
        list(searchParams.size, /^[A-Za-z0-9]{1,8}$/).map((size) =>
          size.toUpperCase(),
        ),
      ),
    ],
    colors: list(searchParams.color, /^[a-z0-9-]{1,40}$/),
    price:
      priceValue && prices.has(priceValue as CatalogPrice)
        ? (priceValue as CatalogPrice)
        : undefined,
    saleOnly: first(searchParams.sale) === "1",
    inStockOnly: first(searchParams.stock) === "1",
    sort: sorts.has(sortValue as CatalogSort)
      ? (sortValue as CatalogSort)
      : "featured",
  };
}

function matchesCategory(product: Product, category?: CatalogCategory) {
  if (!category) return true;
  if (category === "new") return product.badge === "new";
  if (category === "kids")
    return product.category === "boys" || product.category === "girls";
  if (category === "accessories") return product.category === "accessories";
  return product.category === category;
}

function matchesPrice(price: number, band?: CatalogPrice) {
  if (!band) return true;
  if (band === "under-700") return price < 70000;
  if (band === "700-900") return price >= 70000 && price <= 90000;
  return price > 90000;
}

export function filterCatalog(
  products: Product[],
  filters: CatalogFilters,
  locale: Locale,
) {
  const query = filters.query.toLocaleLowerCase(locale);
  const filtered = products.filter((product) => {
    const searchable = [
      product.title[locale],
      product.slug,
      product.colorName[locale],
      product.category,
    ]
      .join(" ")
      .toLocaleLowerCase(locale);

    return (
      (!query || searchable.includes(query)) &&
      matchesCategory(product, filters.category) &&
      (!filters.sizes.length ||
        filters.sizes.some((size) => product.sizes.includes(size))) &&
      (!filters.colors.length || filters.colors.includes(product.colorCode)) &&
      matchesPrice(product.price, filters.price) &&
      (!filters.saleOnly || Boolean(product.compareAt)) &&
      (!filters.inStockOnly || product.inStock)
    );
  });

  return filtered.toSorted((a, b) => {
    if (filters.sort === "price-asc") return a.price - b.price;
    if (filters.sort === "price-desc") return b.price - a.price;
    if (filters.sort === "name")
      return a.title[locale].localeCompare(b.title[locale], locale);
    return 0;
  });
}

export function hasCatalogFilters(filters: CatalogFilters) {
  return Boolean(
    filters.query ||
      filters.category ||
      filters.sizes.length ||
      filters.colors.length ||
      filters.price ||
      filters.saleOnly ||
      filters.inStockOnly ||
      filters.sort !== "featured",
  );
}
