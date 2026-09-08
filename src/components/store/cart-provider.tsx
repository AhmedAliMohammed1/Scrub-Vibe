"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { Product } from "@/features/catalog/types";
import type { CartLine } from "@/features/cart/types";
import {
  clearCartAction,
  removeCartItemAction,
  syncCartAndWishlistAction,
  toggleWishlistItemAction,
  updateCartItemQuantityAction,
} from "@/features/cart/actions";
import { trackStoreEvent } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/client";

export type { CartLine };

type ProductSelection = { colourCode?: string; size?: string };
type StoredShop = {
  version?: number;
  cartItems?: CartLine[];
  wishlist?: string[];
};

export type ShopState = {
  cart: number;
  cartItems: CartLine[];
  wishlist: string[];
  addToCart: (product: Product, selection?: ProductSelection) => void;
  updateQuantity: (key: string, delta: number) => void;
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const cartItemsRef = useRef(cartItems);
  const wishlistRef = useRef(wishlist);
  const lastSyncedUserIdRef = useRef<string | null>(null);
  const isSyncingRef = useRef<boolean>(false);

  useEffect(() => {
    cartItemsRef.current = cartItems;
  }, [cartItems]);

  useEffect(() => {
    wishlistRef.current = wishlist;
  }, [wishlist]);

  const hydrated = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  // Sync to local storage for guest / fallback support
  useEffect(() => {
    try {
      window.localStorage.setItem(
        "scrub-vibe-shop",
        JSON.stringify({ version: 2, cartItems, wishlist }),
      );
    } catch {
      // LocalStorage unavailable (e.g. private mode quota)
    }
  }, [cartItems, wishlist]);

  // Handle Supabase Auth & Synchronization
  useEffect(() => {
    let active = true;
    const supabase = createClient();

    const doSync = async (userId: string, isInitialMerge: boolean) => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      try {
        // Only ingest local cart lines on initial transition from guest -> authenticated
        const localCart = isInitialMerge
          ? cartItemsRef.current.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
            }))
          : [];
        const localWishlist = isInitialMerge ? wishlistRef.current : [];

        const res = await syncCartAndWishlistAction(localCart, localWishlist);
        if (res && active) {
          lastSyncedUserIdRef.current = userId;
          setCartItems(res.cart);
          setWishlist(res.wishlist);
        }
      } catch (err) {
        console.error("[cart/sync] Synchronization failed", err);
      } finally {
        isSyncingRef.current = false;
      }
    };

    const handleAuthUser = (userId: string) => {
      setIsAuthenticated(true);
      const isNewUser = lastSyncedUserIdRef.current !== userId;
      if (isNewUser) {
        doSync(userId, true);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      if (session?.user) {
        handleAuthUser(session.user.id);
      } else {
        setIsAuthenticated(false);
        lastSyncedUserIdRef.current = null;
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (
        (event === "SIGNED_IN" || event === "INITIAL_SESSION") &&
        session?.user
      ) {
        handleAuthUser(session.user.id);
      } else if (event === "SIGNED_OUT") {
        setIsAuthenticated(false);
        lastSyncedUserIdRef.current = null;
        setCartItems([]);
        setWishlist([]);
        try {
          window.localStorage.removeItem("scrub-vibe-shop");
        } catch {
          // ignore
        }
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const addToCart = useCallback(
    (product: Product, selection: ProductSelection = {}) => {
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

      let nextQuantity = 1;

      setCartItems((lines) => {
        const existing = lines.find((line) => line.key === key);
        if (existing) {
          nextQuantity = Math.min(10, existing.quantity + 1);
          return lines.map((line) =>
            line.key === key
              ? {
                  ...line,
                  quantity: nextQuantity,
                  price: product.price,
                  codDeposit: product.codDeposit,
                  title: product.title,
                  image: product.image,
                }
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
            codDeposit: product.codDeposit,
            colourCode: colour.code,
            colourName: colour.name,
            swatch: colour.swatch,
            size,
            quantity: 1,
          },
        ];
      });

      if (isAuthenticated) {
        updateCartItemQuantityAction(variantId, nextQuantity).catch((err) =>
          console.error("[cart/add] Background save failed", err),
        );
      }

      trackStoreEvent("add_to_cart", {
        productId: product.id,
        metadata: { colour: colour.code, size },
      });
    },
    [isAuthenticated],
  );

  const updateQuantity = useCallback(
    (key: string, delta: number) => {
      let targetVariantId: string | null = null;
      let finalQty = 1;

      setCartItems((lines) => {
        const target = lines.find((line) => line.key === key);
        if (!target) return lines;
        targetVariantId = target.variantId;
        finalQty = target.quantity + delta;

        if (finalQty <= 0) {
          return lines.filter((line) => line.key !== key);
        }

        const clamped = Math.min(10, finalQty);
        finalQty = clamped;
        return lines.map((line) =>
          line.key === key ? { ...line, quantity: clamped } : line,
        );
      });

      if (isAuthenticated && targetVariantId) {
        if (finalQty <= 0) {
          removeCartItemAction(targetVariantId).catch((err) =>
            console.error("[cart/remove] Background delete failed", err),
          );
        } else {
          updateCartItemQuantityAction(targetVariantId, finalQty).catch((err) =>
            console.error("[cart/update] Background update failed", err),
          );
        }
      }
    },
    [isAuthenticated],
  );

  const removeCartItem = useCallback(
    (key: string) => {
      let targetVariantId: string | null = null;
      setCartItems((lines) => {
        const found = lines.find((line) => line.key === key);
        if (found) targetVariantId = found.variantId;
        return lines.filter((line) => line.key !== key);
      });

      if (isAuthenticated && targetVariantId) {
        removeCartItemAction(targetVariantId).catch((err) =>
          console.error("[cart/remove] Background delete failed", err),
        );
      }
    },
    [isAuthenticated],
  );

  const clearCart = useCallback(() => {
    setCartItems([]);
    if (isAuthenticated) {
      clearCartAction().catch((err) =>
        console.error("[cart/clear] Background clear failed", err),
      );
    }
  }, [isAuthenticated]);

  const toggleWishlist = useCallback(
    (id: string) => {
      setWishlist((ids) => {
        const removing = ids.includes(id);
        if (!removing) trackStoreEvent("wishlist_add", { productId: id });
        return removing ? ids.filter((item) => item !== id) : [...ids, id];
      });

      if (isAuthenticated) {
        toggleWishlistItemAction(id).catch((err) =>
          console.error("[wishlist/toggle] Background toggle failed", err),
        );
      }
    },
    [isAuthenticated],
  );

  const cart = cartItems.reduce((total, line) => total + line.quantity, 0);

  const value = useMemo<ShopState>(
    () => ({
      cart: hydrated ? cart : 0,
      cartItems: hydrated ? cartItems : [],
      wishlist: hydrated ? wishlist : [],
      addToCart,
      updateQuantity,
      removeCartItem,
      clearCart,
      toggleWishlist,
    }),
    [
      addToCart,
      cart,
      cartItems,
      clearCart,
      hydrated,
      removeCartItem,
      toggleWishlist,
      updateQuantity,
      wishlist,
    ],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const value = useContext(ShopContext);
  if (!value) throw new Error("useShop must be used inside ShopProvider");
  return value;
}
