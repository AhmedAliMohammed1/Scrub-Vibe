import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { mapBannerRow, type BannerType, type CmsBanner } from "./types";

type Client = SupabaseClient<Database>;

// ─── Public queries (storefront) ────────────────────────────────────────────

export async function getActiveBanners(
  supabase: Client,
  type?: BannerType,
): Promise<CmsBanner[]> {
  let query = supabase
    .from("cms_banners")
    .select("*")
    .eq("is_active", true)
    .or("starts_at.is.null,starts_at.lte.now()")
    .or("ends_at.is.null,ends_at.gt.now()")
    .order("position", { ascending: true });

  if (type) query = query.eq("type", type);

  const { data, error } = await query;
  if (error) {
    console.error("[cms/repository] getActiveBanners error:", error.message);
    return [];
  }
  return (data ?? []).map((row) =>
    mapBannerRow(row as unknown as Record<string, unknown>),
  );
}

// ─── Admin queries (all banners, including inactive/scheduled/expired) ──────

export async function getAllBanners(
  supabase: Client,
  type?: BannerType,
): Promise<CmsBanner[]> {
  let query = supabase
    .from("cms_banners")
    .select("*")
    .order("type")
    .order("position", { ascending: true });

  if (type) query = query.eq("type", type);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to load banners: ${error.message}`);
  return (data ?? []).map((row) =>
    mapBannerRow(row as unknown as Record<string, unknown>),
  );
}

export async function getBannerById(
  supabase: Client,
  id: number,
): Promise<CmsBanner | null> {
  const { data, error } = await supabase
    .from("cms_banners")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return mapBannerRow(data as unknown as Record<string, unknown>);
}

// ─── Admin mutations ────────────────────────────────────────────────────────

export async function createBanner(
  supabase: Client,
  input: {
    type: string;
    title_en: string;
    title_ar: string;
    subtitle_en?: string | null;
    subtitle_ar?: string | null;
    body_en?: string | null;
    body_ar?: string | null;
    cta_text_en?: string | null;
    cta_text_ar?: string | null;
    cta_url?: string | null;
    secondary_cta_text_en?: string | null;
    secondary_cta_text_ar?: string | null;
    secondary_cta_url?: string | null;
    image_path?: string | null;
    bg_color?: string;
    text_color?: string;
    overlay_opacity?: number;
    position?: number;
    is_active?: boolean;
    starts_at?: string | null;
    ends_at?: string | null;
  },
): Promise<CmsBanner> {
  // Auto-assign position to end
  if (input.position === undefined || input.position === 0) {
    const { count } = await supabase
      .from("cms_banners")
      .select("id", { count: "exact", head: true })
      .eq("type", input.type);
    input.position = (count ?? 0) + 1;
  }

  const { data, error } = await supabase
    .from("cms_banners")
    .insert(input)
    .select("*")
    .single();

  if (error) throw new Error(`Failed to create banner: ${error.message}`);
  return mapBannerRow(data as unknown as Record<string, unknown>);
}

export async function updateBanner(
  supabase: Client,
  id: number,
  input: Database["public"]["Tables"]["cms_banners"]["Update"],
): Promise<CmsBanner> {
  const { data, error } = await supabase
    .from("cms_banners")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(`Failed to update banner: ${error.message}`);
  return mapBannerRow(data as unknown as Record<string, unknown>);
}

export async function deleteBanner(
  supabase: Client,
  id: number,
): Promise<void> {
  const { error } = await supabase.from("cms_banners").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete banner: ${error.message}`);
}

export async function toggleBannerActive(
  supabase: Client,
  id: number,
  isActive: boolean,
): Promise<void> {
  const { error } = await supabase
    .from("cms_banners")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) throw new Error(`Failed to toggle banner: ${error.message}`);
}

export async function reorderBanners(
  supabase: Client,
  orderedIds: number[],
): Promise<void> {
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("cms_banners")
      .update({ position: i + 1 })
      .eq("id", orderedIds[i]);
    if (error)
      throw new Error(`Failed to reorder banner ${orderedIds[i]}: ${error.message}`);
  }
}

// ─── Storage operations ─────────────────────────────────────────────────────

export async function uploadBannerImage(
  supabase: Client,
  file: File,
  filename: string,
): Promise<string> {
  const path = `banners/${Date.now()}-${filename}`;
  const { error } = await supabase.storage
    .from("banners")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error)
    throw new Error(`Failed to upload banner image: ${error.message}`);
  return path;
}

export async function deleteBannerImage(
  supabase: Client,
  path: string,
): Promise<void> {
  if (!path) return;
  const { error } = await supabase.storage.from("banners").remove([path]);
  if (error)
    console.error("[cms/repository] deleteBannerImage error:", error.message);
}
