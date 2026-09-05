import { describe, expect, it } from "vitest";
import {
  mapCatalogProduct,
  type CatalogProductRow,
} from "../../src/features/catalog/map-supabase-product";

const row: CatalogProductRow = {
  id: 42,
  slug: "soft-structure-vest",
  gender: "women",
  base_price_minor: 109900,
  compare_at_price_minor: 139900,
  product_translations: [
    { locale: "en", title: "Soft Structure Vest" },
    { locale: "ar", title: "صديري بقصّة ناعمة" },
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
      slug: "soft-structure-vest",
      title: { en: "Soft Structure Vest", ar: "صديري بقصّة ناعمة" },
      category: "women",
      price: 109900,
      compareAt: 139900,
      color: "#ede5d5",
      colorName: { en: "Bone", ar: "عاجي" },
      sizes: ["S", "M"],
      badge: "sale",
      art: "clay",
    });
  });

  it("falls back safely when an Arabic translation or options are absent", () => {
    expect(
      mapCatalogProduct({
        ...row,
        compare_at_price_minor: null,
        product_translations: [row.product_translations[0]],
        product_options: [],
        product_variants: [],
      }),
    ).toMatchObject({
      title: { en: "Soft Structure Vest", ar: "Soft Structure Vest" },
      color: "#c8b298",
      colorName: { en: "Natural", ar: "طبيعي" },
      sizes: [],
      badge: "new",
      art: "sand",
    });
  });
});
