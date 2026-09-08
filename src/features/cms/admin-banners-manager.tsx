"use client";

import { useState, useTransition } from "react";
import {
  Layers,
  Megaphone,
  Plus,
  Sparkles,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { reorderBannersAction } from "./actions";
import { BannerCard } from "./banner-card";
import { BannerForm } from "./banner-form";
import type { BannerType, CmsBanner } from "./types";
import { getBannerStatus, TYPE_LABELS } from "./types";

interface AdminBannersManagerProps {
  initialBanners: CmsBanner[];
  locale: Locale;
}

export function AdminBannersManager({
  initialBanners,
  locale,
}: AdminBannersManagerProps) {
  const [banners] = useState<CmsBanner[]>(initialBanners);
  const [activeTab, setActiveTab] = useState<BannerType>("hero");
  const [editingBanner, setEditingBanner] = useState<CmsBanner | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [, startTransition] = useTransition();

  const ar = locale === "ar";

  const tabBanners = banners
    .filter((b) => b.type === activeTab)
    .sort((a, b) => a.position - b.position);

  const liveCount = banners.filter(
    (b) => b.type === activeTab && getBannerStatus(b) === "live",
  ).length;

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= tabBanners.length) return;

    const newOrder = [...tabBanners];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    const orderedIds = newOrder.map((b) => b.id);
    startTransition(async () => {
      await reorderBannersAction(orderedIds);
    });
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher & Add Button */}
      <div className="flex flex-col justify-between gap-4 border-b border-black/10 pb-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-2">
          {(["hero", "announcement", "promo"] as const).map((tab) => {
            const count = banners.filter((b) => b.type === tab).length;
            const Icon =
              tab === "announcement"
                ? Megaphone
                : tab === "hero"
                  ? Sparkles
                  : Layers;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 rounded-md px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition ${
                  activeTab === tab
                    ? "bg-[#073b36] text-white shadow-xs"
                    : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                <Icon size={14} />
                <span>{TYPE_LABELS[tab][ar ? "ar" : "en"]}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    activeTab === tab
                      ? "bg-white/20 text-white"
                      : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => {
            setEditingBanner(null);
            setIsCreating(true);
          }}
          className="flex items-center justify-center gap-2 rounded-md bg-[#0e7468] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-xs hover:bg-[#0b5d53]"
        >
          <Plus size={16} />
          <span>
            {ar
              ? `إضافة ${TYPE_LABELS[activeTab].ar}`
              : `Add ${TYPE_LABELS[activeTab].en}`}
          </span>
        </button>
      </div>

      {/* Tab info & stats */}
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <p>
          {ar
            ? `إجمالي البانرات: ${tabBanners.length} (${liveCount} نشط ومباشر حالياً)`
            : `Total: ${tabBanners.length} (${liveCount} live on storefront)`}
        </p>
        <p className="text-[11px]">
          {activeTab === "announcement" &&
            (ar
              ? "يظهر شريط الإعلانات أعلى كل صفحات المتجر مع دوران تلقائي."
              : "Announcements appear at the very top of all pages with auto-ticker.")}
          {activeTab === "hero" &&
            (ar
              ? "البانرات الرئيسية تظهر في مقدمة الصفحة الرئيسية بنظام السلايدر المتعدد."
              : "Hero banners rotate in the top viewport of the homepage.")}
          {activeTab === "promo" &&
            (ar
              ? "البانرات الترويجية تظهر كأقسام مميزة بين شبكة المنتجات وتقييمات المتجر."
              : "Promotional banners appear as editorial sections on the homepage.")}
        </p>
      </div>

      {/* Banner Cards List */}
      {tabBanners.length > 0 ? (
        <div className="grid gap-3">
          {tabBanners.map((banner, index) => (
            <BannerCard
              key={banner.id}
              banner={banner}
              locale={locale}
              isFirst={index === 0}
              isLast={index === tabBanners.length - 1}
              onEdit={(b) => setEditingBanner(b)}
              onMoveUp={tabBanners.length > 1 ? () => handleMove(index, "up") : undefined}
              onMoveDown={tabBanners.length > 1 ? () => handleMove(index, "down") : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-200 bg-white p-12 text-center">
          <p className="text-sm font-medium text-neutral-600">
            {ar
              ? `لا توجد ${TYPE_LABELS[activeTab].ar} حالياً.`
              : `No ${TYPE_LABELS[activeTab].en.toLowerCase()}s created yet.`}
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            {ar
              ? "يعرض المتجر المحتوى الافتراضي تلقائياً حتى تقوم بإضافة أول بانر."
              : "The storefront automatically renders default brand content until you add one."}
          </p>
          <button
            onClick={() => {
              setEditingBanner(null);
              setIsCreating(true);
            }}
            className="mt-5 flex items-center gap-2 rounded-md bg-[#073b36] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#062f2b]"
          >
            <Plus size={14} />
            <span>
              {ar
                ? `إنشاء أول ${TYPE_LABELS[activeTab].ar}`
                : `Create first ${TYPE_LABELS[activeTab].en.toLowerCase()}`}
            </span>
          </button>
        </div>
      )}

      {/* Modal Dialog */}
      {(isCreating || editingBanner) && (
        <BannerForm
          locale={locale}
          banner={editingBanner}
          defaultType={activeTab}
          onClose={() => {
            setIsCreating(false);
            setEditingBanner(null);
          }}
          onSuccess={() => {
            setIsCreating(false);
            setEditingBanner(null);
          }}
        />
      )}
    </div>
  );
}
