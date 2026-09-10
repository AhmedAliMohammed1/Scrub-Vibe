"use client";

import { useState, useMemo } from "react";
import { BellRing, Check, Heart, Ruler, ShoppingBag } from "lucide-react";
import type { Product } from "@/features/catalog/types";
import type { Locale } from "@/lib/i18n";
import type {
  SizeCategory,
  SizeChartEntry,
} from "@/features/catalog/size-guide-types";
import { Button } from "@/components/ui/button";
import { useShop } from "./cart-provider";
import { SizeGuideDialog } from "./size-guide-dialog";
import { StockNotifyDialog } from "./stock-notify-dialog";

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
  const [internalColourCode, setInternalColourCode] = useState(
    initialColour?.code ?? "",
  );
  const colourCode =
    controlledColourCode !== undefined
      ? controlledColourCode
      : internalColourCode;
  const setColourCode = (code: string) => {
    setInternalColourCode(code);
    onSelectColourCode?.(code);
  };
  const selectedColour =
    product.colors.find((colour) => colour.code === colourCode) ??
    initialColour;

  // All sizes configured for this colourway (or product fallback)
  const allSizes = useMemo(() => {
    if (selectedColour) {
      const variantSizes = Object.keys(selectedColour.allVariants);
      if (variantSizes.length > 0) return variantSizes;
      const stockSizes = Object.keys(selectedColour.stockBySize);
      if (stockSizes.length > 0) return stockSizes;
      if (selectedColour.sizes.length > 0) return selectedColour.sizes;
    }
    return product.sizes;
  }, [selectedColour, product.sizes]);

  const [selectedSize, setSelectedSize] = useState(() => {
    return (
      initialColour?.sizes[0] ??
      (initialColour ? Object.keys(initialColour.allVariants)[0] : "") ??
      product.sizes[0] ??
      ""
    );
  });

  const size = allSizes.includes(selectedSize)
    ? selectedSize
    : (allSizes[0] ?? "");

  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isNotifyDialogOpen, setIsNotifyDialogOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { addToCart, toggleWishlist, wishlist } = useShop();
  const wished = wishlist.includes(product.id);
  const ar = locale === "ar";

  const isSizeInStock = (s: string) => {
    if (!selectedColour) return false;
    if (
      selectedColour.stockBySize &&
      typeof selectedColour.stockBySize[s] === "number"
    ) {
      return selectedColour.stockBySize[s] > 0;
    }
    return selectedColour.sizes.includes(s);
  };

  const isCurrentSelectionInStock = Boolean(
    selectedColour?.inStock && size && isSizeInStock(size),
  );

  const handleAddToCart = () => {
    if (!isCurrentSelectionInStock) return;
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
                aria-label={
                  colour.inStock
                    ? colour.name[locale]
                    : `${colour.name[locale]} (${ar ? "نفد المخزون" : "Out of stock"})`
                }
                title={
                  colour.inStock
                    ? colour.name[locale]
                    : `${colour.name[locale]} (${ar ? "نفد المخزون" : "Out of stock"})`
                }
                onClick={() => {
                  setColourCode(colour.code);
                  const newSizes =
                    Object.keys(colour.allVariants).length > 0
                      ? Object.keys(colour.allVariants)
                      : colour.sizes.length > 0
                        ? colour.sizes
                        : product.sizes;
                  if (!newSizes.includes(selectedSize)) {
                    setSelectedSize(newSizes[0] ?? "");
                  }
                }}
                className={`relative size-11 rounded-full border-2 border-white shadow-xs transition hover:scale-105 ${
                  isSelected
                    ? "ring-2 ring-[#0e7468] ring-offset-2 ring-offset-white"
                    : "shadow-[0_0_0_1px_rgba(0,0,0,.15)]"
                }`}
                style={{ backgroundColor: colour.swatch }}
              >
                {!colour.inStock && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 m-auto h-[2px] w-[80%] -rotate-45 bg-black/50 shadow-2xs"
                  />
                )}
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
            {!isCurrentSelectionInStock && size && (
              <span className="ms-2 rounded-xs border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                {ar ? "غير متوفر" : "Sold out"}
              </span>
            )}
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
          {allSizes.map((s) => {
            const isSelected = s === size;
            const inStock = isSizeInStock(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSelectedSize(s)}
                aria-pressed={isSelected}
                aria-label={
                  inStock
                    ? s
                    : `${s} (${ar ? "نفد المخزون - اضغط للتنبيه" : "Out of stock - click to notify"})`
                }
                title={
                  inStock
                    ? undefined
                    : ar
                      ? "غير متوفر حالياً"
                      : "Currently out of stock"
                }
                className={`relative min-h-12 overflow-hidden rounded-xs border text-xs font-bold transition ${
                  isSelected
                    ? inStock
                      ? "border-[#073b36] bg-[#073b36] text-white shadow-xs"
                      : "border-[#0e7468] bg-[#f0f5f3] text-[#073b36] ring-2 ring-[#0e7468]/20 shadow-xs"
                    : inStock
                      ? "border-[var(--border-subtle)] bg-white text-[var(--text-strong)] hover:border-[#0e7468] hover:bg-[#f0f5f3]"
                      : "border-dashed border-neutral-300 bg-neutral-50/60 text-neutral-400 hover:border-neutral-400 hover:text-neutral-700"
                }`}
              >
                {!inStock && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-2 top-1/2 h-[1px] -rotate-12 bg-neutral-400/50"
                  />
                )}
                <span className="relative z-10">{s}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Action Buttons */}
      <div className="mt-8 space-y-3">
        {isCurrentSelectionInStock ? (
          <Button
            type="button"
            disabled={!size}
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
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setIsNotifyDialogOpen(true)}
              className="flex min-h-12 w-full items-center justify-center gap-2.5 rounded-xs bg-[#062f2b] px-6 text-xs font-bold uppercase tracking-[.14em] text-white shadow-xs transition hover:bg-[#0e7468] focus:ring-2 focus:ring-[#0e7468]/30"
            >
              <BellRing size={17} className="text-emerald-300" />
              <span>
                {ar ? "أخبرني عند توفر هذا المقاس" : "Notify me when available"}
              </span>
            </button>
            <p className="text-center text-[11px] text-neutral-500">
              {ar
                ? "هذا المقاس أو اللون غير متوفر حالياً. اضغط أعلاه لتصلك رسالة فور توفره."
                : "This size or colour is currently out of stock. Tap above to get alerted the moment it arrives."}
            </p>
          </div>
        )}

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

      {/* Stock Notification Modal */}
      {isNotifyDialogOpen && (
        <StockNotifyDialog
          key={`${selectedColour?.code}-${size}`}
          isOpen={isNotifyDialogOpen}
          onClose={() => setIsNotifyDialogOpen(false)}
          product={product}
          locale={locale}
          initialColourCode={selectedColour?.code}
          initialSize={size}
        />
      )}
    </div>
  );
}
