import type { Product } from "@/features/catalog/types";

export type CartLine = {
  key: string;
  productId: string;
  variantId: string;
  slug: string;
  title: Product["title"];
  image: Product["image"];
  price: number;
  codDeposit: number;
  colourCode: string;
  colourName: Product["colorName"];
  swatch: string;
  size: string;
  quantity: number;
  availableStock?: number;
};

export type CartItemInput = {
  variantId: string;
  quantity: number;
};

export type SyncPayload = {
  cart: CartItemInput[];
  wishlist: string[];
};

export type SyncResponse = {
  cart: CartLine[];
  wishlist: string[];
};
