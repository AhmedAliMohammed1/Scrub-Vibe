"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { X, BellRing, CheckCircle2, AlertCircle, LoaderCircle } from "lucide-react";
import type { Product } from "@/features/catalog/types";
import type { Locale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  locale: Locale;
  initialColourCode?: string;
  initialSize?: string;
};

export function StockNotifyDialog({
  isOpen,
  onClose,
  product,
  locale,
  initialColourCode,
  initialSize,
}: Props) {
  const ar = locale === "ar";
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // All out-of-stock variants
  const outOfStockOptions = useMemo(() => {
    return product.colors.flatMap((colour) => {
      const allVariantEntries = Object.entries(colour.allVariants);
      return allVariantEntries
        .filter(([size]) => (colour.stockBySize[size] ?? 0) <= 0)
        .map(([size, variantId]) => ({
          variantId,
          colourCode: colour.code,
          colourName: colour.name[locale],
          swatch: colour.swatch,
          size,
          label: `${colour.name[locale]} · ${size}`,
        }));
    });
  }, [product.colors, locale]);

  const defaultVariantId = useMemo(() => {
    const match = outOfStockOptions.find(
      (opt) =>
        opt.colourCode === initialColourCode && opt.size === initialSize,
    );
    return match?.variantId ?? outOfStockOptions[0]?.variantId ?? "";
  }, [outOfStockOptions, initialColourCode, initialSize]);

  const [selectedVariantOverride, setSelectedVariantOverride] = useState<string | null>(null);
  const selectedVariantId = selectedVariantOverride ?? defaultVariantId;

  // Try auto-filling user email if authenticated
  useEffect(() => {
    if (!isOpen || email) return;
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        if (data.user?.email) {
          setEmail(data.user.email);
        }
      });
    } catch {
      // Ignore if unauthenticated or offline
    }
  }, [isOpen, email]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const activeOption = outOfStockOptions.find(
    (opt) => opt.variantId === selectedVariantId,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      const response = await fetch("/api/stock/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          variantId: selectedVariantId || undefined,
          email: email.trim().toLowerCase(),
          locale,
        }),
      });

      const body = (await response.json().catch(() => ({}))) as {
        message?: string;
      };

      if (response.ok) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage(
          body.message ??
            (ar
              ? "تعذر حفظ التنبيه. حاول مرة أخرى."
              : "Could not save the alert. Please try again."),
        );
      }
    } catch {
      setStatus("error");
      setErrorMessage(
        ar
          ? "حدث خطأ في الاتصال. يرجى المحاولة لاحقاً."
          : "Connection error. Please try again later.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="stock-notify-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Card */}
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xs border border-black/10 bg-white shadow-2xl">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-black/10 bg-[#062f2b] px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <BellRing size={20} className="text-emerald-300" />
            <h2 id="stock-notify-title" className="font-serif text-xl font-bold">
              {ar ? "أخبرني عند توفر المقاس" : "Notify Me When Available"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={ar ? "إغلاق" : "Close"}
            className="grid size-8 place-items-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </header>

        {/* Content Body */}
        <div className="overflow-y-auto p-6">
          {status === "success" ? (
            <div className="py-6 text-center">
              <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-emerald-50 text-emerald-700">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="font-serif text-2xl font-bold text-neutral-900">
                {ar ? "تم تفعيل التنبيه بنجاح!" : "Alert Activated Successfully!"}
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-600">
                {ar ? (
                  <>
                    سنرسل لك رسالة على{" "}
                    <strong className="text-neutral-900">{email}</strong> فور
                    توفر اختيارك (
                    {activeOption ? activeOption.label : product.title[locale]}
                    ) بالمخزون.
                  </>
                ) : (
                  <>
                    We’ll email{" "}
                    <strong className="text-neutral-900">{email}</strong> the
                    moment your selection (
                    {activeOption ? activeOption.label : product.title[locale]}
                    ) returns to stock.
                  </>
                )}
              </p>
              <p className="mt-4 text-xs text-neutral-400">
                {ar
                  ? "رسالة واحدة فقط وبدون أي إعلانات مزعجة."
                  : "Single notification only. Zero marketing spam."}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-6 inline-flex h-11 items-center justify-center rounded-xs bg-[#073b36] px-8 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#0e7468]"
              >
                {ar ? "تم، شكراً لك" : "Done, thank you"}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Product preview card */}
              <div className="flex items-center gap-4 rounded-xs border border-black/10 bg-[#fafafa] p-3.5">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-xs border border-black/5 bg-neutral-100">
                  <Image
                    src={product.image.src}
                    alt={product.image.alt[locale]}
                    fill
                    sizes="64px"
                    className="object-cover object-top"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-neutral-900">
                    {product.title[locale]}
                  </p>
                  {activeOption && (
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-600">
                      <span className="flex items-center gap-1">
                        <span
                          className="size-2.5 rounded-full border border-black/20"
                          style={{ backgroundColor: activeOption.swatch }}
                        />
                        <span>{activeOption.colourName}</span>
                      </span>
                      <span>·</span>
                      <span className="rounded-xs border border-black/15 bg-white px-1.5 py-0.5 font-mono text-[11px] font-bold">
                        {activeOption.size}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Variant choice */}
              {outOfStockOptions.length > 1 && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                    {ar ? "اللون والمقاس المطلوب" : "Select Sold-out Colour & Size"}
                  </label>
                  <select
                    value={selectedVariantId}
                    onChange={(e) => setSelectedVariantOverride(e.target.value)}
                    className="h-11 w-full rounded-xs border border-black/20 bg-white px-3 text-xs text-neutral-800 outline-hidden focus:border-[#0e7468] focus:ring-2 focus:ring-[#0e7468]/15"
                  >
                    {outOfStockOptions.map((opt) => (
                      <option key={opt.variantId} value={opt.variantId}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Email input */}
              <div>
                <label
                  htmlFor="stock-notify-email"
                  className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5"
                >
                  {ar ? "عنوان بريدك الإلكتروني" : "Your Email Address"}
                </label>
                <input
                  id="stock-notify-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@example.com"
                  className="h-11 w-full rounded-xs border border-black/20 bg-white px-3.5 text-sm text-neutral-900 placeholder:text-neutral-400 outline-hidden transition focus:border-[#0e7468] focus:ring-2 focus:ring-[#0e7468]/15"
                />
                <p className="mt-1.5 text-[11px] text-neutral-500">
                  {ar
                    ? "سنرسل لك رسالة واحدة فقط فور توفر هذا المقاس واللون في المخزون."
                    : "We’ll send one email the moment this exact selection is back in stock."}
                </p>
              </div>

              {/* Error feedback */}
              {status === "error" && (
                <div className="flex items-center gap-2 rounded-xs border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                  <AlertCircle size={15} className="shrink-0 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="h-11 rounded-xs border border-black/15 bg-white px-5 text-xs font-bold uppercase tracking-wider text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
                >
                  {ar ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !email.trim()}
                  className="flex h-11 items-center justify-center gap-2 rounded-xs bg-[#073b36] px-6 text-xs font-bold uppercase tracking-wider text-white shadow-xs transition hover:bg-[#0e7468] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <LoaderCircle size={16} className="animate-spin" />
                      <span>{ar ? "جارٍ الحفظ…" : "Saving alert…"}</span>
                    </>
                  ) : (
                    <>
                      <BellRing size={16} />
                      <span>{ar ? "تفعيل التنبيه" : "Set Alert"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
