import { describe, expect, it } from "vitest";
import { DevelopmentCatalog } from "../../src/features/catalog/development-catalog";

describe("catalog contract", () => {
  const catalog = new DevelopmentCatalog();

  it("returns variant-ready products", async () => {
    const products = await catalog.featured();
    expect(products.length).toBeGreaterThan(0);
    expect(products.every((p) => p.sizes.length > 0 && p.price > 0)).toBe(true);
  });
  it("finds by stable slug", async () => {
    expect((await catalog.bySlug("female-design-2-scrub-set"))?.id).toBe(
      "sv-f2",
    );
  });
});
