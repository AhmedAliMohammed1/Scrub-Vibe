import { DevelopmentCatalog } from "../features/catalog/development-catalog";
import type { CatalogRepository } from "../features/catalog/repository";
import { hasSupabaseEnvironment } from "./supabase/config";
import { createPublicClient } from "./supabase/public";
import { SupabaseCatalog } from "../server/catalog/supabase-catalog";

export const catalog: CatalogRepository = hasSupabaseEnvironment()
  ? new SupabaseCatalog(createPublicClient)
  : new DevelopmentCatalog();
