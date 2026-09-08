import { createPublicClient } from "@/lib/supabase/public";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  SizeCategory,
  SizeChartEntry,
  SizeChartRow,
} from "./size-guide-types";
import {
  DEFAULT_SIZE_CHART_ENTRIES,
  mapRowToSizeChartEntry,
} from "./size-guide";

export type ProductSizeChartResult = {
  entries: SizeChartEntry[];
  isProductOverride: boolean;
};

export async function getSizeChartForProduct({
  productId,
  category,
}: {
  productId?: number | null;
  category: SizeCategory;
}): Promise<ProductSizeChartResult> {
  try {
    const supabase = createPublicClient();

    // 1. If productId is provided, check for product-specific custom measurements
    if (productId && productId > 0) {
      const { data: productEntries, error: pError } = await supabase
        .from("size_chart_entries")
        .select("*")
        .eq("product_id", productId)
        .order("sort_order", { ascending: true });

      if (!pError && productEntries && productEntries.length > 0) {
        return {
          entries: (productEntries as unknown as SizeChartRow[]).map(
            mapRowToSizeChartEntry,
          ),
          isProductOverride: true,
        };
      }
    }

    // 2. Fall back to standard category defaults (product_id is null)
    const { data: categoryEntries, error: cError } = await supabase
      .from("size_chart_entries")
      .select("*")
      .is("product_id", null)
      .eq("category", category)
      .order("sort_order", { ascending: true });

    if (!cError && categoryEntries && categoryEntries.length > 0) {
      return {
        entries: (categoryEntries as unknown as SizeChartRow[]).map(
          mapRowToSizeChartEntry,
        ),
        isProductOverride: false,
      };
    }
  } catch (error) {
    console.warn(
      "[size-guide] Failed to fetch size chart from database, using defaults:",
      error,
    );
  }

  // 3. Fall back to in-memory defaults
  const fallback = DEFAULT_SIZE_CHART_ENTRIES.filter(
    (e) => e.category === category,
  );
  return {
    entries: fallback,
    isProductOverride: false,
  };
}

export type AdminSizeChartOverview = {
  categoryDefaults: Record<SizeCategory, SizeChartEntry[]>;
  productOverrides: {
    productId: number;
    productSlug: string;
    productTitleEn: string;
    productTitleAr: string;
    category: SizeCategory;
    entries: SizeChartEntry[];
  }[];
  allProducts: {
    id: number;
    slug: string;
    gender: string | null;
    titleEn: string;
    titleAr: string;
    hasOverride: boolean;
  }[];
};

export async function getAdminSizeChartOverview(): Promise<AdminSizeChartOverview> {
  const admin = createAdminClient();

  const [entriesResult, productsResult] = await Promise.all([
    admin
      .from("size_chart_entries")
      .select("*")
      .order("category")
      .order("sort_order"),
    admin
      .from("products")
      .select("id, slug, gender, product_translations(locale, title)")
      .eq("status", "active")
      .order("id"),
  ]);

  const rawEntries = (entriesResult.data ?? []) as unknown as SizeChartRow[];
  const allEntries = rawEntries.map(mapRowToSizeChartEntry);

  const categoryDefaults: Record<SizeCategory, SizeChartEntry[]> = {
    women: allEntries.filter((e) => e.productId === null && e.category === "women"),
    men: allEntries.filter((e) => e.productId === null && e.category === "men"),
    unisex: allEntries.filter((e) => e.productId === null && e.category === "unisex"),
  };

  // If DB category entries were empty for some reason, fill from default
  for (const cat of ["women", "men", "unisex"] as SizeCategory[]) {
    if (categoryDefaults[cat].length === 0) {
      categoryDefaults[cat] = DEFAULT_SIZE_CHART_ENTRIES.filter(
        (e) => e.category === cat,
      );
    }
  }

  type ProductRow = {
    id: number;
    slug: string;
    gender: string | null;
    product_translations: { locale: string; title: string }[];
  };
  const products = (productsResult.data ?? []) as unknown as ProductRow[];

  const productOverridesMap = new Map<number, SizeChartEntry[]>();
  for (const entry of allEntries) {
    if (entry.productId !== null) {
      const existing = productOverridesMap.get(entry.productId) ?? [];
      existing.push(entry);
      productOverridesMap.set(entry.productId, existing);
    }
  }

  const productOverrides: AdminSizeChartOverview["productOverrides"] = [];
  const allProductsList: AdminSizeChartOverview["allProducts"] = [];

  for (const p of products) {
    const titleEn =
      p.product_translations.find((t) => t.locale === "en")?.title ?? p.slug;
    const titleAr =
      p.product_translations.find((t) => t.locale === "ar")?.title ?? titleEn;
    const hasOverride = productOverridesMap.has(p.id);

    allProductsList.push({
      id: p.id,
      slug: p.slug,
      gender: p.gender,
      titleEn,
      titleAr,
      hasOverride,
    });

    if (hasOverride) {
      const entries = productOverridesMap.get(p.id)!;
      productOverrides.push({
        productId: p.id,
        productSlug: p.slug,
        productTitleEn: titleEn,
        productTitleAr: titleAr,
        category: (p.gender as SizeCategory) || "unisex",
        entries: entries.sort((a, b) => a.sortOrder - b.sortOrder),
      });
    }
  }

  return {
    categoryDefaults,
    productOverrides,
    allProducts: allProductsList,
  };
}
