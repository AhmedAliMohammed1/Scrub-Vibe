import "server-only";

import { catalog } from "@/lib/catalog";
import { createPublicClient } from "@/lib/supabase/public";
import { hasSupabaseEnvironment } from "@/lib/supabase/config";
import type { ProductBundle, ProductMerchandising } from "./types";

export async function getProductMerchandising(
  productId: number,
): Promise<ProductMerchandising> {
  if (!hasSupabaseEnvironment() || !Number.isInteger(productId)) {
    return { bundles: [], related: [] };
  }

  const supabase = createPublicClient();
  const [{ data: recommendations }, { data: memberships }, products] =
    await Promise.all([
      supabase
        .from("product_recommendations")
        .select("related_product_id")
        .eq("product_id", productId)
        .eq("is_active", true)
        .order("position"),
      supabase
        .from("product_bundle_items")
        .select("bundle_id")
        .eq("product_id", productId),
      catalog.featured(),
    ]);

  const bundleIds = [...new Set((memberships ?? []).map((row) => row.bundle_id))];
  const [{ data: bundleRows }, { data: bundleItems }] = await Promise.all([
    bundleIds.length
      ? supabase
          .from("product_bundles")
          .select("id, slug, title_en, title_ar, description_en, description_ar")
          .in("id", bundleIds)
          .order("position")
      : Promise.resolve({ data: [] }),
    bundleIds.length
      ? supabase
          .from("product_bundle_items")
          .select("bundle_id, product_id, quantity, position")
          .in("bundle_id", bundleIds)
          .order("position")
      : Promise.resolve({ data: [] }),
  ]);
  const byId = new Map(products.map((product) => [Number(product.id), product]));
  const relatedIds = (recommendations ?? []).map((row) => row.related_product_id);

  return {
    related: relatedIds.flatMap((id) => {
      const product = byId.get(id);
      return product ? [product] : [];
    }),
    bundles: (bundleRows ?? []).flatMap((bundle): ProductBundle[] => {
      const items = (bundleItems ?? [])
        .filter((item) => item.bundle_id === bundle.id)
        .flatMap((item) => {
          const product = byId.get(item.product_id);
          return product ? Array.from({ length: item.quantity }, () => product) : [];
        });
      return items.length > 1
        ? [{
            id: bundle.id,
            slug: bundle.slug,
            title: { en: bundle.title_en, ar: bundle.title_ar },
            description: {
              en: bundle.description_en,
              ar: bundle.description_ar,
            },
            products: items,
          }]
        : [];
    }),
  };
}

