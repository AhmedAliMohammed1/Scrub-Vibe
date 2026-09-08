"use client";

import { useState, useEffect, useMemo } from "react";
import { X, Ruler, Sparkles, HelpCircle, Check, Info } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type {
  SizeCategory,
  SizeChartEntry,
  MeasurementUnit,
} from "@/features/catalog/size-guide-types";
import {
  cmToInches,
  calculateRecommendedSize,
} from "@/features/catalog/size-guide";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  entries: SizeChartEntry[];
  category: SizeCategory;
  productTitle: string;
  isProductOverride?: boolean;
  availableSizes?: string[];
  locale: Locale;
  currentSize?: string;
  onSelectSize?: (size: string) => void;
};

export function SizeGuideDialog({
  isOpen,
  onClose,
  entries,
  category,
  productTitle,
  isProductOverride = false,
  availableSizes = [],
  locale,
  currentSize,
  onSelectSize,
}: Props) {
  const ar = locale === "ar";
  const [activeTab, setActiveTab] = useState<
    "chart" | "calculator" | "howToMeasure"
  >("chart");
  const [unit, setUnit] = useState<MeasurementUnit>("cm");

  // Calculator state
  const [chestInput, setChestInput] = useState<string>("");
  const [waistInput, setWaistInput] = useState<string>("");
  const [hipInput, setHipInput] = useState<string>("");

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

  // Compute live recommendation
  const recommendation = useMemo(() => {
    const chest = parseFloat(chestInput) || null;
    const waist = parseFloat(waistInput) || null;
    const hip = parseFloat(hipInput) || null;

    if (!chest && !waist && !hip) return null;

    return calculateRecommendedSize({
      category,
      unit,
      chest,
      waist,
      hip,
      availableSizes,
      entries,
    });
  }, [
    category,
    unit,
    chestInput,
    waistInput,
    hipInput,
    availableSizes,
    entries,
  ]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="size-guide-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-8"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Container */}
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-black/10 bg-[#062f2b] px-6 py-5 text-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="eyebrow text-[#81c5b8]">
                {ar ? "دليل المقاسات الطبي" : "MEDICAL SIZING GUIDE"}
              </span>
              {isProductOverride && (
                <span className="rounded bg-[#0e7468] px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                  {ar ? "مقاسات خاصة بهذا المنتج" : "Custom Product Sizing"}
                </span>
              )}
            </div>
            <h2
              id="size-guide-title"
              className="mt-1 font-serif text-2xl md:text-3xl"
            >
              {ar ? "دليل المقاسات ومساعد القياس" : "Size Guide & Fit Advisor"}
            </h2>
            <p className="text-xs text-white/70">{productTitle}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={ar ? "إغلاق" : "Close"}
            className="rounded p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
        </header>

        {/* Tab Navigation & Unit Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 bg-[#f5f7f5] px-6 py-3">
          <div className="flex gap-2" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === "chart"}
              type="button"
              onClick={() => setActiveTab("chart")}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase tracking-[.1em] transition ${
                activeTab === "chart"
                  ? "border-b-2 border-[#0e7468] bg-white text-[#062f2b] shadow-sm"
                  : "text-neutral-600 hover:text-black"
              }`}
            >
              <Ruler size={14} />
              {ar ? "جدول المقاسات" : "Size Chart"}
            </button>
            <button
              role="tab"
              aria-selected={activeTab === "calculator"}
              type="button"
              onClick={() => setActiveTab("calculator")}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase tracking-[.1em] transition ${
                activeTab === "calculator"
                  ? "border-b-2 border-[#0e7468] bg-white text-[#062f2b] shadow-sm"
                  : "text-neutral-600 hover:text-black"
              }`}
            >
              <Sparkles size={14} />
              {ar ? "احسب مقاسي" : "Find My Size"}
            </button>
            <button
              role="tab"
              aria-selected={activeTab === "howToMeasure"}
              type="button"
              onClick={() => setActiveTab("howToMeasure")}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase tracking-[.1em] transition ${
                activeTab === "howToMeasure"
                  ? "border-b-2 border-[#0e7468] bg-white text-[#062f2b] shadow-sm"
                  : "text-neutral-600 hover:text-black"
              }`}
            >
              <HelpCircle size={14} />
              {ar ? "طريقة أخذ القياس" : "How to Measure"}
            </button>
          </div>

          {/* Unit Switcher */}
          <div className="flex items-center gap-1.5 rounded bg-black/5 p-1 text-[11px] font-bold uppercase">
            <button
              type="button"
              onClick={() => setUnit("cm")}
              className={`rounded px-2.5 py-1 transition ${
                unit === "cm"
                  ? "bg-[#062f2b] text-white shadow-xs"
                  : "text-neutral-600 hover:text-black"
              }`}
            >
              {ar ? "سم (cm)" : "cm"}
            </button>
            <button
              type="button"
              onClick={() => setUnit("in")}
              className={`rounded px-2.5 py-1 transition ${
                unit === "in"
                  ? "bg-[#062f2b] text-white shadow-xs"
                  : "text-neutral-600 hover:text-black"
              }`}
            >
              {ar ? "بوصة (in)" : "inches"}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-6">
          {/* TAB 1: SIZE CHART */}
          {activeTab === "chart" && (
            <div className="grid gap-6">
              <div className="overflow-x-auto rounded border border-black/10">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f0f4f2] text-[10px] font-bold uppercase tracking-[.1em] text-[#062f2b]">
                    <tr>
                      <th className="border-b border-black/10 px-4 py-3">
                        {ar ? "المقاس" : "Size"}
                      </th>
                      <th className="border-b border-black/10 px-4 py-3">
                        {ar ? "الصدر" : "Chest / Bust"} ({unit})
                      </th>
                      <th className="border-b border-black/10 px-4 py-3">
                        {ar ? "الخصر" : "Waist"} ({unit})
                      </th>
                      <th className="border-b border-black/10 px-4 py-3">
                        {ar ? "الأرداف" : "Hips"} ({unit})
                      </th>
                      <th className="border-b border-black/10 px-4 py-3">
                        {ar ? "الطول الداخلي" : "Inseam"} ({unit})
                      </th>
                      <th className="border-b border-black/10 px-4 py-3">
                        {ar ? "طول القميص" : "Length"} ({unit})
                      </th>
                      {onSelectSize && (
                        <th className="border-b border-black/10 px-4 py-3 text-center">
                          {ar ? "اختيار" : "Select"}
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 bg-white">
                    {entries.map((e) => {
                      const isSelected = currentSize === e.size;
                      const isAvailable =
                        !availableSizes.length ||
                        availableSizes.includes(e.size);

                      const formatVal = (cmVal: number) =>
                        unit === "cm" ? cmVal : cmToInches(cmVal);

                      return (
                        <tr
                          key={e.size}
                          className={`transition hover:bg-[#f9faf9] ${
                            isSelected
                              ? "bg-[#eaf4f1] font-semibold text-[#062f2b]"
                              : ""
                          }`}
                        >
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-2">
                              <span className="font-serif text-sm font-bold">
                                {e.size}
                              </span>
                              {isSelected && (
                                <span className="rounded bg-[#0e7468] px-1.5 py-0.5 text-[9px] font-bold text-white">
                                  {ar ? "المحدد" : "Current"}
                                </span>
                              )}
                              {!isAvailable && (
                                <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[9px] text-neutral-400">
                                  {ar ? "غير متوفر" : "Out of stock"}
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {formatVal(e.chestMinCm)} –{" "}
                            {formatVal(e.chestMaxCm)}
                          </td>
                          <td className="px-4 py-3">
                            {formatVal(e.waistMinCm)} –{" "}
                            {formatVal(e.waistMaxCm)}
                          </td>
                          <td className="px-4 py-3">
                            {formatVal(e.hipMinCm)} – {formatVal(e.hipMaxCm)}
                          </td>
                          <td className="px-4 py-3 text-neutral-600">
                            {e.inseamCm ? formatVal(e.inseamCm) : "—"}
                          </td>
                          <td className="px-4 py-3 text-neutral-600">
                            {e.garmentLengthCm
                              ? formatVal(e.garmentLengthCm)
                              : "—"}
                          </td>
                          {onSelectSize && (
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                disabled={!isAvailable}
                                onClick={() => {
                                  onSelectSize(e.size);
                                  onClose();
                                }}
                                className={`rounded px-3 py-1 text-[10px] font-bold uppercase tracking-[.1em] transition ${
                                  isSelected
                                    ? "bg-[#062f2b] text-white"
                                    : isAvailable
                                      ? "border border-[#0e7468] text-[#0e7468] hover:bg-[#0e7468] hover:text-white"
                                      : "cursor-not-allowed opacity-30"
                                }`}
                              >
                                {isSelected
                                  ? ar
                                    ? "مختار"
                                    : "Selected"
                                  : ar
                                    ? "اختيار"
                                    : "Choose"}
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-start gap-3 rounded border border-black/10 bg-[#f9faf9] p-4 text-xs text-neutral-600">
                <Info size={18} className="mt-0.5 text-[#0e7468] shrink-0" />
                <p>
                  {ar
                    ? "أزياء سكراب فايب مصممة بقماش طبي مرن يتمدد في 4 اتجاهات ليمنحك حرية الحركة الكاملة أثناء العمل. إذا كنت بين مقاسين، ننصح باختيار المقاس الأكبر لراحة إضافية."
                    : "Scrub Vibe medical scrubs feature 4-way stretch clinical fabric for total movement during shifts. If your measurements fall between two sizes, choose the larger size for a relaxed comfortable fit."}
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: FIND MY SIZE (CALCULATOR) */}
          {activeTab === "calculator" && (
            <div className="grid gap-6 md:grid-cols-[1.1fr_.9fr]">
              {/* Inputs */}
              <div className="grid gap-4 rounded border border-black/10 bg-[#f9faf9] p-5">
                <div>
                  <h3 className="font-serif text-xl text-[#062f2b]">
                    {ar ? "أدخل قياسات جسمك" : "Enter your body measurements"}
                  </h3>
                  <p className="mt-1 text-xs text-neutral-600">
                    {ar
                      ? `أدخل قياساً واحداً أو أكثر بوحدة (${unit === "cm" ? "السنتيمتر" : "البوصة"}) لحساب المقاس الأمثل.`
                      : `Enter one or more measurements in ${unit === "cm" ? "centimeters" : "inches"} to find your perfect fit.`}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[.1em] text-neutral-700">
                      {ar ? "محيط الصدر" : "Chest / Bust"}
                    </label>
                    <div className="relative mt-1.5">
                      <input
                        type="number"
                        step="0.5"
                        min="40"
                        max="250"
                        value={chestInput}
                        onChange={(e) => setChestInput(e.target.value)}
                        placeholder={unit === "cm" ? "e.g. 96" : "e.g. 38"}
                        className="h-10 w-full rounded border bg-white px-3 pe-8 text-xs font-semibold"
                      />
                      <span className="pointer-events-none absolute inset-y-0 end-2.5 flex items-center text-[10px] font-bold text-neutral-400">
                        {unit}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[.1em] text-neutral-700">
                      {ar ? "محيط الخصر" : "Waist"}
                    </label>
                    <div className="relative mt-1.5">
                      <input
                        type="number"
                        step="0.5"
                        min="30"
                        max="250"
                        value={waistInput}
                        onChange={(e) => setWaistInput(e.target.value)}
                        placeholder={unit === "cm" ? "e.g. 80" : "e.g. 31.5"}
                        className="h-10 w-full rounded border bg-white px-3 pe-8 text-xs font-semibold"
                      />
                      <span className="pointer-events-none absolute inset-y-0 end-2.5 flex items-center text-[10px] font-bold text-neutral-400">
                        {unit}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-[.1em] text-neutral-700">
                      {ar ? "محيط الأرداف" : "Hips"}
                    </label>
                    <div className="relative mt-1.5">
                      <input
                        type="number"
                        step="0.5"
                        min="40"
                        max="250"
                        value={hipInput}
                        onChange={(e) => setHipInput(e.target.value)}
                        placeholder={unit === "cm" ? "e.g. 100" : "e.g. 39"}
                        className="h-10 w-full rounded border bg-white px-3 pe-8 text-xs font-semibold"
                      />
                      <span className="pointer-events-none absolute inset-y-0 end-2.5 flex items-center text-[10px] font-bold text-neutral-400">
                        {unit}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Examples */}
                <div className="flex flex-wrap items-center gap-2 pt-2 text-[10px] text-neutral-600">
                  <span>
                    {ar ? "أمثلة سريعة للتجربة:" : "Quick test presets:"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (unit === "cm") {
                        setChestInput("94");
                        setWaistInput("78");
                        setHipInput("99");
                      } else {
                        setChestInput("37");
                        setWaistInput("31");
                        setHipInput("39");
                      }
                    }}
                    className="underline hover:text-black"
                  >
                    {ar ? "متوسط (M)" : "Medium (M)"}
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (unit === "cm") {
                        setChestInput("106");
                        setWaistInput("88");
                        setHipInput("106");
                      } else {
                        setChestInput("42");
                        setWaistInput("35");
                        setHipInput("42");
                      }
                    }}
                    className="underline hover:text-black"
                  >
                    {ar ? "واسع (L)" : "Large (L)"}
                  </button>
                </div>
              </div>

              {/* Live Recommendation Card */}
              <div className="flex flex-col justify-between rounded border border-[#0e7468]/30 bg-[#eef7f4] p-5">
                {recommendation && recommendation.recommendedSize ? (
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between">
                      <span className="eyebrow text-[#0e7468]">
                        {ar ? "المقاس المقترح" : "RECOMMENDED SIZE"}
                      </span>
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-[9px] font-bold text-emerald-800">
                        {recommendation.confidence === "high"
                          ? ar
                            ? "تطابق دقيق"
                            : "High Confidence"
                          : ar
                            ? "تطابق تقديري"
                            : "Estimated Match"}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-3">
                      <span className="font-serif text-5xl font-bold text-[#062f2b]">
                        {recommendation.recommendedSize}
                      </span>
                      {recommendation.secondarySize && (
                        <span className="text-xs text-neutral-600">
                          {ar ? "أو مقاس" : "or size"}{" "}
                          <strong className="text-black">
                            {recommendation.secondarySize}
                          </strong>
                        </span>
                      )}
                    </div>

                    <p className="text-xs leading-5 text-neutral-700">
                      {ar ? recommendation.messageAr : recommendation.messageEn}
                    </p>

                    {/* Breakdown Badges */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {recommendation.fitBreakdown.chestFit && (
                        <span className="rounded border border-black/10 bg-white px-2 py-1 text-[10px]">
                          {ar ? "الصدر: " : "Chest: "}
                          <strong>
                            {recommendation.fitBreakdown.chestFit}
                          </strong>
                        </span>
                      )}
                      {recommendation.fitBreakdown.waistFit && (
                        <span className="rounded border border-black/10 bg-white px-2 py-1 text-[10px]">
                          {ar ? "الخصر: " : "Waist: "}
                          <strong>
                            {recommendation.fitBreakdown.waistFit}
                          </strong>
                        </span>
                      )}
                      {recommendation.fitBreakdown.hipFit && (
                        <span className="rounded border border-black/10 bg-white px-2 py-1 text-[10px]">
                          {ar ? "الأرداف: " : "Hips: "}
                          <strong>{recommendation.fitBreakdown.hipFit}</strong>
                        </span>
                      )}
                    </div>

                    {onSelectSize && (
                      <button
                        type="button"
                        onClick={() => {
                          if (recommendation.recommendedSize) {
                            onSelectSize(recommendation.recommendedSize);
                            onClose();
                          }
                        }}
                        className="mt-4 flex h-11 w-full items-center justify-center gap-2 bg-[#062f2b] text-xs font-bold uppercase tracking-[.12em] text-white transition hover:bg-[#0e7468]"
                      >
                        <Check size={16} />
                        {ar
                          ? `اختيار مقاس ${recommendation.recommendedSize} للمنتج`
                          : `Apply Size ${recommendation.recommendedSize}`}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-neutral-400">
                    <Sparkles size={36} className="mb-3 text-[#0e7468]/40" />
                    <p className="text-xs font-semibold text-neutral-600">
                      {ar
                        ? "أدخل قياساتك لمعرفة المقاس الأنسب"
                        : "Enter your measurements to calculate your size"}
                    </p>
                    <p className="mt-1 max-w-xs text-[11px] text-neutral-600">
                      {ar
                        ? "سنقوم بمقارنة أبعاد جسمك فوراً مع أبعاد هذا الموديل واقتراح أفضل مقاس."
                        : "We’ll cross-reference your dimensions with this garment to pinpoint your ideal fit."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: HOW TO MEASURE GUIDE */}
          {activeTab === "howToMeasure" && (
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded border border-black/10 bg-[#f9faf9] p-5">
                <div className="flex items-center gap-3">
                  <span className="flex size-7 items-center justify-center rounded-full bg-[#062f2b] text-xs font-bold text-white">
                    1
                  </span>
                  <h4 className="font-serif text-lg text-[#062f2b]">
                    {ar ? "محيط الصدر (Chest / Bust)" : "Chest / Bust"}
                  </h4>
                </div>
                <p className="mt-3 text-xs leading-5 text-neutral-600">
                  {ar
                    ? "مرر شريط القياس أفقياً أسفل الإبطين حول أبرز نقطة من الصدر، مع الحفاظ على الشريط مستوياً ومريحاً دون شده بإحكام."
                    : "Wrap the measuring tape horizontally under your armpits around the fullest part of your chest. Keep the tape level across your shoulder blades."}
                </p>
              </div>

              <div className="rounded border border-black/10 bg-[#f9faf9] p-5">
                <div className="flex items-center gap-3">
                  <span className="flex size-7 items-center justify-center rounded-full bg-[#062f2b] text-xs font-bold text-white">
                    2
                  </span>
                  <h4 className="font-serif text-lg text-[#062f2b]">
                    {ar ? "محيط الخصر (Waist)" : "Natural Waist"}
                  </h4>
                </div>
                <p className="mt-3 text-xs leading-5 text-neutral-600">
                  {ar
                    ? "قِس حول أضيق جزء طبيعي من خصرك (أعلى السرة بقليل)، واحرص على ترك مساحة مريحة للتنفس والحركة."
                    : "Measure around your natural waistline (narrowest part of your torso, typically right above your belly button), leaving room for comfort."}
                </p>
              </div>

              <div className="rounded border border-black/10 bg-[#f9faf9] p-5">
                <div className="flex items-center gap-3">
                  <span className="flex size-7 items-center justify-center rounded-full bg-[#062f2b] text-xs font-bold text-white">
                    3
                  </span>
                  <h4 className="font-serif text-lg text-[#062f2b]">
                    {ar ? "محيط الأرداف (Hips)" : "Full Hips"}
                  </h4>
                </div>
                <p className="mt-3 text-xs leading-5 text-neutral-600">
                  {ar
                    ? "قف وقدميك متقاربتين، وقِس حول أعرض نقطة في الأرداف لضمان ملاءمة البنطلون بحرية أثناء الجلوس والمشي."
                    : "Stand with feet together and measure around the fullest part of your hips and seat to ensure the scrub trousers don’t pull when sitting."}
                </p>
              </div>

              <div className="rounded border border-black/10 bg-[#f9faf9] p-5">
                <div className="flex items-center gap-3">
                  <span className="flex size-7 items-center justify-center rounded-full bg-[#062f2b] text-xs font-bold text-white">
                    4
                  </span>
                  <h4 className="font-serif text-lg text-[#062f2b]">
                    {ar ? "الطول الداخلي للبنطلون (Inseam)" : "Inseam Length"}
                  </h4>
                </div>
                <p className="mt-3 text-xs leading-5 text-neutral-600">
                  {ar
                    ? "قِس من أعلى نقطة في الفخذ الداخلي (بين الساقين) إلى أسفل الكاحل حيث تريد أن يصل طول البنطلون."
                    : "Measure along the inside of your leg from the crotch seam down to your ankle bone where you prefer the scrub cuff to rest."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex flex-wrap items-center justify-between border-t border-black/10 bg-[#f5f7f5] px-6 py-4 text-xs">
          <p className="text-neutral-600">
            {ar
              ? "تحتاج مساعدة إضافية في اختيار مقاسك؟ فريقنا الطبي متاح عبر الواتساب."
              : "Need personalized sizing advice? Our team is available on WhatsApp."}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="border border-black/20 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[.1em] hover:bg-neutral-50"
          >
            {ar ? "إغلاق" : "Close"}
          </button>
        </footer>
      </div>
    </div>
  );
}
