import type { Product } from "@/features/catalog/types";

export type ProductBundle = {
  id: number;
  slug: string;
  title: { en: string; ar: string };
  description: { en: string; ar: string };
  products: Product[];
};

export type ProductMerchandising = {
  bundles: ProductBundle[];
  related: Product[];
};

export const returnStatuses = [
  "requested",
  "reviewing",
  "approved",
  "rejected",
  "received",
  "completed",
  "cancelled",
] as const;

export type ReturnStatus = (typeof returnStatuses)[number];
