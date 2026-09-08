import type { CartLine, SyncResponse } from "./types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function mapSyncCartLine(raw: Record<string, unknown>): CartLine {
  const productId = String(raw.product_id ?? "");
  const variantId = String(raw.variant_id ?? "");
  const colourCode = String(raw.colour_code ?? "default");
  const size = String(raw.size ?? "M");
  const titleEn = String(raw.title_en ?? "Scrub Vibe");
  const titleAr = String(raw.title_ar ?? "سكراب فايب");
  const priceMinor = typeof raw.price_minor === "number" ? raw.price_minor : 0;
  const depositMinor =
    typeof raw.cod_deposit_minor === "number" ? raw.cod_deposit_minor : 0;

  return {
    key: `${productId}:${colourCode}:${size}`,
    productId,
    variantId,
    slug: String(raw.slug ?? ""),
    title: { en: titleEn, ar: titleAr },
    image: {
      src: String(raw.image_url ?? "/images/scrub-vibe/logo.png"),
      alt: { en: titleEn, ar: titleAr },
    },
    // CartLine follows the catalogue/order convention: all money stays in
    // integer minor units until formatMoney renders it. The RPC already
    // returns *_minor values, so converting here would divide prices twice.
    price: priceMinor,
    codDeposit: depositMinor,
    colourCode,
    colourName: {
      en: String(raw.colour_en ?? "Default"),
      ar: String(raw.colour_ar ?? "افتراضي"),
    },
    swatch: String(raw.swatch ?? "#171717"),
    size,
    quantity: Math.max(1, Math.min(10, Number(raw.quantity) || 1)),
    availableStock:
      typeof raw.available_stock === "number" ? raw.available_stock : undefined,
  };
}

export function mergeCartLines(
  currentLines: CartLine[],
  incomingLines: CartLine[],
): CartLine[] {
  const lineMap = new Map<string, CartLine>();

  for (const line of currentLines) {
    lineMap.set(line.key, { ...line });
  }

  for (const incoming of incomingLines) {
    const existing = lineMap.get(incoming.key);
    if (existing) {
      // A synced/server line is authoritative. Adding both quantities makes
      // repeated reconciliation non-idempotent and can inflate a single item
      // all the way to the cart limit.
      existing.quantity = incoming.quantity;
      existing.price = incoming.price;
      existing.codDeposit = incoming.codDeposit;
      existing.title = incoming.title;
      existing.image = incoming.image;
      existing.availableStock = incoming.availableStock;
    } else {
      lineMap.set(incoming.key, { ...incoming });
    }
  }

  return Array.from(lineMap.values());
}

export function mergeWishlistIds(
  current: string[],
  incoming: string[],
): string[] {
  const set = new Set<string>();
  for (const id of current) if (id.trim()) set.add(id.trim());
  for (const id of incoming) if (id.trim()) set.add(id.trim());
  return Array.from(set);
}

export async function syncCartAndWishlistWithSupabase(
  supabase: SupabaseClient<Database>,
  localCart: { variantId: string; quantity: number }[],
  localWishlist: string[],
): Promise<SyncResponse | null> {
  const validWishlistIds = localWishlist
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);

  const formattedCart = localCart
    .map((item) => ({
      variant_id: Number(item.variantId),
      quantity: Math.max(1, Math.min(10, item.quantity)),
    }))
    .filter((item) => Number.isInteger(item.variant_id) && item.variant_id > 0);

  const { data, error } = await supabase.rpc(
    "sync_customer_cart_and_wishlist",
    {
      p_cart: formattedCart,
      p_wishlist: validWishlistIds,
    },
  );

  if (error || !data || typeof data !== "object") {
    console.error("[cart/sync] Supabase sync failed", error);
    return null;
  }

  const payload = data as { cart?: unknown[]; wishlist?: unknown[] };
  const cart = Array.isArray(payload.cart)
    ? payload.cart.map((item) =>
        mapSyncCartLine(item as Record<string, unknown>),
      )
    : [];
  const wishlist = Array.isArray(payload.wishlist)
    ? payload.wishlist.map(String)
    : [];

  return { cart, wishlist };
}
