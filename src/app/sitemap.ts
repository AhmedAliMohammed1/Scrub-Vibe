import type { MetadataRoute } from "next";
import { demoProducts } from "@/features/catalog/demo-catalog";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
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
