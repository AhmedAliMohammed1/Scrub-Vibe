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
        q: "  linen  ",
        category: "women",
        size: ["m", "M", "../../bad"],
        color: ["olive", "#invalid"],
        price: "under-1300",
        sale: "1",
        stock: "1",
        sort: "price-desc",
      }),
    ).toEqual({
      query: "linen",
      category: "women",
      sizes: ["M"],
      colors: ["olive"],
      price: "under-1300",
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
    ).toEqual(["p-003"]);
  });

  it("combines audience, size, sale, and price filters", () => {
    const filters = parseCatalogFilters({
      category: "women",
      size: "M",
      sale: "1",
      price: "under-1300",
    });
    expect(
      filterCatalog(demoProducts, filters, "en").map((item) => item.id),
    ).toEqual(["p-002"]);
  });

  it("sorts without mutating the repository result", () => {
    const products = [...demoProducts];
    const result = filterCatalog(
      products,
      parseCatalogFilters({ sort: "price-desc" }),
      "en",
    );

    expect(result.map((item) => item.price)).toEqual([
      159900, 149900, 129900, 109900,
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
