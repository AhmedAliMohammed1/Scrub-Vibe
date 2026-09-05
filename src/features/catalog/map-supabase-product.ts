import type { Database } from "@/types/database";
import type { Product } from "./types";

type ProductTranslation = Pick<
  Database["public"]["Tables"]["product_translations"]["Row"],
  "locale" | "title"
>;

type OptionValue = Pick<
  Database["public"]["Tables"]["product_option_values"]["Row"],
  "id" | "code" | "label_en" | "label_ar" | "position" | "swatch_hex"
>;

type ProductOption = Pick<
  Database["public"]["Tables"]["product_options"]["Row"],
  "code" | "position"
> & { product_option_values: OptionValue[] };

type VariantValue = Pick<
  Database["public"]["Tables"]["product_variant_values"]["Row"],
  "option_value_id"
>;

type Inventory = Pick<
  Database["public"]["Tables"]["inventory"]["Row"],
  "low_stock_threshold" | "on_hand" | "reserved"
>;

type ProductVariant = Pick<
  Database["public"]["Tables"]["product_variants"]["Row"],
  "id" | "is_active"
> & {
  inventory: Inventory | null;
  product_variant_values: VariantValue[];
};

export type CatalogProductRow = Pick<
  Database["public"]["Tables"]["products"]["Row"],
  "id" | "slug" | "gender" | "base_price_minor" | "compare_at_price_minor"
> & {
  product_translations: ProductTranslation[];
  product_options: ProductOption[];
  product_variants: ProductVariant[];
};

function titleFor(translations: ProductTranslation[], locale: "en" | "ar") {
  return translations.find((translation) => translation.locale === locale)
    ?.title;
}

function artFor(swatch: string | null | undefined): Product["art"] {
  const normalized = swatch?.toLowerCase();
  if (normalized === "#ede5d5") return "clay";
  if (normalized === "#3e4532") return "olive";
  if (normalized === "#282725") return "ink";
  return "sand";
}

export function mapCatalogProduct(row: CatalogProductRow): Product {
  const colorOption = row.product_options.find(
    (option) => option.code === "color",
  );
  const sizeOption = row.product_options.find(
    (option) => option.code === "size",
  );
  const color = colorOption?.product_option_values[0];
  const activeVariants = row.product_variants.filter(
    (variant) => variant.is_active,
  );
  const activeValueIds = new Set(
    activeVariants.flatMap((variant) =>
      variant.product_variant_values.map((value) => value.option_value_id),
    ),
  );
  const sizes = (sizeOption?.product_option_values ?? [])
    .filter((value) => activeValueIds.has(value.id))
    .sort((a, b) => a.position - b.position)
    .map((value) => value.label_en);
  const hasLowStockVariant = activeVariants.some((variant) => {
    const inventory = variant.inventory;
    return (
      inventory !== null &&
      inventory.on_hand - inventory.reserved <= inventory.low_stock_threshold
    );
  });

  return {
    id: String(row.id),
    slug: row.slug,
    title: {
      en: titleFor(row.product_translations, "en") ?? row.slug,
      ar:
        titleFor(row.product_translations, "ar") ??
        titleFor(row.product_translations, "en") ??
        row.slug,
    },
    category: row.gender ?? "unisex",
    price: row.base_price_minor,
    compareAt: row.compare_at_price_minor ?? undefined,
    color: color?.swatch_hex ?? "#c8b298",
    colorName: {
      en: color?.label_en ?? "Natural",
      ar: color?.label_ar ?? "طبيعي",
    },
    sizes,
    badge: row.compare_at_price_minor
      ? "sale"
      : hasLowStockVariant
        ? "low"
        : "new",
    art: artFor(color?.swatch_hex),
  };
}
