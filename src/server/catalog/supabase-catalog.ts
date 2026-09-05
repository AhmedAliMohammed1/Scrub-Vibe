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
  compare_at_price_minor,
  product_translations(locale, title),
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

  async featured() {
    const { data, error } = await this.clientFactory()
      .from("products")
      .select(catalogSelect)
      .eq("status", "active")
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: false });

    if (error)
      throw new Error(`Could not load the catalogue: ${error.message}`);
    return (data as CatalogProductRow[]).map(mapCatalogProduct);
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
    return data ? mapCatalogProduct(data as CatalogProductRow) : null;
  }
}
