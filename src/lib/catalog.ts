import { demoProducts } from "../features/catalog/demo-catalog";
import type { Product } from "../features/catalog/types";

export interface CatalogRepository {
  featured(): Promise<Product[]>;
  bySlug(slug: string): Promise<Product | null>;
}

class DevelopmentCatalog implements CatalogRepository {
  async featured() {
    return demoProducts;
  }
  async bySlug(slug: string) {
    return demoProducts.find((product) => product.slug === slug) ?? null;
  }
}

// Switch to SupabaseCatalog once credentials are configured; UI never depends on the adapter.
export const catalog: CatalogRepository = new DevelopmentCatalog();
