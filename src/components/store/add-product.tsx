"use client";
import { useState } from "react";
import type { Product } from "@/features/catalog/types";
import type { Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { useShop } from "./cart-provider";

export function AddProduct({
  product,
  locale,
}: {
  product: Product;
  locale: Locale;
}) {
  const [size, setSize] = useState(product.sizes[0]);
  const { addToCart } = useShop();
  return (
    <div className="mt-8">
      <div className="mb-3 flex justify-between text-xs">
        <strong className="uppercase tracking-[.12em]">
          {locale === "ar" ? "المقاس" : "Size"}: {size}
        </strong>
        <button className="underline">
          {locale === "ar" ? "دليل المقاسات" : "Size guide"}
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {product.sizes.map((s) => (
          <button
            key={s}
            onClick={() => setSize(s)}
            className={`h-11 border text-xs ${s === size ? "border-neutral-950 bg-neutral-950 text-white" : "border-black/20"}`}
          >
            {s}
          </button>
        ))}
      </div>
      <Button onClick={() => addToCart(product.id)} className="mt-4 w-full">
        {locale === "ar" ? "أضف إلى الحقيبة" : "Add to bag"}
      </Button>
    </div>
  );
}
