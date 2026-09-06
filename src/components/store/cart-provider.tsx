"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { trackStoreEvent } from "@/lib/analytics";

type ShopState = {
  cart: number;
  wishlist: string[];
  addToCart: (productId?: string) => void;
  toggleWishlist: (id: string) => void;
};
const ShopContext = createContext<ShopState | null>(null);

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const initial =
    typeof window === "undefined"
      ? null
      : window.localStorage.getItem("scrub-vibe-shop");
  const parsed = initial
    ? (JSON.parse(initial) as { cart: number; wishlist: string[] })
    : { cart: 0, wishlist: [] };
  const [cart, setCart] = useState(parsed.cart);
  const [wishlist, setWishlist] = useState<string[]>(parsed.wishlist);
  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  useEffect(() => {
    window.localStorage.setItem(
      "scrub-vibe-shop",
      JSON.stringify({ cart, wishlist }),
    );
  }, [cart, wishlist]);
  const value = useMemo(
    () => ({
      cart: hydrated ? cart : 0,
      wishlist: hydrated ? wishlist : [],
      addToCart: (productId?: string) => {
        setCart((n) => n + 1);
        trackStoreEvent("add_to_cart", { productId });
      },
      toggleWishlist: (id: string) =>
        setWishlist((ids) => {
          const removing = ids.includes(id);
          if (!removing) trackStoreEvent("wishlist_add", { productId: id });
          return removing ? ids.filter((item) => item !== id) : [...ids, id];
        }),
    }),
    [cart, hydrated, wishlist],
  );
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const value = useContext(ShopContext);
  if (!value) throw new Error("useShop must be used inside ShopProvider");
  return value;
}
