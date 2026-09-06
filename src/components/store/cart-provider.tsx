"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import type { Product } from "@/features/catalog/types";
import { trackStoreEvent } from "@/lib/analytics";

export type CartLine = {
  key: string;
  productId: string;
  variantId: string;
  slug: string;
  title: Product["title"];
  image: Product["image"];
  price: number;
  colourCode: string;
  colourName: Product["colorName"];
  swatch: string;
  size: string;
  quantity: number;
};

type ProductSelection = { colourCode?: string; size?: string };
type StoredShop = {
  version?: number;
  cartItems?: CartLine[];
  wishlist?: string[];
};
type ShopState = {
  cart: number;
  cartItems: CartLine[];
  wishlist: string[];
  addToCart: (product: Product, selection?: ProductSelection) => void;
  removeCartItem: (key: string) => void;
  clearCart: () => void;
  toggleWishlist: (id: string) => void;
};

const ShopContext = createContext<ShopState | null>(null);

function storedShop(): { cartItems: CartLine[]; wishlist: string[] } {
  if (typeof window === "undefined") return { cartItems: [], wishlist: [] };
  try {
    const value = JSON.parse(
      window.localStorage.getItem("scrub-vibe-shop") ?? "{}",
    ) as StoredShop;
    return {
      cartItems: Array.isArray(value.cartItems) ? value.cartItems : [],
      wishlist: Array.isArray(value.wishlist) ? value.wishlist : [],
    };
  } catch {
    return { cartItems: [], wishlist: [] };
  }
}

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [initial] = useState(storedShop);
  const [cartItems, setCartItems] = useState<CartLine[]>(initial.cartItems);
  const [wishlist, setWishlist] = useState<string[]>(initial.wishlist);
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  useEffect(() => {
    window.localStorage.setItem(
      "scrub-vibe-shop",
      JSON.stringify({ version: 2, cartItems, wishlist }),
    );
  }, [cartItems, wishlist]);

  const cart = cartItems.reduce((total, line) => total + line.quantity, 0);
  const value = useMemo<ShopState>(
    () => ({
      cart: hydrated ? cart : 0,
      cartItems: hydrated ? cartItems : [],
      wishlist: hydrated ? wishlist : [],
      addToCart: (product, selection = {}) => {
        const colour =
          product.colors.find(
            (item) => item.code === selection.colourCode && item.inStock,
          ) ?? product.colors.find((item) => item.inStock);
        const size = colour?.sizes.includes(selection.size ?? "")
          ? selection.size!
          : colour?.sizes[0];
        if (!colour || !size) return;

        const key = `${product.id}:${colour.code}:${size}`;
        const variantId = colour.variants[size];
        if (!variantId) return;
        setCartItems((lines) => {
          const existing = lines.find((line) => line.key === key);
          if (existing) {
            return lines.map((line) =>
              line.key === key
                ? { ...line, quantity: line.quantity + 1 }
                : line,
            );
          }
          return [
            ...lines,
            {
              key,
              productId: product.id,
              variantId,
              slug: product.slug,
              title: product.title,
              image: product.image,
              price: product.price,
              colourCode: colour.code,
              colourName: colour.name,
              swatch: colour.swatch,
              size,
              quantity: 1,
            },
          ];
        });
        trackStoreEvent("add_to_cart", {
          productId: product.id,
          metadata: { colour: colour.code, size },
        });
      },
      removeCartItem: (key) =>
        setCartItems((lines) => lines.filter((line) => line.key !== key)),
      clearCart: () => setCartItems([]),
      toggleWishlist: (id) =>
        setWishlist((ids) => {
          const removing = ids.includes(id);
          if (!removing) trackStoreEvent("wishlist_add", { productId: id });
          return removing ? ids.filter((item) => item !== id) : [...ids, id];
        }),
    }),
    [cart, cartItems, hydrated, wishlist],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const value = useContext(ShopContext);
  if (!value) throw new Error("useShop must be used inside ShopProvider");
  return value;
}
