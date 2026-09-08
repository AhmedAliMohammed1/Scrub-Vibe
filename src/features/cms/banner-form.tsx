"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { createBannerAction, updateBannerAction } from "./actions";
import type { BannerType, CmsBanner } from "./types";
import { BANNER_TYPES, getBannerImageUrl, TYPE_LABELS } from "./types";

interface BannerFormProps {
  locale: Locale;
  banner?: CmsBanner | null;
  defaultType?: BannerType;
  onClose: () => void;
  onSuccess: () => void;
}

export function BannerForm({
  locale,
  banner,
  defaultType = "hero",
  onClose,
  onSuccess,
}: BannerFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<BannerType>(banner?.type ?? defaultType);
  const [bgColor, setBgColor] = useState(banner?.bgColor ?? "#073b36");
  const [textColor, setTextColor] = useState(banner?.textColor ?? "#ffffff");
  const [overlayOpacity, setOverlayOpacity] = useState(
    banner?.overlayOpacity ?? 60,
  );
  const [imagePreview, setImagePreview] = useState<string | null>(
    getBannerImageUrl(banner?.imagePath ?? null),
  );
  const [removeImage, setRemoveImage] = useState(false);

  const ar = locale === "ar";
  const isEditing = Boolean(banner);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRemoveImage(false);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setRemoveImage(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    if (removeImage) {
      formData.set("removeImage", "true");
    }

    startTransition(async () => {
      const result = isEditing && banner
        ? await updateBannerAction(banner.id, formData)
        : await createBannerAction(formData);

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setError(result.error ?? (ar ? "حدث خطأ أثناء الحفظ" : "Failed to save banner"));
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-black/10 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b pb-4">
          <h3 className="font-serif text-2xl text-neutral-900">
            {isEditing
              ? ar
                ? "تعديل البانر"
                : "Edit banner"
              : ar
                ? "إضافة بانر جديد"
                : "Create new banner"}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-3 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Type selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
              {ar ? "نوع البانر" : "Banner type"}
            </label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {BANNER_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  disabled={isEditing}
                  onClick={() => setType(t)}
                  className={`rounded-md border p-2.5 text-xs font-bold transition ${
                    type === t
                      ? "border-[#073b36] bg-[#073b36] text-white"
                      : "border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100"
                  } ${isEditing ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  {TYPE_LABELS[t][ar ? "ar" : "en"]}
                </button>
              ))}
            </div>
            <input type="hidden" name="type" value={type} />
          </div>

          {/* Bilingual titles */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                {ar ? "العنوان (بالإنجليزية) *" : "Title (English) *"}
              </label>
              <input
                name="titleEn"
                required
                defaultValue={banner?.titleEn ?? ""}
                placeholder="Confidence for every shift"
                className="mt-1.5 w-full rounded-md border border-neutral-300 p-2.5 text-sm focus:border-[#073b36] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                {ar ? "العنوان (بالعربية) *" : "Title (Arabic) *"}
              </label>
              <input
                name="titleAr"
                required
                dir="rtl"
                defaultValue={banner?.titleAr ?? ""}
                placeholder="ثقة في كل شيفت"
                className="mt-1.5 w-full rounded-md border border-neutral-300 p-2.5 text-sm focus:border-[#073b36] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Bilingual subtitles */}
          {type !== "announcement" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                  {ar ? "العنوان الفرعي (EN)" : "Subtitle / Eyebrow (EN)"}
                </label>
                <input
                  name="subtitleEn"
                  defaultValue={banner?.subtitleEn ?? ""}
                  placeholder="MEDICAL CLOTHING · MADE IN EGYPT"
                  className="mt-1.5 w-full rounded-md border border-neutral-300 p-2.5 text-sm focus:border-[#073b36] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                  {ar ? "العنوان الفرعي (AR)" : "Subtitle / Eyebrow (AR)"}
                </label>
                <input
                  name="subtitleAr"
                  dir="rtl"
                  defaultValue={banner?.subtitleAr ?? ""}
                  placeholder="ملابس طبية · صناعة مصرية"
                  className="mt-1.5 w-full rounded-md border border-neutral-300 p-2.5 text-sm focus:border-[#073b36] focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Bilingual body */}
          {type !== "announcement" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                  {ar ? "نص الوصف (EN)" : "Body text (EN)"}
                </label>
                <textarea
                  name="bodyEn"
                  rows={3}
                  defaultValue={banner?.bodyEn ?? ""}
                  placeholder="Premium scrubs made in our own factory..."
                  className="mt-1.5 w-full rounded-md border border-neutral-300 p-2.5 text-sm focus:border-[#073b36] focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                  {ar ? "نص الوصف (AR)" : "Body text (AR)"}
                </label>
                <textarea
                  name="bodyAr"
                  rows={3}
                  dir="rtl"
                  defaultValue={banner?.bodyAr ?? ""}
                  placeholder="سكراب عالي الجودة من مصنعنا..."
                  className="mt-1.5 w-full rounded-md border border-neutral-300 p-2.5 text-sm focus:border-[#073b36] focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Primary CTA */}
          <div className="rounded-md border border-neutral-200 bg-neutral-50/50 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
              {ar ? "زر الإجراء الرئيسي (Primary CTA)" : "Primary Call-to-Action"}
            </h4>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-neutral-500">
                  {ar ? "النص (EN)" : "Text (EN)"}
                </label>
                <input
                  name="ctaTextEn"
                  defaultValue={banner?.ctaTextEn ?? ""}
                  placeholder="Shop Women"
                  className="mt-1 w-full rounded-md border border-neutral-300 p-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-neutral-500">
                  {ar ? "النص (AR)" : "Text (AR)"}
                </label>
                <input
                  name="ctaTextAr"
                  dir="rtl"
                  defaultValue={banner?.ctaTextAr ?? ""}
                  placeholder="تسوقي الحريمي"
                  className="mt-1 w-full rounded-md border border-neutral-300 p-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-neutral-500">
                  {ar ? "الرابط" : "Link URL"}
                </label>
                <input
                  name="ctaUrl"
                  defaultValue={banner?.ctaUrl ?? ""}
                  placeholder="/en/shop?category=women"
                  className="mt-1 w-full rounded-md border border-neutral-300 p-2 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Secondary CTA (hero/promo only) */}
          {type !== "announcement" && (
            <div className="rounded-md border border-neutral-200 bg-neutral-50/50 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                {ar ? "زر الإجراء الثانوي (Secondary CTA)" : "Secondary Call-to-Action"}
              </h4>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-neutral-500">
                    {ar ? "النص (EN)" : "Text (EN)"}
                  </label>
                  <input
                    name="secondaryCtaTextEn"
                    defaultValue={banner?.secondaryCtaTextEn ?? ""}
                    placeholder="Shop Men"
                    className="mt-1 w-full rounded-md border border-neutral-300 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-neutral-500">
                    {ar ? "النص (AR)" : "Text (AR)"}
                  </label>
                  <input
                    name="secondaryCtaTextAr"
                    dir="rtl"
                    defaultValue={banner?.secondaryCtaTextAr ?? ""}
                    placeholder="تسوق الرجالي"
                    className="mt-1 w-full rounded-md border border-neutral-300 p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-neutral-500">
                    {ar ? "الرابط" : "Link URL"}
                  </label>
                  <input
                    name="secondaryCtaUrl"
                    defaultValue={banner?.secondaryCtaUrl ?? ""}
                    placeholder="/en/shop?category=men"
                    className="mt-1 w-full rounded-md border border-neutral-300 p-2 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Image upload (hero / promo) */}
          {type !== "announcement" && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                {ar ? "صورة البانر" : "Banner Image"}
              </label>
              <div className="mt-2 flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative size-24 overflow-hidden rounded-md border border-neutral-200">
                    <Image
                      src={imagePreview}
                      alt="Banner preview"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-1 end-1 rounded-full bg-red-600 p-1 text-white shadow-xs hover:bg-red-700"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <label className="flex h-24 w-32 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-neutral-300 bg-neutral-50 text-neutral-500 hover:bg-neutral-100">
                    <Upload size={20} />
                    <span className="mt-1 text-[10px] font-bold uppercase">
                      {ar ? "رفع صورة" : "Upload"}
                    </span>
                    <input
                      type="file"
                      name="image"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
                <div className="text-xs text-neutral-500">
                  <p>{ar ? "الحد الأقصى: 5 ميجابايت" : "Max size: 5 MB"}</p>
                  <p>{ar ? "الصيغ: JPEG, PNG, WebP" : "Formats: JPEG, PNG, WebP"}</p>
                  <p className="text-[10px] text-neutral-400">
                    {type === "hero"
                      ? ar
                        ? "المقاس المقترح: 1920×1080 بكسل"
                        : "Recommended: 1920×1080 px"
                      : ar
                        ? "المقاس المقترح: 800×800 بكسل"
                        : "Recommended: 800×800 px"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Visual styling: background & text colors */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                {ar ? "لون الخلفية" : "Background color"}
              </label>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="size-9 cursor-pointer rounded-md border border-neutral-300 p-0.5"
                />
                <input
                  name="bgColor"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 p-2 text-xs uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                {ar ? "لون النص" : "Text color"}
              </label>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="size-9 cursor-pointer rounded-md border border-neutral-300 p-0.5"
                />
                <input
                  name="textColor"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 p-2 text-xs uppercase"
                />
              </div>
            </div>

            {type === "hero" && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                  {ar ? `شفافية التظليل (${overlayOpacity}%)` : `Overlay opacity (${overlayOpacity}%)`}
                </label>
                <input
                  type="range"
                  name="overlayOpacity"
                  min="0"
                  max="100"
                  value={overlayOpacity}
                  onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                  className="mt-3 w-full"
                />
              </div>
            )}
          </div>

          {/* Schedule */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                {ar ? "تاريخ البدء (اختياري)" : "Starts at (optional)"}
              </label>
              <input
                type="datetime-local"
                name="startsAt"
                defaultValue={
                  banner?.startsAt
                    ? new Date(banner.startsAt).toISOString().slice(0, 16)
                    : ""
                }
                className="mt-1.5 w-full rounded-md border border-neutral-300 p-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                {ar ? "تاريخ الانتهاء (اختياري)" : "Ends at (optional)"}
              </label>
              <input
                type="datetime-local"
                name="endsAt"
                defaultValue={
                  banner?.endsAt
                    ? new Date(banner.endsAt).toISOString().slice(0, 16)
                    : ""
                }
                className="mt-1.5 w-full rounded-md border border-neutral-300 p-2 text-xs"
              />
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              defaultChecked={banner ? banner.isActive : true}
              className="size-4 rounded-sm border-neutral-300 text-[#073b36] focus:ring-[#073b36]"
            />
            <label htmlFor="isActive" className="text-xs font-medium text-neutral-700">
              {ar ? "تفعيل البانر فور الحفظ" : "Active (visible on storefront when scheduled)"}
            </label>
          </div>

          {/* Form actions */}
          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-md border border-neutral-300 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-700 hover:bg-neutral-50"
            >
              {ar ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-[#073b36] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#062f2b] disabled:opacity-50"
            >
              {isPending
                ? ar
                  ? "جاري الحفظ..."
                  : "Saving..."
                : isEditing
                  ? ar
                    ? "تحديث البانر"
                    : "Update banner"
                  : ar
                    ? "إنشاء البانر"
                    : "Create banner"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
