import { describe, expect, it } from "vitest";
import {
  mapSyncCartLine,
  mergeCartLines,
  mergeWishlistIds,
} from "../../src/features/cart/repository";
import type { CartLine } from "../../src/features/cart/types";

describe("cart-sync unit tests", () => {
  const sampleLine1: CartLine = {
    key: "1:burgundy:M",
    productId: "1",
    variantId: "101",
    slug: "classic-scrub-burgundy",
    title: { en: "Classic Scrub - Burgundy", ar: "سكراب كلاسيكي - بورجوندي" },
    image: { src: "/images/scrub-vibe/female-design-2.webp", alt: { en: "Scrub", ar: "سكراب" } },
    price: 850,
    codDeposit: 150,
    colourCode: "burgundy",
    colourName: { en: "Burgundy", ar: "بورجوندي" },
    swatch: "#5a1827",
    size: "M",
    quantity: 2,
    availableStock: 15,
  };

  const sampleLine2: CartLine = {
    key: "2:navy:L",
    productId: "2",
    variantId: "102",
    slug: "classic-scrub-navy",
    title: { en: "Classic Scrub - Navy", ar: "سكراب كلاسيكي - كحلي" },
    image: { src: "/images/scrub-vibe/male-design-1.jpg", alt: { en: "Navy Scrub", ar: "سكراب كحلي" } },
    price: 850,
    codDeposit: 150,
    colourCode: "navy",
    colourName: { en: "Navy", ar: "كحلي" },
    swatch: "#1b2a4a",
    size: "L",
    quantity: 1,
    availableStock: 8,
  };

  it("maps raw database RPC row into typed CartLine with minor currency conversion", () => {
    const raw = {
      product_id: 1,
      variant_id: 101,
      slug: "classic-scrub-burgundy",
      quantity: 3,
      price_minor: 85000,
      cod_deposit_minor: 15000,
      title_en: "Classic Scrub",
      title_ar: "سكراب كلاسيكي",
      colour_code: "burgundy",
      colour_en: "Burgundy",
      colour_ar: "بورجوندي",
      swatch: "#5a1827",
      size: "M",
      image_url: "/images/scrub-vibe/female-design-2.webp",
      available_stock: 20,
    };

    const mapped = mapSyncCartLine(raw);
    expect(mapped.key).toBe("1:burgundy:M");
    expect(mapped.productId).toBe("1");
    expect(mapped.variantId).toBe("101");
    expect(mapped.price).toBe(850);
    expect(mapped.codDeposit).toBe(150);
    expect(mapped.quantity).toBe(3);
    expect(mapped.colourCode).toBe("burgundy");
    expect(mapped.size).toBe("M");
    expect(mapped.availableStock).toBe(20);
  });

  it("merges distinct cart lines without conflicts", () => {
    const current = [sampleLine1];
    const incoming = [sampleLine2];
    const merged = mergeCartLines(current, incoming);

    expect(merged).toHaveLength(2);
    expect(merged.map((l) => l.key)).toEqual(["1:burgundy:M", "2:navy:L"]);
  });

  it("sums quantities on duplicate keys and clamps at maximum 10", () => {
    const duplicateIncoming: CartLine = {
      ...sampleLine1,
      quantity: 9, // 2 + 9 = 11 -> clamped to 10
      price: 890,
    };

    const merged = mergeCartLines([sampleLine1], [duplicateIncoming]);
    expect(merged).toHaveLength(1);
    expect(merged[0].quantity).toBe(10);
    expect(merged[0].price).toBe(890);
  });

  it("merges and deduplicates wishlist product IDs", () => {
    const local = ["1", "2", "3"];
    const server = ["2", "3", "4", "5"];
    const result = mergeWishlistIds(local, server);

    expect(result.sort()).toEqual(["1", "2", "3", "4", "5"]);
  });

  it("filters out empty or whitespace-only wishlist IDs", () => {
    const local = ["1", "", "   ", "2"];
    const server = ["2", " "];
    const result = mergeWishlistIds(local, server);

    expect(result.sort()).toEqual(["1", "2"]);
  });
});
