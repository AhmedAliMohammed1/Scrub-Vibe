"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

type ShopState = {
  cart: number;
  wishlist: string[];
  addToCart: () => void;
  toggleWishlist: (id: string) => void;
};
const ShopContext = createContext<ShopState | null>(null);

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const initial =
    typeof window === "undefined"
      ? null
      : window.localStorage.getItem("nova-shop");
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
      "nova-shop",
      JSON.stringify({ cart, wishlist }),
    );
  }, [cart, wishlist]);
  const value = useMemo(
    () => ({
      cart: hydrated ? cart : 0,
      wishlist: hydrated ? wishlist : [],
      addToCart: () => setCart((n) => n + 1),
      toggleWishlist: (id: string) =>
        setWishlist((ids) =>
          ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id],
        ),
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
