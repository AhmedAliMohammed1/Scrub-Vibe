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
  const initialColour =
    product.colors.find((colour) => colour.inStock) ?? product.colors[0];
  const [colourCode, setColourCode] = useState(initialColour?.code ?? "");
  const selectedColour =
    product.colors.find((colour) => colour.code === colourCode) ??
    initialColour;
  const [size, setSize] = useState(initialColour?.sizes[0] ?? "");
  const { addToCart } = useShop();
  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center justify-between text-xs">
        <strong className="uppercase tracking-[.12em]">
          {locale === "ar" ? "اللون" : "Colour"}: {selectedColour?.name[locale]}
        </strong>
        <span className="text-neutral-500">
          {product.colors.filter((colour) => colour.inStock).length}{" "}
          {locale === "ar" ? "ألوان متاحة" : "colours available"}
        </span>
      </div>
      <div className="mb-7 flex flex-wrap gap-3" role="radiogroup">
        {product.colors.map((colour) => (
          <button
            key={colour.code}
            type="button"
            role="radio"
            aria-checked={colour.code === selectedColour?.code}
            aria-label={colour.name[locale]}
            title={colour.name[locale]}
            disabled={!colour.inStock}
            onClick={() => {
              setColourCode(colour.code);
              if (!colour.sizes.includes(size)) setSize(colour.sizes[0] ?? "");
            }}
            className={`size-9 rounded-full border-[3px] border-white shadow-[0_0_0_1px_rgba(0,0,0,.22)] transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-30 ${
              colour.code === selectedColour?.code
                ? "ring-2 ring-[#0e7468] ring-offset-2"
                : ""
            }`}
            style={{ backgroundColor: colour.swatch }}
          />
        ))}
      </div>
      <div className="mb-3 flex justify-between text-xs">
        <strong className="uppercase tracking-[.12em]">
          {locale === "ar" ? "المقاس" : "Size"}: {size}
        </strong>
        <button className="underline">
          {locale === "ar" ? "دليل المقاسات" : "Size guide"}
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {(selectedColour?.sizes ?? []).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSize(s)}
            className={`h-11 border text-xs ${s === size ? "border-neutral-950 bg-neutral-950 text-white" : "border-black/20"}`}
          >
            {s}
          </button>
        ))}
      </div>
      <Button
        disabled={!selectedColour?.inStock || !size}
        onClick={() =>
          addToCart(product, { colourCode: selectedColour?.code, size })
        }
        className="mt-4 w-full"
      >
        {locale === "ar" ? "أضف إلى الحقيبة" : "Add to bag"}
      </Button>
    </div>
  );
}
