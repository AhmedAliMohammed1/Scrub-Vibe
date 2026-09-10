import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  mapCatalogProduct,
  type CatalogProductRow,
} from "@/features/catalog/map-supabase-product";
import type { CatalogRepository } from "@/features/catalog/repository";
import type { Database } from "@/types/database";

const catalogSelect = `
  id,
  slug,
  gender,
  base_price_minor,
  cod_deposit_minor,
  compare_at_price_minor,
  product_translations(locale, title, description),
  product_images(id, storage_path, alt_en, alt_ar, position, colour_code),
  product_options(
    code,
    position,
    product_option_values(id, code, label_en, label_ar, position, swatch_hex)
  ),
  product_variants(
    id,
    is_active,
    inventory(low_stock_threshold, on_hand, reserved),
    product_variant_values(option_value_id)
  )
`;

type ClientFactory = () => SupabaseClient<Database>;

export class SupabaseCatalog implements CatalogRepository {
  constructor(private readonly clientFactory: ClientFactory) {}

  private async attachReviewSummaries(products: ReturnType<typeof mapCatalogProduct>[]) {
    if (!products.length) return products;
    const productIds = products.map((product) => Number(product.id));
    const { data, error } = await this.clientFactory()
      .from("product_review_summaries")
      .select("product_id, review_count, average_rating")
      .in("product_id", productIds);
    if (error) throw new Error(`Could not load product ratings: ${error.message}`);
    const ratings = new Map(
      (data ?? []).flatMap((row) =>
        row.product_id === null
          ? []
          : [
              [
                row.product_id,
                {
                  average: Number(row.average_rating ?? 0),
                  count: Number(row.review_count ?? 0),
                },
              ] as const,
            ],
      ),
    );
    return products.map((product) => ({
      ...product,
      rating: ratings.get(Number(product.id)),
    }));
  }

  async featured() {
    const { data, error } = await this.clientFactory()
      .from("products")
      .select(catalogSelect)
      .eq("status", "active")
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false });

    if (error)
      throw new Error(`Could not load the catalogue: ${error.message}`);
    return this.attachReviewSummaries(
      (data as CatalogProductRow[]).map(mapCatalogProduct),
    );
  }

  async bySlug(slug: string) {
    const { data, error } = await this.clientFactory()
      .from("products")
      .select(catalogSelect)
      .eq("status", "active")
      .lte("published_at", new Date().toISOString())
      .eq("slug", slug)
      .maybeSingle();

    if (error)
      throw new Error(`Could not load product ${slug}: ${error.message}`);
    if (!data) return null;
    const [product] = await this.attachReviewSummaries([
      mapCatalogProduct(data as CatalogProductRow),
    ]);
    return product;
  }
}
