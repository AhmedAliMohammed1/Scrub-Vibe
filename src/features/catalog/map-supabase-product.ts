import type { Database } from "@/types/database";
import type { Product, ProductColour } from "./types";

type ProductTranslation = Pick<
  Database["public"]["Tables"]["product_translations"]["Row"],
  "locale" | "title" | "description"
>;

type ProductImage = Pick<
  Database["public"]["Tables"]["product_images"]["Row"],
  "storage_path" | "alt_en" | "alt_ar" | "position"
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
  product_images: ProductImage[];
  product_options: ProductOption[];
  product_variants: ProductVariant[];
};

function titleFor(translations: ProductTranslation[], locale: "en" | "ar") {
  return translations.find((translation) => translation.locale === locale)
    ?.title;
}

function descriptionFor(
  translations: ProductTranslation[],
  locale: "en" | "ar",
) {
  return (
    translations.find((translation) => translation.locale === locale)
      ?.description ?? ""
  );
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
  const activeVariants = row.product_variants.filter(
    (variant) => variant.is_active,
  );
  const inStockVariants = activeVariants.filter((variant) => {
    const inventory = variant.inventory;
    return inventory !== null && inventory.on_hand - inventory.reserved > 0;
  });
  const sizeValues = (sizeOption?.product_option_values ?? []).toSorted(
    (a, b) => a.position - b.position,
  );
  const variantHasValues = (variant: ProductVariant, ...valueIds: number[]) => {
    const variantValueIds = new Set(
      variant.product_variant_values.map((value) => value.option_value_id),
    );
    return valueIds.every((id) => variantValueIds.has(id));
  };
  const colors: ProductColour[] = (colorOption?.product_option_values ?? [])
    .toSorted((a, b) => a.position - b.position)
    .map((color) => {
      const availableSizes = sizeValues
        .filter((size) =>
          inStockVariants.some((variant) =>
            variantHasValues(variant, color.id, size.id),
          ),
        )
        .map((size) => size.label_en);
      const variants = Object.fromEntries(
        sizeValues.flatMap((size) => {
          const variant = inStockVariants.find((item) =>
            variantHasValues(item, color.id, size.id),
          );
          return variant ? [[size.label_en, String(variant.id)]] : [];
        }),
      );

      return {
        id: String(color.id),
        code: color.code,
        swatch: color.swatch_hex ?? "#c8b298",
        name: { en: color.label_en, ar: color.label_ar },
        sizes: availableSizes,
        variants,
        inStock: availableSizes.length > 0,
      };
    });
  const fallbackColour: ProductColour = {
    id: "natural",
    code: "natural",
    swatch: "#c8b298",
    name: { en: "Natural", ar: "طبيعي" },
    sizes: [],
    variants: {},
    inStock: false,
  };
  const primaryColour =
    colors.find((colour) => colour.inStock) ?? colors[0] ?? fallbackColour;
  const sizes = [...new Set(colors.flatMap((colour) => colour.sizes))].toSorted(
    (a, b) =>
      sizeValues.findIndex((value) => value.label_en === a) -
      sizeValues.findIndex((value) => value.label_en === b),
  );
  const hasLowStockVariant = activeVariants.some((variant) => {
    const inventory = variant.inventory;
    return (
      inventory !== null &&
      inventory.on_hand - inventory.reserved <= inventory.low_stock_threshold
    );
  });
  const image = row.product_images.toSorted(
    (a, b) => a.position - b.position,
  )[0];

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
    description: {
      en: descriptionFor(row.product_translations, "en"),
      ar:
        descriptionFor(row.product_translations, "ar") ||
        descriptionFor(row.product_translations, "en"),
    },
    category: row.gender ?? "unisex",
    price: row.base_price_minor,
    compareAt: row.compare_at_price_minor ?? undefined,
    color: primaryColour.swatch,
    colorCode: primaryColour.code,
    colorName: primaryColour.name,
    colors: colors.length ? colors : [fallbackColour],
    sizes,
    inStock: inStockVariants.length > 0,
    badge: row.compare_at_price_minor
      ? "sale"
      : hasLowStockVariant
        ? "low"
        : "new",
    art: artFor(primaryColour.swatch),
    image: {
      src: image?.storage_path ?? "/images/scrub-vibe/female-collection.webp",
      alt: {
        en:
          image?.alt_en ?? titleFor(row.product_translations, "en") ?? row.slug,
        ar:
          image?.alt_ar ??
          titleFor(row.product_translations, "ar") ??
          image?.alt_en ??
          titleFor(row.product_translations, "en") ??
          row.slug,
      },
    },
  };
}
