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
    image: {
      src: "/images/scrub-vibe/female-design-2.webp",
      alt: { en: "Scrub", ar: "سكراب" },
    },
    price: 85000,
    codDeposit: 15000,
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
    image: {
      src: "/images/scrub-vibe/male-design-1.jpg",
      alt: { en: "Navy Scrub", ar: "سكراب كحلي" },
    },
    price: 85000,
    codDeposit: 15000,
    colourCode: "navy",
    colourName: { en: "Navy", ar: "كحلي" },
    swatch: "#1b2a4a",
    size: "L",
    quantity: 1,
    availableStock: 8,
  };

  it("keeps database RPC money values in integer minor units", () => {
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
    expect(mapped.price).toBe(85000);
    expect(mapped.codDeposit).toBe(15000);
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

  it("uses the authoritative synced quantity on duplicate keys", () => {
    const duplicateIncoming: CartLine = {
      ...sampleLine1,
      quantity: 9,
      price: 89000,
    };

    const merged = mergeCartLines([sampleLine1], [duplicateIncoming]);
    expect(merged).toHaveLength(1);
    expect(merged[0].quantity).toBe(9);
    expect(merged[0].price).toBe(89000);
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

  it("calculates idempotent cart quantities without inflation on repeated syncs", () => {
    // Simulates the DB idempotent logic: least(greatest(greatest(existing, incoming), 1), 10)
    const computeSyncQuantity = (existing: number, incoming: number) =>
      Math.min(10, Math.max(1, Math.max(existing, incoming)));

    // Initial state: 2 items
    let quantity = 2;

    // Repeated sync events (e.g. tab switches, window focus) with incoming quantity 2
    for (let i = 0; i < 10; i++) {
      quantity = computeSyncQuantity(quantity, 2);
      expect(quantity).toBe(2);
    }

    // Subtotal remains constant across 10 tab switches
    const price = 85000;
    const subtotal = quantity * price;
    expect(subtotal).toBe(170000);
  });

  it("does not inflate quantity when the same synced line is reconciled repeatedly", () => {
    let lines = [sampleLine1];

    for (let i = 0; i < 10; i++) {
      lines = mergeCartLines(lines, [sampleLine1]);
      expect(lines[0].quantity).toBe(2);
    }
  });
});
