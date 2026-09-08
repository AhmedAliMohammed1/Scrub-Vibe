import { z } from "zod";
import { BANNER_TYPES } from "./types";

// ─── Banner input schema ────────────────────────────────────────────────────

export const bannerInputSchema = z
  .object({
    type: z.enum(BANNER_TYPES),
    titleEn: z
      .string()
      .min(1, "English title is required")
      .max(200, "Title too long"),
    titleAr: z
      .string()
      .min(1, "Arabic title is required")
      .max(200, "Title too long"),
    subtitleEn: z.string().max(200).nullish(),
    subtitleAr: z.string().max(200).nullish(),
    bodyEn: z.string().max(1000).nullish(),
    bodyAr: z.string().max(1000).nullish(),
    ctaTextEn: z.string().max(100).nullish(),
    ctaTextAr: z.string().max(100).nullish(),
    ctaUrl: z
      .string()
      .max(500)
      .refine(
        (val) => !val || val.startsWith("/") || val.startsWith("http"),
        "URL must start with / or http",
      )
      .nullish(),
    secondaryCtaTextEn: z.string().max(100).nullish(),
    secondaryCtaTextAr: z.string().max(100).nullish(),
    secondaryCtaUrl: z
      .string()
      .max(500)
      .refine(
        (val) => !val || val.startsWith("/") || val.startsWith("http"),
        "URL must start with / or http",
      )
      .nullish(),
    imagePath: z.string().max(500).nullish(),
    bgColor: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color")
      .default("#073b36"),
    textColor: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color")
      .default("#ffffff"),
    overlayOpacity: z.coerce.number().int().min(0).max(100).default(60),
    position: z.coerce.number().int().min(0).default(0),
    isActive: z
      .union([z.boolean(), z.literal("on"), z.literal("true")])
      .transform((v) => v === true || v === "on" || v === "true")
      .default(true),
    startsAt: z
      .string()
      .datetime({ offset: true })
      .nullish()
      .or(z.literal("")),
    endsAt: z
      .string()
      .datetime({ offset: true })
      .nullish()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.startsAt && data.endsAt) {
        return new Date(data.endsAt) > new Date(data.startsAt);
      }
      return true;
    },
    { message: "End date must be after start date", path: ["endsAt"] },
  );

export type BannerInput = z.infer<typeof bannerInputSchema>;
