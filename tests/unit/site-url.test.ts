import { describe, expect, it } from "vitest";
import { getSiteOrigin } from "@/features/auth/site-url";

describe("getSiteOrigin", () => {
  it("prefers the explicitly configured public app URL", () => {
    expect(
      getSiteOrigin({
        NEXT_PUBLIC_APP_URL: "https://shop.example.com/",
        VERCEL_PROJECT_PRODUCTION_URL: "fallback.vercel.app",
      }),
    ).toBe("https://shop.example.com");
  });

  it("uses Vercel's production domain when a public app URL is absent", () => {
    expect(
      getSiteOrigin({
        VERCEL_PROJECT_PRODUCTION_URL: "scrub-vibe-tau.vercel.app",
      }),
    ).toBe("https://scrub-vibe-tau.vercel.app");
  });

  it("falls back to the current Vercel deployment domain", () => {
    expect(getSiteOrigin({ VERCEL_URL: "preview.vercel.app" })).toBe(
      "https://preview.vercel.app",
    );
  });

  it("uses localhost only outside a configured deployment", () => {
    expect(getSiteOrigin({})).toBe("http://localhost:3000");
  });
});
