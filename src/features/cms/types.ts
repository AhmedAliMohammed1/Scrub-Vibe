import type { Locale } from "@/lib/i18n";

// ─── Banner type enum ───────────────────────────────────────────────────────

export const BANNER_TYPES = ["announcement", "hero", "promo"] as const;
export type BannerType = (typeof BANNER_TYPES)[number];

export function isBannerType(value: string): value is BannerType {
  return BANNER_TYPES.includes(value as BannerType);
}

// ─── Domain model ───────────────────────────────────────────────────────────

export interface CmsBanner {
  id: number;
  type: BannerType;
  titleEn: string;
  titleAr: string;
  subtitleEn: string | null;
  subtitleAr: string | null;
  bodyEn: string | null;
  bodyAr: string | null;
  ctaTextEn: string | null;
  ctaTextAr: string | null;
  ctaUrl: string | null;
  secondaryCtaTextEn: string | null;
  secondaryCtaTextAr: string | null;
  secondaryCtaUrl: string | null;
  imagePath: string | null;
  bgColor: string;
  textColor: string;
  overlayOpacity: number;
  position: number;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Input shape for create/update ──────────────────────────────────────────

export interface CmsBannerInput {
  type: BannerType;
  titleEn: string;
  titleAr: string;
  subtitleEn?: string | null;
  subtitleAr?: string | null;
  bodyEn?: string | null;
  bodyAr?: string | null;
  ctaTextEn?: string | null;
  ctaTextAr?: string | null;
  ctaUrl?: string | null;
  secondaryCtaTextEn?: string | null;
  secondaryCtaTextAr?: string | null;
  secondaryCtaUrl?: string | null;
  imagePath?: string | null;
  bgColor?: string;
  textColor?: string;
  overlayOpacity?: number;
  position?: number;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}

// ─── Bilingual content helpers ──────────────────────────────────────────────

export function getBannerTitle(banner: CmsBanner, locale: Locale): string {
  return locale === "ar" ? banner.titleAr || banner.titleEn : banner.titleEn;
}

export function getBannerSubtitle(
  banner: CmsBanner,
  locale: Locale,
): string | null {
  return locale === "ar"
    ? banner.subtitleAr || banner.subtitleEn
    : banner.subtitleEn;
}

export function getBannerBody(
  banner: CmsBanner,
  locale: Locale,
): string | null {
  return locale === "ar" ? banner.bodyAr || banner.bodyEn : banner.bodyEn;
}

export function getBannerCtaText(
  banner: CmsBanner,
  locale: Locale,
): string | null {
  return locale === "ar"
    ? banner.ctaTextAr || banner.ctaTextEn
    : banner.ctaTextEn;
}

export function getBannerSecondaryCtaText(
  banner: CmsBanner,
  locale: Locale,
): string | null {
  return locale === "ar"
    ? banner.secondaryCtaTextAr || banner.secondaryCtaTextEn
    : banner.secondaryCtaTextEn;
}

// ─── Image URL helper ───────────────────────────────────────────────────────

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://iqufqtjotgpmhhtvlxwf.supabase.co";

export function getBannerImageUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/banners/${path}`;
}

// ─── Database row → domain model mapper ─────────────────────────────────────

export function mapBannerRow(row: Record<string, unknown>): CmsBanner {
  return {
    id: row.id as number,
    type: row.type as BannerType,
    titleEn: (row.title_en as string) ?? "",
    titleAr: (row.title_ar as string) ?? "",
    subtitleEn: (row.subtitle_en as string) ?? null,
    subtitleAr: (row.subtitle_ar as string) ?? null,
    bodyEn: (row.body_en as string) ?? null,
    bodyAr: (row.body_ar as string) ?? null,
    ctaTextEn: (row.cta_text_en as string) ?? null,
    ctaTextAr: (row.cta_text_ar as string) ?? null,
    ctaUrl: (row.cta_url as string) ?? null,
    secondaryCtaTextEn: (row.secondary_cta_text_en as string) ?? null,
    secondaryCtaTextAr: (row.secondary_cta_text_ar as string) ?? null,
    secondaryCtaUrl: (row.secondary_cta_url as string) ?? null,
    imagePath: (row.image_path as string) ?? null,
    bgColor: (row.bg_color as string) ?? "#073b36",
    textColor: (row.text_color as string) ?? "#ffffff",
    overlayOpacity: (row.overlay_opacity as number) ?? 60,
    position: (row.position as number) ?? 0,
    isActive: (row.is_active as boolean) ?? true,
    startsAt: (row.starts_at as string) ?? null,
    endsAt: (row.ends_at as string) ?? null,
    createdAt: (row.created_at as string) ?? "",
    updatedAt: (row.updated_at as string) ?? "",
  };
}

// ─── Banner schedule status ─────────────────────────────────────────────────

export type BannerStatus = "live" | "scheduled" | "expired" | "inactive";

export function getBannerStatus(banner: CmsBanner): BannerStatus {
  if (!banner.isActive) return "inactive";
  const now = new Date();
  if (banner.startsAt && new Date(banner.startsAt) > now) return "scheduled";
  if (banner.endsAt && new Date(banner.endsAt) <= now) return "expired";
  return "live";
}

export function isCurrentlyVisible(banner: CmsBanner): boolean {
  return getBannerStatus(banner) === "live";
}

// ─── Status badge labels ────────────────────────────────────────────────────

export const STATUS_LABELS: Record<BannerStatus, { en: string; ar: string }> = {
  live: { en: "Live", ar: "مباشر" },
  scheduled: { en: "Scheduled", ar: "مجدول" },
  expired: { en: "Expired", ar: "منتهي" },
  inactive: { en: "Inactive", ar: "معطّل" },
};

export const TYPE_LABELS: Record<BannerType, { en: string; ar: string }> = {
  announcement: { en: "Announcement", ar: "إعلان" },
  hero: { en: "Hero Banner", ar: "بانر رئيسي" },
  promo: { en: "Promotional", ar: "ترويجي" },
};
