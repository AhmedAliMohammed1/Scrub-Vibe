"use client";

import { useState } from "react";
import { Check, Heart, Ruler } from "lucide-react";
import type { Product } from "@/features/catalog/types";
import type { Locale } from "@/lib/i18n";
import type {
  SizeCategory,
  SizeChartEntry,
} from "@/features/catalog/size-guide-types";
import { Button } from "@/components/ui/button";
import { useShop } from "./cart-provider";
import { SizeGuideDialog } from "./size-guide-dialog";

export function AddProduct({
  product,
  locale,
  sizeChartEntries = [],
  isProductOverride = false,
}: {
  product: Product;
  locale: Locale;
  sizeChartEntries?: SizeChartEntry[];
  isProductOverride?: boolean;
}) {
  const initialColour =
    product.colors.find((colour) => colour.inStock) ?? product.colors[0];
  const [colourCode, setColourCode] = useState(initialColour?.code ?? "");
  const selectedColour =
    product.colors.find((colour) => colour.code === colourCode) ??
    initialColour;
  const [size, setSize] = useState(initialColour?.sizes[0] ?? "");
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const { addToCart, toggleWishlist, wishlist } = useShop();
  const wished = wishlist.includes(product.id);
  return (
    <div className="mt-7 border-t border-black/10 pt-6">
      <div className="mb-3 flex items-center justify-between text-xs">
        <strong className="uppercase tracking-[.12em]">
          {locale === "ar" ? "اللون" : "Colour"}: {selectedColour?.name[locale]}
        </strong>
        <span className="text-neutral-600">
          {product.colors.filter((colour) => colour.inStock).length}{" "}
          {locale === "ar" ? "ألوان متاحة" : "colours available"}
        </span>
      </div>
      <div className="mb-7 flex flex-wrap gap-3" role="radiogroup" aria-label={locale === "ar" ? "اختر اللون" : "Choose a colour"}>
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
            className={`relative size-11 rounded-full border-[3px] border-white shadow-[0_0_0_1px_rgba(0,0,0,.25)] disabled:cursor-not-allowed disabled:opacity-30 ${
              colour.code === selectedColour?.code
                ? "ring-2 ring-[#0e7468] ring-offset-2"
                : ""
            }`}
            style={{ backgroundColor: colour.swatch }}
          >
            {colour.code === selectedColour?.code && <Check className="absolute inset-0 m-auto drop-shadow" size={17} strokeWidth={3} aria-hidden="true" />}
          </button>
        ))}
      </div>
      <div className="mb-3 flex justify-between text-xs">
        <strong className="uppercase tracking-[.12em]">
          {locale === "ar" ? "المقاس" : "Size"}: {size}
        </strong>
        <button
          type="button"
          onClick={() => setIsSizeGuideOpen(true)}
          className="flex items-center gap-1.5 underline transition hover:text-[#0e7468]"
        >
          <Ruler size={13} />
          {locale === "ar" ? "دليل المقاسات" : "Size guide"}
        </button>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {(selectedColour?.sizes ?? []).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSize(s)}
            aria-pressed={s === size}
            className={`min-h-12 border text-xs font-semibold ${s === size ? "border-[#073b36] bg-[#073b36] text-white" : "border-black/20 bg-white hover:border-[#0e7468]"}`}
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
      <button
        type="button"
        onClick={() => toggleWishlist(product.id)}
        aria-pressed={wished}
        className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 border border-black/15 bg-white text-xs font-semibold hover:border-[#0e7468] hover:text-[#0e7468]"
      >
        <Heart size={17} fill={wished ? "currentColor" : "none"} aria-hidden="true" />
        {wished
          ? locale === "ar" ? "تمت الإضافة إلى المفضلة" : "Saved to wishlist"
          : locale === "ar" ? "أضف إلى المفضلة" : "Add to wishlist"}
      </button>

      <SizeGuideDialog
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        entries={sizeChartEntries}
        category={(product.category as SizeCategory) || "unisex"}
        productTitle={product.title[locale]}
        isProductOverride={isProductOverride}
        availableSizes={selectedColour?.sizes ?? product.sizes}
        locale={locale}
        currentSize={size}
        onSelectSize={(newSize) => setSize(newSize)}
      />
    </div>
  );
}
