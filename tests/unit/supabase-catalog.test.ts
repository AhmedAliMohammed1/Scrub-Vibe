import { describe, expect, it } from "vitest";
import {
  mapCatalogProduct,
  type CatalogProductRow,
} from "../../src/features/catalog/map-supabase-product";

const row: CatalogProductRow = {
  id: 42,
  slug: "female-design-2-scrub-set",
  gender: "women",
  base_price_minor: 85000,
  compare_at_price_minor: 100000,
  product_translations: [
    {
      locale: "en",
      title: "Women's Design 2 Scrub Set",
      description: "Made for long shifts.",
    },
    {
      locale: "ar",
      title: "طقم سكراب حريمي تصميم ٢",
      description: "مصمم للشيفتات الطويلة.",
    },
  ],
  product_images: [
    {
      storage_path: "/images/scrub-vibe/female-design-2.webp",
      alt_en: "Women's Design 2 Scrub Set",
      alt_ar: "طقم سكراب حريمي تصميم ٢",
      position: 10,
    },
  ],
  product_options: [
    {
      code: "color",
      position: 10,
      product_option_values: [
        {
          id: 1,
          code: "bone",
          label_en: "Bone",
          label_ar: "عاجي",
          position: 10,
          swatch_hex: "#ede5d5",
        },
        {
          id: 5,
          code: "navy",
          label_en: "Navy",
          label_ar: "كحلي",
          position: 20,
          swatch_hex: "#172c52",
        },
      ],
    },
    {
      code: "size",
      position: 20,
      product_option_values: [
        {
          id: 3,
          code: "m",
          label_en: "M",
          label_ar: "M",
          position: 30,
          swatch_hex: null,
        },
        {
          id: 2,
          code: "s",
          label_en: "S",
          label_ar: "S",
          position: 20,
          swatch_hex: null,
        },
        {
          id: 4,
          code: "l",
          label_en: "L",
          label_ar: "L",
          position: 40,
          swatch_hex: null,
        },
      ],
    },
  ],
  product_variants: [
    {
      id: 10,
      is_active: true,
      inventory: { on_hand: 9, reserved: 0, low_stock_threshold: 3 },
      product_variant_values: [{ option_value_id: 1 }, { option_value_id: 2 }],
    },
    {
      id: 11,
      is_active: true,
      inventory: { on_hand: 9, reserved: 0, low_stock_threshold: 3 },
      product_variant_values: [{ option_value_id: 1 }, { option_value_id: 3 }],
    },
    {
      id: 13,
      is_active: true,
      inventory: { on_hand: 4, reserved: 0, low_stock_threshold: 3 },
      product_variant_values: [{ option_value_id: 5 }, { option_value_id: 3 }],
    },
    {
      id: 12,
      is_active: false,
      inventory: { on_hand: 9, reserved: 0, low_stock_threshold: 3 },
      product_variant_values: [{ option_value_id: 1 }, { option_value_id: 4 }],
    },
  ],
};

describe("Supabase catalogue mapping", () => {
  it("maps normalized localized rows to the storefront product", () => {
    expect(mapCatalogProduct(row)).toEqual({
      id: "42",
      slug: "female-design-2-scrub-set",
      title: {
        en: "Women's Design 2 Scrub Set",
        ar: "طقم سكراب حريمي تصميم ٢",
      },
      description: {
        en: "Made for long shifts.",
        ar: "مصمم للشيفتات الطويلة.",
      },
      category: "women",
      price: 85000,
      compareAt: 100000,
      color: "#ede5d5",
      colorCode: "bone",
      colorName: { en: "Bone", ar: "عاجي" },
      colors: [
        {
          id: "1",
          code: "bone",
          swatch: "#ede5d5",
          name: { en: "Bone", ar: "عاجي" },
          sizes: ["S", "M"],
          variants: { S: "10", M: "11" },
          inStock: true,
        },
        {
          id: "5",
          code: "navy",
          swatch: "#172c52",
          name: { en: "Navy", ar: "كحلي" },
          sizes: ["M"],
          variants: { M: "13" },
          inStock: true,
        },
      ],
      sizes: ["S", "M"],
      inStock: true,
      badge: "sale",
      art: "clay",
      image: {
        src: "/images/scrub-vibe/female-design-2.webp",
        alt: {
          en: "Women's Design 2 Scrub Set",
          ar: "طقم سكراب حريمي تصميم ٢",
        },
      },
    });
  });

  it("falls back safely when an Arabic translation or options are absent", () => {
    expect(
      mapCatalogProduct({
        ...row,
        compare_at_price_minor: null,
        product_translations: [row.product_translations[0]],
        product_images: [],
        product_options: [],
        product_variants: [],
      }),
    ).toMatchObject({
      title: {
        en: "Women's Design 2 Scrub Set",
        ar: "Women's Design 2 Scrub Set",
      },
      description: { en: "Made for long shifts.", ar: "Made for long shifts." },
      color: "#c8b298",
      colorCode: "natural",
      colorName: { en: "Natural", ar: "طبيعي" },
      colors: [
        {
          id: "natural",
          code: "natural",
          swatch: "#c8b298",
          name: { en: "Natural", ar: "طبيعي" },
          sizes: [],
          variants: {},
          inStock: false,
        },
      ],
      sizes: [],
      inStock: false,
      badge: "new",
      art: "sand",
      image: {
        src: "/images/scrub-vibe/female-collection.webp",
        alt: {
          en: "Women's Design 2 Scrub Set",
          ar: "Women's Design 2 Scrub Set",
        },
      },
    });
  });
});
