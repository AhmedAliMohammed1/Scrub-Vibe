"use server";

import { createClient } from "@/lib/supabase/server";
import { syncCartAndWishlistWithSupabase } from "./repository";
import type { CartItemInput, SyncResponse } from "./types";

export async function syncCartAndWishlistAction(
  localCart: CartItemInput[],
  localWishlist: string[],
): Promise<SyncResponse | null> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) return null;

  return syncCartAndWishlistWithSupabase(supabase, localCart, localWishlist);
}

export async function updateCartItemQuantityAction(
  variantId: string,
  quantity: number,
): Promise<{ success: boolean; error?: string }> {
  const numVariant = Number(variantId);
  const clampedQty = Math.max(1, Math.min(10, quantity));
  if (!Number.isInteger(numVariant) || numVariant <= 0) {
    return { success: false, error: "invalid_variant" };
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return { success: false, error: "unauthenticated" };

  const { error } = await supabase
    .from("cart_items")
    .upsert(
      {
        user_id: userId,
        variant_id: numVariant,
        quantity: clampedQty,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,variant_id" },
    );

  if (error) {
    console.error("[cart/updateQuantity] Failed", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function removeCartItemAction(
  variantId: string,
): Promise<{ success: boolean; error?: string }> {
  const numVariant = Number(variantId);
  if (!Number.isInteger(numVariant) || numVariant <= 0) {
    return { success: false, error: "invalid_variant" };
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return { success: false, error: "unauthenticated" };

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("user_id", userId)
    .eq("variant_id", numVariant);

  if (error) {
    console.error("[cart/remove] Failed", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function clearCartAction(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return { success: false, error: "unauthenticated" };

  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("user_id", userId);

  if (error) {
    console.error("[cart/clear] Failed", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function toggleWishlistItemAction(
  productId: string,
): Promise<{ success: boolean; active?: boolean; error?: string }> {
  const numProduct = Number(productId);
  if (!Number.isInteger(numProduct) || numProduct <= 0) {
    return { success: false, error: "invalid_product" };
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return { success: false, error: "unauthenticated" };

  const { data: existing } = await supabase
    .from("wishlist_items")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", numProduct)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("wishlist_items")
      .delete()
      .eq("user_id", userId)
      .eq("product_id", numProduct);
    if (error) return { success: false, error: error.message };
    return { success: true, active: false };
  } else {
    const { error } = await supabase.from("wishlist_items").insert({
      user_id: userId,
      product_id: numProduct,
    });
    if (error) return { success: false, error: error.message };
    return { success: true, active: true };
  }
}
