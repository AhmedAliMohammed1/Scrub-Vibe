import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/features/auth/site-url";

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteOrigin();

  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
