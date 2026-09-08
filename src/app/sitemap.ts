import type { MetadataRoute } from "next";
import { demoProducts } from "@/features/catalog/demo-catalog";
import { getSiteOrigin } from "@/features/auth/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteOrigin();
  return ["en", "ar"].flatMap((locale) => [
    {
      url: `${base}/${locale}`,
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${base}/${locale}/shop`,
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    ...demoProducts.map((p) => ({
      url: `${base}/${locale}/products/${p.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ]);
}
