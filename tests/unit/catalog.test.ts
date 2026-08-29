import { describe, expect, it } from "vitest";
import { catalog } from "../../src/lib/catalog";
describe("catalog contract", () => {
  it("returns variant-ready products", async () => {
    const products = await catalog.featured();
    expect(products.length).toBeGreaterThan(0);
    expect(products.every((p) => p.sizes.length > 0 && p.price > 0)).toBe(true);
  });
  it("finds by stable slug", async () => {
    expect((await catalog.bySlug("linen-ease-shirt"))?.id).toBe("p-001");
  });
});
