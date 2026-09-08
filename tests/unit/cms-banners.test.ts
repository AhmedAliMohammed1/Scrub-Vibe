import { describe, expect, it } from "vitest";
import {
  BANNER_TYPES,
  getBannerBody,
  getBannerCtaText,
  getBannerImageUrl,
  getBannerSecondaryCtaText,
  getBannerStatus,
  getBannerSubtitle,
  getBannerTitle,
  isBannerType,
  mapBannerRow,
  type CmsBanner,
} from "@/features/cms/types";
import { bannerInputSchema } from "@/features/cms/validation";

describe("CMS Banners Domain & Validation", () => {
  const sampleBanner: CmsBanner = {
    id: 1,
    type: "hero",
    titleEn: "Confidence for every shift",
    titleAr: "ثقة في كل شيفت",
    subtitleEn: "MEDICAL CLOTHING · MADE IN EGYPT",
    subtitleAr: "ملابس طبية · صناعة مصرية",
    bodyEn: "Premium scrubs made in our own factory",
    bodyAr: "سكراب عالي الجودة من مصنعنا",
    ctaTextEn: "Shop Women",
    ctaTextAr: "تسوقي الحريمي",
    ctaUrl: "/en/shop?category=women",
    secondaryCtaTextEn: "Shop Men",
    secondaryCtaTextAr: "تسوق الرجالي",
    secondaryCtaUrl: "/en/shop?category=men",
    imagePath: "banners/123-hero.jpg",
    bgColor: "#073b36",
    textColor: "#ffffff",
    overlayOpacity: 60,
    position: 1,
    isActive: true,
    startsAt: null,
    endsAt: null,
    createdAt: "2026-09-08T00:00:00Z",
    updatedAt: "2026-09-08T00:00:00Z",
  };

  describe("Banner types", () => {
    it("recognizes all valid banner types", () => {
      expect(BANNER_TYPES).toEqual(["announcement", "hero", "promo"]);
      expect(isBannerType("announcement")).toBe(true);
      expect(isBannerType("hero")).toBe(true);
      expect(isBannerType("promo")).toBe(true);
      expect(isBannerType("footer")).toBe(false);
      expect(isBannerType("")).toBe(false);
    });
  });

  describe("Bilingual helpers", () => {
    it("resolves English and Arabic titles with fallback", () => {
      expect(getBannerTitle(sampleBanner, "en")).toBe("Confidence for every shift");
      expect(getBannerTitle(sampleBanner, "ar")).toBe("ثقة في كل شيفت");

      const withoutAr: CmsBanner = { ...sampleBanner, titleAr: "" };
      expect(getBannerTitle(withoutAr, "ar")).toBe("Confidence for every shift");
    });

    it("resolves subtitles, body text, and CTA text", () => {
      expect(getBannerSubtitle(sampleBanner, "en")).toBe(
        "MEDICAL CLOTHING · MADE IN EGYPT",
      );
      expect(getBannerSubtitle(sampleBanner, "ar")).toBe(
        "ملابس طبية · صناعة مصرية",
      );

      expect(getBannerBody(sampleBanner, "en")).toBe(
        "Premium scrubs made in our own factory",
      );
      expect(getBannerBody(sampleBanner, "ar")).toBe(
        "سكراب عالي الجودة من مصنعنا",
      );

      expect(getBannerCtaText(sampleBanner, "en")).toBe("Shop Women");
      expect(getBannerCtaText(sampleBanner, "ar")).toBe("تسوقي الحريمي");

      expect(getBannerSecondaryCtaText(sampleBanner, "en")).toBe("Shop Men");
      expect(getBannerSecondaryCtaText(sampleBanner, "ar")).toBe("تسوق الرجالي");
    });
  });

  describe("Image URL helper", () => {
    it("returns null for null or empty paths", () => {
      expect(getBannerImageUrl(null)).toBeNull();
      expect(getBannerImageUrl("")).toBeNull();
    });

    it("constructs Supabase Storage public URL from relative storage path", () => {
      const url = getBannerImageUrl("banners/123-hero.jpg");
      expect(url).toContain(
        "/storage/v1/object/public/banners/banners/123-hero.jpg",
      );
    });

    it("preserves external HTTP/HTTPS URLs directly", () => {
      const external = "https://cdn.example.com/banner.png";
      expect(getBannerImageUrl(external)).toBe(external);
    });
  });

  describe("Banner schedule status", () => {
    it("marks inactive banners as 'inactive'", () => {
      const inactive: CmsBanner = { ...sampleBanner, isActive: false };
      expect(getBannerStatus(inactive)).toBe("inactive");
    });

    it("marks banners with no dates as 'live'", () => {
      expect(getBannerStatus(sampleBanner)).toBe("live");
    });

    it("marks future banners as 'scheduled'", () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const scheduled: CmsBanner = { ...sampleBanner, startsAt: futureDate };
      expect(getBannerStatus(scheduled)).toBe("scheduled");
    });

    it("marks past-ended banners as 'expired'", () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString();
      const expired: CmsBanner = { ...sampleBanner, endsAt: pastDate };
      expect(getBannerStatus(expired)).toBe("expired");
    });

    it("marks currently active window banners as 'live'", () => {
      const pastDate = new Date(Date.now() - 3600000).toISOString();
      const futureDate = new Date(Date.now() + 3600000).toISOString();
      const activeWindow: CmsBanner = {
        ...sampleBanner,
        startsAt: pastDate,
        endsAt: futureDate,
      };
      expect(getBannerStatus(activeWindow)).toBe("live");
    });
  });

  describe("Database row mapping", () => {
    it("correctly maps snake_case database row to camelCase domain model", () => {
      const row = {
        id: 42,
        type: "announcement",
        title_en: "Free delivery this week",
        title_ar: "توصيل مجاني هذا الأسبوع",
        subtitle_en: null,
        subtitle_ar: null,
        body_en: null,
        body_ar: null,
        cta_text_en: "Shop now",
        cta_text_ar: "تسوق الآن",
        cta_url: "/en/shop",
        secondary_cta_text_en: null,
        secondary_cta_text_ar: null,
        secondary_cta_url: null,
        image_path: null,
        bg_color: "#000000",
        text_color: "#ffffff",
        overlay_opacity: 50,
        position: 3,
        is_active: true,
        starts_at: null,
        ends_at: null,
        created_at: "2026-09-08T10:00:00Z",
        updated_at: "2026-09-08T10:00:00Z",
      };

      const mapped = mapBannerRow(row);
      expect(mapped.id).toBe(42);
      expect(mapped.type).toBe("announcement");
      expect(mapped.titleEn).toBe("Free delivery this week");
      expect(mapped.titleAr).toBe("توصيل مجاني هذا الأسبوع");
      expect(mapped.bgColor).toBe("#000000");
      expect(mapped.position).toBe(3);
      expect(mapped.isActive).toBe(true);
    });
  });

  describe("Zod validation schema", () => {
    it("validates a complete valid banner input", () => {
      const input = {
        type: "hero",
        titleEn: "Autumn Collection",
        titleAr: "مجموعة الخريف",
        subtitleEn: "New Arrivals",
        subtitleAr: "وصل حديثاً",
        ctaTextEn: "Discover",
        ctaTextAr: "اكتشف",
        ctaUrl: "/en/shop?category=new",
        bgColor: "#073b36",
        textColor: "#ffffff",
        overlayOpacity: 70,
        position: 1,
        isActive: true,
      };

      const result = bannerInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("rejects invalid banner types", () => {
      const input = {
        type: "sidebar",
        titleEn: "Test",
        titleAr: "تجربة",
      };
      const result = bannerInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("rejects empty titles", () => {
      const input = {
        type: "announcement",
        titleEn: "",
        titleAr: "تجربة",
      };
      const result = bannerInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("rejects invalid hex colors", () => {
      const input = {
        type: "hero",
        titleEn: "Test",
        titleAr: "تجربة",
        bgColor: "red",
      };
      const result = bannerInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("enforces overlay opacity between 0 and 100", () => {
      const tooHigh = {
        type: "hero",
        titleEn: "Test",
        titleAr: "تجربة",
        overlayOpacity: 150,
      };
      expect(bannerInputSchema.safeParse(tooHigh).success).toBe(false);

      const negative = {
        type: "hero",
        titleEn: "Test",
        titleAr: "تجربة",
        overlayOpacity: -10,
      };
      expect(bannerInputSchema.safeParse(negative).success).toBe(false);
    });

    it("validates schedule dates order (endsAt must be after startsAt)", () => {
      const invalidSchedule = {
        type: "hero",
        titleEn: "Test",
        titleAr: "تجربة",
        startsAt: "2026-10-10T10:00:00Z",
        endsAt: "2026-10-09T10:00:00Z",
      };
      const result = bannerInputSchema.safeParse(invalidSchedule);
      expect(result.success).toBe(false);

      const validSchedule = {
        type: "hero",
        titleEn: "Test",
        titleAr: "تجربة",
        startsAt: "2026-10-09T10:00:00Z",
        endsAt: "2026-10-10T10:00:00Z",
      };
      expect(bannerInputSchema.safeParse(validSchedule).success).toBe(true);
    });

    it("accepts valid URL formats (relative and http)", () => {
      const relative = {
        type: "promo",
        titleEn: "Test",
        titleAr: "تجربة",
        ctaUrl: "/en/shop",
      };
      expect(bannerInputSchema.safeParse(relative).success).toBe(true);

      const external = {
        type: "promo",
        titleEn: "Test",
        titleAr: "تجربة",
        ctaUrl: "https://instagram.com/scrubvibe_egy",
      };
      expect(bannerInputSchema.safeParse(external).success).toBe(true);

      const invalidUrl = {
        type: "promo",
        titleEn: "Test",
        titleAr: "تجربة",
        ctaUrl: "javascript:alert(1)",
      };
      expect(bannerInputSchema.safeParse(invalidUrl).success).toBe(false);
    });
  });
});
