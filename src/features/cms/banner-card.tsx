"use client";

import { useTransition } from "react";
import Image from "next/image";
import {
  ArrowDown,
  ArrowUp,
  Clock,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";
import {
  deleteBannerAction,
  toggleBannerAction,
} from "./actions";
import type { CmsBanner } from "./types";
import {
  getBannerImageUrl,
  getBannerStatus,
  STATUS_LABELS,
} from "./types";

interface BannerCardProps {
  banner: CmsBanner;
  locale: Locale;
  isFirst: boolean;
  isLast: boolean;
  onEdit: (banner: CmsBanner) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export function BannerCard({
  banner,
  locale,
  isFirst,
  isLast,
  onEdit,
  onMoveUp,
  onMoveDown,
}: BannerCardProps) {
  const [isPending, startTransition] = useTransition();
  const ar = locale === "ar";
  const status = getBannerStatus(banner);
  const imageUrl = getBannerImageUrl(banner.imagePath);

  const statusColor = {
    live: "bg-emerald-100 text-emerald-800 border-emerald-300",
    scheduled: "bg-blue-100 text-blue-800 border-blue-300",
    expired: "bg-neutral-100 text-neutral-600 border-neutral-300",
    inactive: "bg-stone-100 text-stone-500 border-stone-300",
  }[status];

  const handleDelete = () => {
    const msg = ar
      ? "هل أنت متأكد من حذف هذا البانر نهائياً؟"
      : "Are you sure you want to permanently delete this banner?";
    if (!confirm(msg)) return;
    startTransition(async () => {
      await deleteBannerAction(banner.id);
    });
  };

  const handleToggle = () => {
    startTransition(async () => {
      await toggleBannerAction(banner.id);
    });
  };

  return (
    <article
      className={`relative flex flex-col justify-between border bg-white p-5 transition-shadow hover:shadow-sm sm:flex-row sm:items-center ${
        !banner.isActive ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Visual preview */}
        <div
          className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border text-[10px] font-bold text-white shadow-xs"
          style={{ backgroundColor: banner.bgColor }}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={banner.titleEn}
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <span
              className="truncate px-1 text-center"
              style={{ color: banner.textColor }}
            >
              {banner.titleEn.slice(0, 8)}
            </span>
          )}
        </div>

        {/* Content summary */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-serif text-lg font-medium text-neutral-900">
              {ar ? banner.titleAr || banner.titleEn : banner.titleEn}
            </h4>
            <span
              className={`inline-block rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${statusColor}`}
            >
              {STATUS_LABELS[status][ar ? "ar" : "en"]}
            </span>
          </div>

          <p className="mt-0.5 text-xs text-neutral-500">
            {ar ? banner.titleEn : banner.titleAr}
          </p>

          {banner.subtitleEn && (
            <p className="mt-1 text-xs text-neutral-600">
              {ar ? banner.subtitleAr || banner.subtitleEn : banner.subtitleEn}
            </p>
          )}

          {banner.ctaUrl && (
            <p className="mt-1 text-[11px] text-[#0e7468]">
              <span className="font-semibold">{ar ? "الرابط:" : "Link:"}</span>{" "}
              {banner.ctaUrl}
              {banner.ctaTextEn && ` (${banner.ctaTextEn})`}
            </p>
          )}

          {/* Schedule range */}
          {(banner.startsAt || banner.endsAt) && (
            <div className="mt-2 flex items-center gap-1 text-[10px] text-neutral-500">
              <Clock size={12} />
              <span>
                {banner.startsAt
                  ? new Date(banner.startsAt).toLocaleDateString(locale)
                  : ar
                    ? "الآن"
                    : "Now"}
                {" → "}
                {banner.endsAt
                  ? new Date(banner.endsAt).toLocaleDateString(locale)
                  : ar
                    ? "دائم"
                    : "Forever"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex shrink-0 items-center gap-2 border-t pt-3 sm:mt-0 sm:border-t-0 sm:pt-0">
        {/* Reorder up/down */}
        {onMoveUp && (
          <button
            onClick={onMoveUp}
            disabled={isFirst || isPending}
            title={ar ? "تحريك لأعلى" : "Move up"}
            className="grid size-8 place-items-center rounded-sm border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-30"
          >
            <ArrowUp size={14} />
          </button>
        )}
        {onMoveDown && (
          <button
            onClick={onMoveDown}
            disabled={isLast || isPending}
            title={ar ? "تحريك لأسفل" : "Move down"}
            className="grid size-8 place-items-center rounded-sm border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-30"
          >
            <ArrowDown size={14} />
          </button>
        )}

        {/* Toggle active */}
        <button
          onClick={handleToggle}
          disabled={isPending}
          title={
            banner.isActive
              ? ar
                ? "تعطيل البانر"
                : "Disable banner"
              : ar
                ? "تفعيل البانر"
                : "Enable banner"
          }
          className={`grid size-8 place-items-center rounded-sm border ${
            banner.isActive
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              : "border-neutral-200 bg-neutral-50 text-neutral-400 hover:bg-neutral-100"
          }`}
        >
          {banner.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>

        {/* Edit */}
        <button
          onClick={() => onEdit(banner)}
          disabled={isPending}
          title={ar ? "تعديل" : "Edit"}
          className="grid size-8 place-items-center rounded-sm border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
        >
          <Pencil size={14} />
        </button>

        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={isPending}
          title={ar ? "حذف" : "Delete"}
          className="grid size-8 place-items-center rounded-sm border border-red-200 text-red-600 hover:bg-red-50"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </article>
  );
}
