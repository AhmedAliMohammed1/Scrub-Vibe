import { demoProducts } from "./demo-catalog";
import type { CatalogRepository } from "./repository";

export class DevelopmentCatalog implements CatalogRepository {
  async featured() {
    return demoProducts;
  }

  async bySlug(slug: string) {
    return demoProducts.find((product) => product.slug === slug) ?? null;
  }
}
