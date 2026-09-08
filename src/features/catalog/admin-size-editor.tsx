"use client";

import { useState } from "react";
import { Ruler, Check, RotateCcw } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { SizeCategory, SizeChartEntry } from "./size-guide-types";
import type { AdminSizeChartOverview } from "./size-guide-repository";
import {
  upsertSizeChartEntryAction,
  resetProductSizeChartToDefaultsAction,
} from "./size-guide-admin-actions";

type Props = {
  overview: AdminSizeChartOverview;
  locale: Locale;
  activeTab?: string;
};

export function AdminSizeEditor({ overview, locale, activeTab: initialTab }: Props) {
  const ar = locale === "ar";
  const [selectedTab, setSelectedTab] = useState<SizeCategory | "products">(
    (initialTab as SizeCategory | "products") || "women",
  );
  const [selectedProductId, setSelectedProductId] = useState<number>(
    overview.allProducts[0]?.id || 0,
  );

  const currentCategoryEntries =
    selectedTab !== "products"
      ? overview.categoryDefaults[selectedTab] || []
      : [];

  const selectedProduct = overview.allProducts.find(
    (p) => p.id === selectedProductId,
  );
  const selectedProductOverride = overview.productOverrides.find(
    (o) => o.productId === selectedProductId,
  );

  const productCategory =
    (selectedProduct?.gender as SizeCategory) || "unisex";
  const productEntriesToDisplay =
    selectedProductOverride?.entries ||
    overview.categoryDefaults[productCategory] ||
    [];

  return (
    <div className="grid gap-8">
      {/* Category Tabs */}
      <nav className="flex flex-wrap gap-2 border-b border-black/10 pb-4">
        {[
          { key: "women", label: ar ? "مجموعة السيدات (Women)" : "Women's Collection" },
          { key: "men", label: ar ? "مجموعة الرجال (Men)" : "Men's Collection" },
          { key: "unisex", label: ar ? "المجموعة الموحدة (Unisex)" : "Unisex Collection" },
          { key: "products", label: ar ? "تخصيص لمنتج محدد" : "Product Overrides" },
        ].map((tab) => {
          const isActive = selectedTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSelectedTab(tab.key as typeof selectedTab)}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-[.12em] transition ${
                isActive
                  ? "bg-[#062f2b] text-white shadow"
                  : "border border-black/10 bg-white text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Standard Category Tables */}
      {selectedTab !== "products" ? (
        <section className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 border border-black/10">
            <div>
              <h2 className="font-serif text-2xl">
                {selectedTab === "women"
                  ? ar
                    ? "القياسات القياسية لمجموعة السيدات"
                    : "Standard Women's Sizing"
                  : selectedTab === "men"
                    ? ar
                      ? "القياسات القياسية لمجموعة الرجال"
                      : "Standard Men's Sizing"
                    : ar
                      ? "القياسات القياسية للمجموعة الموحدة"
                      : "Standard Unisex Sizing"}
              </h2>
              <p className="mt-1 text-xs text-neutral-500">
                {ar
                  ? "تنطبق هذه القياسات تلقائياً على كل منتجات هذه الفئة ما لم يتم تخصيص جدول خاص لمنتج معين."
                  : "These measurements apply to all products in this category unless a product-specific override is configured."}
              </p>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[#0e7468]">
              <Ruler size={16} />
              {ar ? "كل القياسات بالسنتيمتر (سم)" : "All values in centimeters (cm)"}
            </span>
          </div>

          <div className="grid gap-4">
            {currentCategoryEntries.map((entry) => (
              <SizeRowForm
                key={`${entry.category}-${entry.size}-${entry.productId ?? 0}`}
                entry={entry}
                locale={locale}
                redirectTab={selectedTab}
              />
            ))}
          </div>
        </section>
      ) : (
        /* Product Override Tab */
        <section className="grid gap-6">
          <div className="border border-black/10 bg-white p-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="w-full max-w-md">
                <label className="block text-[10px] font-bold uppercase tracking-[.12em] text-neutral-500">
                  {ar ? "اختر المنتج لتخصيص مقاساته" : "Select product to customize"}
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(Number(e.target.value))}
                  className="mt-2 h-11 w-full border border-black/20 bg-white px-3 text-xs font-semibold"
                >
                  {overview.allProducts.map((prod) => (
                    <option key={prod.id} value={prod.id}>
                      {ar ? prod.titleAr : prod.titleEn} (
                      {prod.gender || "unisex"})
                      {prod.hasOverride
                        ? ar
                          ? " — [مقاسات مخصصة]"
                          : " — [Custom Sizing]"
                        : ar
                          ? " — (المقاس القياسي)"
                          : " — (Collection Default)"}
                    </option>
                  ))}
                </select>
              </div>

              {selectedProductOverride ? (
                <form action={resetProductSizeChartToDefaultsAction}>
                  <input type="hidden" name="productId" value={selectedProductId} />
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="redirectTab" value="products" />
                  <button
                    type="submit"
                    className="flex h-11 items-center gap-2 border border-rose-300 bg-rose-50 px-4 text-xs font-bold text-rose-800 hover:bg-rose-100"
                  >
                    <RotateCcw size={14} />
                    {ar ? "استعادة القياسات القياسية للمنتج" : "Reset to Collection Defaults"}
                  </button>
                </form>
              ) : (
                <span className="rounded bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 border border-emerald-200">
                  ✓ {ar ? "يستخدم حالياً المقاسات القياسية للمجموعة" : "Currently using standard collection sizing"}
                </span>
              )}
            </div>

            <p className="mt-3 text-xs text-neutral-500">
              {ar
                ? "تعديل أي قياس أدناه سيحفظ نسخة مخصصة فريدة لهذا المنتج دون التأثير على بقية المنتجات."
                : "Saving changes below will create a dedicated size chart exclusively for this product."}
            </p>
          </div>

          <div className="grid gap-4">
            {productEntriesToDisplay.map((entry) => (
              <SizeRowForm
                key={`override-${selectedProductId}-${entry.size}`}
                entry={{
                  ...entry,
                  productId: selectedProductId,
                }}
                locale={locale}
                redirectTab="products"
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SizeRowForm({
  entry,
  locale,
  redirectTab,
}: {
  entry: SizeChartEntry;
  locale: Locale;
  redirectTab: string;
}) {
  const ar = locale === "ar";

  return (
    <form
      action={upsertSizeChartEntryAction}
      className={`border bg-white p-4 transition md:p-5 ${
        entry.productId ? "border-[#0e7468]/30 shadow-sm" : "border-black/10"
      }`}
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="redirectTab" value={redirectTab} />
      <input type="hidden" name="id" value={entry.id && !entry.id.startsWith("default-") ? entry.id : ""} />
      <input type="hidden" name="productId" value={entry.productId ?? ""} />
      <input type="hidden" name="category" value={entry.category} />
      <input type="hidden" name="size" value={entry.size} />
      <input type="hidden" name="sortOrder" value={entry.sortOrder} />

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/5 pb-3">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded bg-[#062f2b] font-serif text-base font-bold text-white">
            {entry.size}
          </span>
          <div>
            <strong className="text-xs uppercase tracking-[.1em]">
              {ar ? `المقاس ${entry.size}` : `Size ${entry.size}`}
            </strong>
            <span className="ms-2 text-[10px] text-neutral-400">
              ({entry.category})
            </span>
          </div>
        </div>

        <button
          type="submit"
          className="flex h-9 items-center gap-1.5 bg-[#0e7468] px-4 text-[10px] font-bold uppercase tracking-[.12em] text-white transition hover:bg-[#073b36]"
        >
          <Check size={13} />
          {ar ? "حفظ التعديل" : "Save size"}
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Chest Range */}
        <div className="rounded border border-black/10 bg-[#f9faf9] p-3">
          <label className="text-[10px] font-bold uppercase tracking-[.1em] text-neutral-600">
            {ar ? "محيط الصدر (سم)" : "Chest / Bust (cm)"}
          </label>
          <div className="mt-2 flex items-center gap-2">
            <input
              name="chestMinCm"
              type="number"
              step="0.5"
              defaultValue={entry.chestMinCm}
              required
              className="h-9 w-full border bg-white px-2 text-xs font-semibold"
              placeholder="Min"
            />
            <span className="text-xs text-neutral-400">–</span>
            <input
              name="chestMaxCm"
              type="number"
              step="0.5"
              defaultValue={entry.chestMaxCm}
              required
              className="h-9 w-full border bg-white px-2 text-xs font-semibold"
              placeholder="Max"
            />
          </div>
        </div>

        {/* Waist Range */}
        <div className="rounded border border-black/10 bg-[#f9faf9] p-3">
          <label className="text-[10px] font-bold uppercase tracking-[.1em] text-neutral-600">
            {ar ? "محيط الخصر (سم)" : "Waist (cm)"}
          </label>
          <div className="mt-2 flex items-center gap-2">
            <input
              name="waistMinCm"
              type="number"
              step="0.5"
              defaultValue={entry.waistMinCm}
              required
              className="h-9 w-full border bg-white px-2 text-xs font-semibold"
              placeholder="Min"
            />
            <span className="text-xs text-neutral-400">–</span>
            <input
              name="waistMaxCm"
              type="number"
              step="0.5"
              defaultValue={entry.waistMaxCm}
              required
              className="h-9 w-full border bg-white px-2 text-xs font-semibold"
              placeholder="Max"
            />
          </div>
        </div>

        {/* Hip Range */}
        <div className="rounded border border-black/10 bg-[#f9faf9] p-3">
          <label className="text-[10px] font-bold uppercase tracking-[.1em] text-neutral-600">
            {ar ? "محيط الأرداف (سم)" : "Hips (cm)"}
          </label>
          <div className="mt-2 flex items-center gap-2">
            <input
              name="hipMinCm"
              type="number"
              step="0.5"
              defaultValue={entry.hipMinCm}
              required
              className="h-9 w-full border bg-white px-2 text-xs font-semibold"
              placeholder="Min"
            />
            <span className="text-xs text-neutral-400">–</span>
            <input
              name="hipMaxCm"
              type="number"
              step="0.5"
              defaultValue={entry.hipMaxCm}
              required
              className="h-9 w-full border bg-white px-2 text-xs font-semibold"
              placeholder="Max"
            />
          </div>
        </div>

        {/* Inseam & Garment Length */}
        <div className="rounded border border-black/10 bg-[#f9faf9] p-3">
          <label className="text-[10px] font-bold uppercase tracking-[.1em] text-neutral-600">
            {ar ? "الطول الداخلي / طول القميص (سم)" : "Inseam / Length (cm)"}
          </label>
          <div className="mt-2 flex items-center gap-2">
            <input
              name="inseamCm"
              type="number"
              step="0.5"
              defaultValue={entry.inseamCm ?? ""}
              className="h-9 w-full border bg-white px-2 text-xs font-semibold"
              placeholder={ar ? "الداخلي" : "Inseam"}
            />
            <span className="text-xs text-neutral-400">/</span>
            <input
              name="garmentLengthCm"
              type="number"
              step="0.5"
              defaultValue={entry.garmentLengthCm ?? ""}
              className="h-9 w-full border bg-white px-2 text-xs font-semibold"
              placeholder={ar ? "القميص" : "Length"}
            />
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-[.1em] text-neutral-400">
            {ar ? "ملاحظة المقاس (إنجليزي)" : "Fit note (English)"}
          </label>
          <input
            name="noteEn"
            defaultValue={entry.noteEn ?? ""}
            maxLength={200}
            className="mt-1 h-8 w-full border border-black/10 bg-white px-2 text-xs text-neutral-600"
            placeholder="e.g. Tailored slim fit across shoulders"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-[.1em] text-neutral-400">
            {ar ? "ملاحظة المقاس (عربي)" : "Fit note (Arabic)"}
          </label>
          <input
            name="noteAr"
            defaultValue={entry.noteAr ?? ""}
            maxLength={200}
            className="mt-1 h-8 w-full border border-black/10 bg-white px-2 text-xs text-neutral-600"
            placeholder="مثال: قصة مريحة متناسقة مع مرونة كاملة"
          />
        </div>
      </div>
    </form>
  );
}
