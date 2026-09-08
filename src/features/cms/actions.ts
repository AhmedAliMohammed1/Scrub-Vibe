"use server";

import { revalidatePath } from "next/cache";
import { requireRoles } from "@/server/auth/roles";
import {
  createBanner,
  deleteBanner,
  deleteBannerImage,
  getBannerById,
  toggleBannerActive,
  updateBanner,
  uploadBannerImage,
  reorderBanners,
} from "./repository";
import { bannerInputSchema } from "./validation";

type ActionResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

function invalidateBannerCaches() {
  revalidatePath("/[locale]", "page");
  revalidatePath("/[locale]/admin/banners", "page");
}

// ─── Create ─────────────────────────────────────────────────────────────────

export async function createBannerAction(
  formData: FormData,
): Promise<ActionResult> {
  const { supabase } = await requireRoles(["admin", "super_admin"]);

  // Extract image file before parsing
  const imageFile = formData.get("image") as File | null;

  const raw = Object.fromEntries(formData.entries());
  // Clean empty strings to null for optional fields
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key === "image") continue;
    cleaned[key] =
      typeof value === "string" && value.trim() === "" ? null : value;
  }
  // Handle checkbox
  cleaned.isActive = formData.has("isActive");

  const parsed = bannerInputSchema.safeParse(cleaned);
  if (!parsed.success) {
    return {
      success: false,
      error: "invalid_input",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    let imagePath: string | null = null;
    if (imageFile && imageFile.size > 0) {
      imagePath = await uploadBannerImage(supabase, imageFile, imageFile.name);
    }

    await createBanner(supabase, {
      type: parsed.data.type,
      title_en: parsed.data.titleEn,
      title_ar: parsed.data.titleAr,
      subtitle_en: parsed.data.subtitleEn ?? null,
      subtitle_ar: parsed.data.subtitleAr ?? null,
      body_en: parsed.data.bodyEn ?? null,
      body_ar: parsed.data.bodyAr ?? null,
      cta_text_en: parsed.data.ctaTextEn ?? null,
      cta_text_ar: parsed.data.ctaTextAr ?? null,
      cta_url: parsed.data.ctaUrl ?? null,
      secondary_cta_text_en: parsed.data.secondaryCtaTextEn ?? null,
      secondary_cta_text_ar: parsed.data.secondaryCtaTextAr ?? null,
      secondary_cta_url: parsed.data.secondaryCtaUrl ?? null,
      image_path: imagePath,
      bg_color: parsed.data.bgColor,
      text_color: parsed.data.textColor,
      overlay_opacity: parsed.data.overlayOpacity,
      is_active: parsed.data.isActive,
      starts_at: parsed.data.startsAt || null,
      ends_at: parsed.data.endsAt || null,
    });

    invalidateBannerCaches();
    return { success: true };
  } catch (error) {
    console.error("[cms/actions] createBannerAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "create_failed",
    };
  }
}

// ─── Update ─────────────────────────────────────────────────────────────────

export async function updateBannerAction(
  bannerId: number,
  formData: FormData,
): Promise<ActionResult> {
  if (!Number.isInteger(bannerId) || bannerId <= 0) {
    return { success: false, error: "invalid_banner_id" };
  }

  const { supabase } = await requireRoles(["admin", "super_admin"]);

  const imageFile = formData.get("image") as File | null;

  const raw = Object.fromEntries(formData.entries());
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key === "image") continue;
    cleaned[key] =
      typeof value === "string" && value.trim() === "" ? null : value;
  }
  cleaned.isActive = formData.has("isActive");

  const parsed = bannerInputSchema.safeParse(cleaned);
  if (!parsed.success) {
    return {
      success: false,
      error: "invalid_input",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const existing = await getBannerById(supabase, bannerId);

    let imagePath = existing?.imagePath ?? null;
    if (imageFile && imageFile.size > 0) {
      // Delete old image if replacing
      if (existing?.imagePath) {
        await deleteBannerImage(supabase, existing.imagePath);
      }
      imagePath = await uploadBannerImage(supabase, imageFile, imageFile.name);
    }

    // Handle explicit image removal
    if (formData.get("removeImage") === "true" && existing?.imagePath) {
      await deleteBannerImage(supabase, existing.imagePath);
      imagePath = null;
    }

    await updateBanner(supabase, bannerId, {
      title_en: parsed.data.titleEn,
      title_ar: parsed.data.titleAr,
      subtitle_en: parsed.data.subtitleEn ?? null,
      subtitle_ar: parsed.data.subtitleAr ?? null,
      body_en: parsed.data.bodyEn ?? null,
      body_ar: parsed.data.bodyAr ?? null,
      cta_text_en: parsed.data.ctaTextEn ?? null,
      cta_text_ar: parsed.data.ctaTextAr ?? null,
      cta_url: parsed.data.ctaUrl ?? null,
      secondary_cta_text_en: parsed.data.secondaryCtaTextEn ?? null,
      secondary_cta_text_ar: parsed.data.secondaryCtaTextAr ?? null,
      secondary_cta_url: parsed.data.secondaryCtaUrl ?? null,
      image_path: imagePath,
      bg_color: parsed.data.bgColor,
      text_color: parsed.data.textColor,
      overlay_opacity: parsed.data.overlayOpacity,
      is_active: parsed.data.isActive,
      starts_at: parsed.data.startsAt || null,
      ends_at: parsed.data.endsAt || null,
    });

    invalidateBannerCaches();
    return { success: true };
  } catch (error) {
    console.error("[cms/actions] updateBannerAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "update_failed",
    };
  }
}

// ─── Delete ─────────────────────────────────────────────────────────────────

export async function deleteBannerAction(
  bannerId: number,
): Promise<ActionResult> {
  if (!Number.isInteger(bannerId) || bannerId <= 0) {
    return { success: false, error: "invalid_banner_id" };
  }

  const { supabase } = await requireRoles(["admin", "super_admin"]);

  try {
    const existing = await getBannerById(supabase, bannerId);
    if (existing?.imagePath) {
      await deleteBannerImage(supabase, existing.imagePath);
    }
    await deleteBanner(supabase, bannerId);
    invalidateBannerCaches();
    return { success: true };
  } catch (error) {
    console.error("[cms/actions] deleteBannerAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "delete_failed",
    };
  }
}

// ─── Toggle active ──────────────────────────────────────────────────────────

export async function toggleBannerAction(
  bannerId: number,
): Promise<ActionResult> {
  if (!Number.isInteger(bannerId) || bannerId <= 0) {
    return { success: false, error: "invalid_banner_id" };
  }

  const { supabase } = await requireRoles(["admin", "super_admin"]);

  try {
    const existing = await getBannerById(supabase, bannerId);
    if (!existing) return { success: false, error: "not_found" };
    await toggleBannerActive(supabase, bannerId, !existing.isActive);
    invalidateBannerCaches();
    return { success: true };
  } catch (error) {
    console.error("[cms/actions] toggleBannerAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "toggle_failed",
    };
  }
}

// ─── Reorder ────────────────────────────────────────────────────────────────

export async function reorderBannersAction(
  orderedIds: number[],
): Promise<ActionResult> {
  if (!Array.isArray(orderedIds) || orderedIds.some((id) => !Number.isInteger(id))) {
    return { success: false, error: "invalid_ids" };
  }

  const { supabase } = await requireRoles(["admin", "super_admin"]);

  try {
    await reorderBanners(supabase, orderedIds);
    invalidateBannerCaches();
    return { success: true };
  } catch (error) {
    console.error("[cms/actions] reorderBannersAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "reorder_failed",
    };
  }
}
