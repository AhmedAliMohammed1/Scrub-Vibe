"use client";
import { use } from "react";
import { useShop } from "@/components/store/cart-provider";
export default function WishlistPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const { wishlist } = useShop();
  return (
    <main className="mx-auto min-h-[60vh] max-w-3xl px-5 py-20">
      <p className="eyebrow">SCRUB VIBE SAVED</p>
      <h1 className="mt-4 font-serif text-6xl">
        {locale === "ar" ? "المفضلة" : "Wishlist"}
      </h1>
      <p className="mt-10 border-y border-black/15 py-10">
        {wishlist.length} {locale === "ar" ? "قطع محفوظة" : "saved pieces"}
      </p>
    </main>
  );
}
