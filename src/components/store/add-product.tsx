"use client";

import { useState } from "react";
import { Check, Heart, Ruler, ShoppingBag } from "lucide-react";
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
  selectedColourCode: controlledColourCode,
  onSelectColourCode,
}: {
  product: Product;
  locale: Locale;
  sizeChartEntries?: SizeChartEntry[];
  isProductOverride?: boolean;
  selectedColourCode?: string;
  onSelectColourCode?: (code: string) => void;
}) {
  const initialColour =
    product.colors.find((colour) => colour.inStock) ?? product.colors[0];
  const [internalColourCode, setInternalColourCode] = useState(initialColour?.code ?? "");
  const colourCode =
    controlledColourCode !== undefined ? controlledColourCode : internalColourCode;
  const setColourCode = (code: string) => {
    setInternalColourCode(code);
    onSelectColourCode?.(code);
  };
  const selectedColour =
    product.colors.find((colour) => colour.code === colourCode) ??
    initialColour;
  const [selectedSize, setSelectedSize] = useState(initialColour?.sizes[0] ?? "");
  const size = selectedColour?.sizes.includes(selectedSize)
    ? selectedSize
    : (selectedColour?.sizes[0] ?? "");
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { addToCart, toggleWishlist, wishlist } = useShop();
  const wished = wishlist.includes(product.id);
  const ar = locale === "ar";

  const handleAddToCart = () => {
    setIsAdding(true);
    addToCart(product, { colourCode: selectedColour?.code, size });
    setTimeout(() => setIsAdding(false), 1200);
  };

  return (
    <div className="mt-8 border-t border-[var(--border-subtle)] pt-6">
      {/* Color Swatches */}
      <div>
        <div className="mb-3 flex items-center justify-between text-xs">
          <strong className="font-bold uppercase tracking-[.14em] text-[var(--text-strong)]">
            {ar ? "اللون المختار" : "Selected colour"}:{" "}
            <span className="font-normal text-[#0e7468]">
              {selectedColour?.name[locale]}
            </span>
          </strong>
          <span className="text-xs text-[var(--text-muted)]">
            {product.colors.filter((colour) => colour.inStock).length}{" "}
            {ar ? "ألوان متوفرة" : "colours in stock"}
          </span>
        </div>

        <div
          className="mb-8 flex flex-wrap gap-3"
          role="radiogroup"
          aria-label={ar ? "اختر اللون" : "Choose colour"}
        >
          {product.colors.map((colour) => {
            const isSelected = colour.code === selectedColour?.code;
            return (
              <button
                key={colour.code}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={colour.name[locale]}
                title={colour.name[locale]}
                disabled={!colour.inStock}
                onClick={() => {
                  setColourCode(colour.code);
                  if (!colour.sizes.includes(size)) {
                    setSelectedSize(colour.sizes[0] ?? "");
                  }
                }}
                className={`relative size-11 rounded-full border-2 border-white shadow-xs transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-30 ${
                  isSelected
                    ? "ring-2 ring-[#0e7468] ring-offset-2 ring-offset-white"
                    : "shadow-[0_0_0_1px_rgba(0,0,0,.15)]"
                }`}
                style={{ backgroundColor: colour.swatch }}
              >
                {isSelected && (
                  <Check
                    className="absolute inset-0 m-auto drop-shadow-sm"
                    size={17}
                    strokeWidth={2.6}
                    color="#ffffff"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Size Selection */}
      <div>
        <div className="mb-3 flex items-center justify-between text-xs">
          <strong className="font-bold uppercase tracking-[.14em] text-[var(--text-strong)]">
            {ar ? "المقاس" : "Size"}:{" "}
            <span className="font-normal text-[#0e7468]">{size}</span>
          </strong>
          <button
            type="button"
            onClick={() => setIsSizeGuideOpen(true)}
            className="flex items-center gap-1.5 font-bold uppercase tracking-[.12em] text-[#073b36] underline underline-offset-4 transition hover:text-[#0e7468]"
          >
            <Ruler size={14} aria-hidden="true" />
            {ar ? "دليل وحاسبة المقاسات" : "Interactive size guide"}
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6">
          {(selectedColour?.sizes ?? product.sizes).map((s) => {
            const isSelected = s === size;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSelectedSize(s)}
                aria-pressed={isSelected}
                className={`min-h-12 rounded-xs border text-xs font-bold transition ${
                  isSelected
                    ? "border-[#073b36] bg-[#073b36] text-white shadow-xs"
                    : "border-[var(--border-subtle)] bg-white text-[var(--text-strong)] hover:border-[#0e7468] hover:bg-[#f0f5f3]"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="mt-8 space-y-3">
        <Button
          type="button"
          disabled={!selectedColour?.inStock || !size}
          onClick={handleAddToCart}
          className={`w-full text-xs tracking-[.14em] shadow-sm ${
            isAdding ? "bg-[#18794e] hover:bg-[#18794e]" : ""
          }`}
        >
          {isAdding ? (
            <span className="flex items-center gap-2">
              <Check size={18} strokeWidth={2.5} />
              {ar ? "تمت الإضافة للحقيبة بنجاح" : "Added to your bag"}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <ShoppingBag size={18} strokeWidth={2} />
              {ar ? "إضافة إلى حقيبة التسوق" : "Add to shopping bag"}
            </span>
          )}
        </Button>

        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          aria-pressed={wished}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xs border border-[var(--border-subtle)] bg-white text-xs font-bold uppercase tracking-[.14em] text-[var(--text-strong)] transition hover:border-[#0e7468] hover:bg-[#f0f5f3]"
        >
          <Heart
            size={18}
            strokeWidth={1.8}
            fill={wished ? "currentColor" : "none"}
            className={wished ? "text-[#a5472f]" : "text-[var(--text-strong)]"}
            aria-hidden="true"
          />
          {wished
            ? ar
              ? "محفوظ في قائمة الأمنيات"
              : "Saved in your wishlist"
            : ar
              ? "إضافة إلى قائمة الأمنيات"
              : "Save to wishlist"}
        </button>
      </div>

      {/* Size Guide Modal */}
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
        onSelectSize={(newSize) => setSelectedSize(newSize)}
      />
    </div>
  );
}
