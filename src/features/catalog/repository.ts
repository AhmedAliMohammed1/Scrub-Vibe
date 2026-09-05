import type { Product } from "./types";

export interface CatalogRepository {
  featured(): Promise<Product[]>;
  bySlug(slug: string): Promise<Product | null>;
}
