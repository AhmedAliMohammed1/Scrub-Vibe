"use client";

import { Building2, Home, Briefcase, MapPin, CheckCircle2, Plus } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { ShippingGovernorateOption } from "@/features/shipping/types";
import {
  ADDRESS_LABELS,
  formatAddressDisplay,
  type AddressLabel,
  type CustomerAddress,
} from "./types";

type Props = {
  savedAddresses: CustomerAddress[];
  selectedAddressId: number | "new";
  onSelectAddress: (address: CustomerAddress | "new") => void;
  shippingLocations: ShippingGovernorateOption[];
  locale: Locale;
  saveNewAddress: boolean;
  onToggleSaveNewAddress: (save: boolean) => void;
  newAddressLabel: AddressLabel;
  onSelectNewAddressLabel: (label: AddressLabel) => void;
};

const labelIcons = {
  clinic: Building2,
  home: Home,
  work: Briefcase,
  other: MapPin,
};

export function CheckoutAddressSelector({
  savedAddresses,
  selectedAddressId,
  onSelectAddress,
  shippingLocations,
  locale,
  saveNewAddress,
  onToggleSaveNewAddress,
  newAddressLabel,
  onSelectNewAddressLabel,
}: Props) {
  const isAr = locale === "ar";

  if (savedAddresses.length === 0) {
    // User is logged in but has no saved addresses yet. Offer to save this address upon order.
    return (
      <div className="sm:col-span-2 rounded-xs border border-[var(--color-primary)]/25 bg-[var(--color-secondary)]/15 p-4 shadow-subtle">
        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-[var(--color-primary)]">
          <input
            type="checkbox"
            checked={saveNewAddress}
            onChange={(e) => onToggleSaveNewAddress(e.target.checked)}
            className="size-4 rounded-xs accent-[var(--color-primary)]"
          />
          <span>
            {isAr
              ? "حفظ هذا العنوان في حسابي لاستخدامه في الطلبات القادمة"
              : "Save this address to my account for future orders"}
          </span>
        </label>
        {saveNewAddress && (
          <div className="mt-3 border-t border-[var(--color-primary)]/20 pt-3">
            <span className="block text-[11px] font-bold text-[var(--text-secondary)]">
              {isAr ? "نوع المكان:" : "Address location type:"}
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["clinic", "home", "work", "other"] as AddressLabel[]).map((lbl) => {
                const Icon = labelIcons[lbl];
                const active = newAddressLabel === lbl;
                return (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() => onSelectNewAddressLabel(lbl)}
                    className={`flex items-center gap-1.5 rounded-xs border px-2.5 py-1.5 text-xs font-medium transition-all ${
                      active
                        ? "border-[var(--color-primary)] bg-white text-[var(--color-primary)] shadow-xs"
                        : "border-[var(--border-subtle)] bg-white/60 text-[var(--text-secondary)] hover:bg-white"
                    }`}
                  >
                    <Icon size={14} />
                    <span>{ADDRESS_LABELS[lbl][locale]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="sm:col-span-2 space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
          {isAr ? "اختر من عناوينك المحفوظة" : "Select from your saved addresses"}
        </label>
        {selectedAddressId !== "new" && (
          <button
            type="button"
            onClick={() => onSelectAddress("new")}
            className="flex items-center gap-1 text-xs font-bold text-[var(--color-primary)] transition hover:underline"
          >
            <Plus size={13} />
            <span>{isAr ? "عنوان جديد" : "New address"}</span>
          </button>
        )}
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {savedAddresses.map((addr) => {
          const isSelected = selectedAddressId === addr.id;
          const Icon = labelIcons[addr.label] || MapPin;
          const labelInfo = ADDRESS_LABELS[addr.label] || ADDRESS_LABELS.other;
          const displayLabel = addr.customLabel || labelInfo[locale];
          const gov = shippingLocations.find((g) => g.code === addr.governorateCode);
          const govName = gov ? (isAr ? gov.nameAr : gov.nameEn) : addr.governorateCode;
          const formatted = formatAddressDisplay(addr, govName, locale);

          return (
            <button
              key={addr.id}
              type="button"
              onClick={() => onSelectAddress(addr)}
              className={`flex flex-col justify-between rounded-xs border p-3.5 text-start transition-all shadow-subtle ${
                isSelected
                  ? "border-[var(--color-primary)] bg-[var(--color-secondary)]/25 ring-1 ring-[var(--color-primary)]"
                  : "border-[var(--border-subtle)] bg-[var(--surface-raised)] hover:border-[var(--border-strong)]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1.5">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-primary)]">
                    <Icon size={14} className="text-[var(--color-primary)]" />
                    <span>{displayLabel}</span>
                  </span>
                  {addr.isDefault && (
                    <span className="rounded-xs bg-[var(--color-secondary)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-primary-dark)]">
                      {isAr ? "افتراضي" : "Default"}
                    </span>
                  )}
                </div>
                <strong className="mt-2 block text-xs font-semibold text-[var(--text-primary)]">
                  {addr.recipientName}
                </strong>
                <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-[var(--text-secondary)]">
                  {formatted}
                </p>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-[var(--border-subtle)] pt-1.5 text-[11px] text-[var(--text-muted)] font-mono">
                <span className="dir-ltr text-start">{addr.phone}</span>
                {isSelected && (
                  <span className="flex items-center gap-1 font-bold text-[var(--color-primary)]">
                    <CheckCircle2 size={12} />
                    <span>{isAr ? "محدد" : "Selected"}</span>
                  </span>
                )}
              </div>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onSelectAddress("new")}
          className={`flex min-h-24 flex-col items-center justify-center rounded-xs border border-dashed p-3.5 text-center transition-all ${
            selectedAddressId === "new"
              ? "border-[var(--color-primary)] bg-[var(--color-secondary)]/25 ring-1 ring-[var(--color-primary)]"
              : "border-[var(--border-subtle)] bg-[var(--surface-canvas)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-raised)]"
          }`}
        >
          <Plus size={20} className="text-[var(--text-muted)]" />
          <span className="mt-1 text-xs font-bold text-[var(--text-primary)]">
            {isAr ? "+ إدخال عنوان توصيل جديد" : "+ Use a different address"}
          </span>
        </button>
      </div>

      {selectedAddressId === "new" && (
        <div className="mt-2 rounded-xs border border-[var(--color-primary)]/25 bg-[var(--color-secondary)]/15 p-3.5 shadow-subtle">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[var(--color-primary)]">
            <input
              type="checkbox"
              checked={saveNewAddress}
              onChange={(e) => onToggleSaveNewAddress(e.target.checked)}
              className="size-4 rounded-xs accent-[var(--color-primary)]"
            />
            <span>
              {isAr
                ? "احفظ هذا العنوان الجديد في حسابي لاستخدامه لاحقاً"
                : "Save this new address to my account for future orders"}
            </span>
          </label>
          {saveNewAddress && (
            <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-[var(--color-primary)]/20 pt-2.5">
              <span className="text-[11px] font-bold text-[var(--text-secondary)]">
                {isAr ? "نوع المكان:" : "Location type:"}
              </span>
              {(["clinic", "home", "work", "other"] as AddressLabel[]).map((lbl) => {
                const Icon = labelIcons[lbl];
                const active = newAddressLabel === lbl;
                return (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() => onSelectNewAddressLabel(lbl)}
                    className={`flex items-center gap-1 rounded-xs border px-2 py-1 text-[11px] font-medium transition-all ${
                      active
                        ? "border-[var(--color-primary)] bg-white text-[var(--color-primary)] shadow-xs"
                        : "border-[var(--border-subtle)] bg-white/60 text-[var(--text-secondary)] hover:bg-white"
                    }`}
                  >
                    <Icon size={13} />
                    <span>{ADDRESS_LABELS[lbl][locale]}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
