import { describe, expect, it } from "vitest";
import { demoProducts } from "../../src/features/catalog/demo-catalog";
import {
  filterCatalog,
  hasCatalogFilters,
  parseCatalogFilters,
} from "../../src/features/catalog/filters";

describe("catalogue URL filters", () => {
  it("normalizes supported values and rejects unknown input", () => {
    expect(
      parseCatalogFilters({
        q: "  scrub  ",
        category: "women",
        size: ["m", "M", "../../bad"],
        color: ["olive", "#invalid"],
        price: "700-900",
        sale: "1",
        stock: "1",
        sort: "price-desc",
      }),
    ).toEqual({
      query: "scrub",
      category: "women",
      sizes: ["M"],
      colors: ["olive"],
      price: "700-900",
      saleOnly: true,
      inStockOnly: true,
      sort: "price-desc",
    });

    expect(
      parseCatalogFilters({ category: "unknown", sort: "random" }),
    ).toMatchObject({ category: undefined, sort: "featured" });
  });

  it("searches localized product data", () => {
    const filters = parseCatalogFilters({ q: "زيتوني" });
    expect(
      filterCatalog(demoProducts, filters, "ar").map((item) => item.id),
    ).toEqual([
      "sv-f2",
      "sv-f9",
      "sv-f4",
      "sv-f7",
      "sv-f6",
      "sv-m1",
      "sv-m2",
      "sv-m5",
    ]);
  });

  it("combines audience, size, sale, and price filters", () => {
    const filters = parseCatalogFilters({
      category: "women",
      size: "M",
      sale: "1",
      price: "700-900",
    });
    expect(
      filterCatalog(demoProducts, filters, "en").map((item) => item.id),
    ).toEqual(["sv-f2", "sv-f9", "sv-f4", "sv-f7", "sv-f6"]);
  });

  it("sorts without mutating the repository result", () => {
    const products = [...demoProducts];
    const result = filterCatalog(
      products,
      parseCatalogFilters({ sort: "price-desc" }),
      "en",
    );

    expect(result.map((item) => item.price)).toEqual([
      85000, 85000, 85000, 85000, 85000, 85000, 85000, 85000, 55000,
    ]);
    expect(products.map((item) => item.id)).toEqual(
      demoProducts.map((item) => item.id),
    );
  });

  it("detects whether the collection has a meaningful filter", () => {
    expect(hasCatalogFilters(parseCatalogFilters({}))).toBe(false);
    expect(hasCatalogFilters(parseCatalogFilters({ stock: "1" }))).toBe(true);
  });
});
