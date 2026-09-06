import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ["lucide-react"],
    serverActions: { bodySizeLimit: "6mb" },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "iqufqtjotgpmhhtvlxwf.supabase.co",
        pathname: "/storage/v1/object/public/product-media/**",
      },
    ],
  },
};

export default nextConfig;
