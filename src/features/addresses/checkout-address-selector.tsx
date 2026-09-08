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
      <div className="sm:col-span-2 border border-[#0e7468]/20 bg-[#0e7468]/[0.03] p-4">
        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-[#073b36]">
          <input
            type="checkbox"
            checked={saveNewAddress}
            onChange={(e) => onToggleSaveNewAddress(e.target.checked)}
            className="size-4 accent-[#0e7468]"
          />
          <span>
            {isAr
              ? "حفظ هذا العنوان في حسابي لاستخدامه في الطلبات القادمة"
              : "Save this address to my account for future orders"}
          </span>
        </label>
        {saveNewAddress && (
          <div className="mt-3 border-t border-[#0e7468]/15 pt-3">
            <span className="block text-[11px] font-bold text-neutral-600">
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
                    className={`flex items-center gap-1.5 border px-2.5 py-1.5 text-xs font-medium transition ${
                      active
                        ? "border-[#0e7468] bg-white text-[#073b36] shadow-xs"
                        : "border-black/15 bg-white/60 text-neutral-600 hover:bg-white"
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
        <label className="block text-xs font-bold uppercase tracking-wider text-[#0e7468]">
          {isAr ? "اختر من عناوينك المحفوظة" : "Select from your saved addresses"}
        </label>
        {selectedAddressId !== "new" && (
          <button
            type="button"
            onClick={() => onSelectAddress("new")}
            className="flex items-center gap-1 text-xs font-bold text-[#0e7468] transition hover:underline"
          >
            <Plus size={13} />
            <span>{isAr ? "عنوان جديد" : "New address"}</span>
          </button>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
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
              className={`flex flex-col justify-between border p-3.5 text-start transition ${
                isSelected
                  ? "border-[#0e7468] bg-[#0e7468]/[0.06] ring-1 ring-[#0e7468]"
                  : "border-black/15 bg-white hover:border-black/30"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1.5">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-[#073b36]">
                    <Icon size={14} className="text-[#0e7468]" />
                    <span>{displayLabel}</span>
                  </span>
                  {addr.isDefault && (
                    <span className="rounded-full bg-[#0e7468]/10 px-2 py-0.5 text-[10px] font-bold text-[#0e7468]">
                      {isAr ? "افتراضي" : "Default"}
                    </span>
                  )}
                </div>
                <strong className="mt-2 block text-xs text-neutral-900">
                  {addr.recipientName}
                </strong>
                <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-neutral-600">
                  {formatted}
                </p>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-black/5 pt-1.5 text-[11px] text-neutral-500 font-mono">
                <span className="dir-ltr text-start">{addr.phone}</span>
                {isSelected && (
                  <span className="flex items-center gap-1 font-bold text-[#0e7468]">
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
          className={`flex min-h-24 flex-col items-center justify-center border border-dashed p-3.5 text-center transition ${
            selectedAddressId === "new"
              ? "border-[#0e7468] bg-[#0e7468]/[0.06] ring-1 ring-[#0e7468]"
              : "border-black/20 bg-neutral-50/50 hover:border-black/30 hover:bg-white"
          }`}
        >
          <Plus size={20} className="text-neutral-500" />
          <span className="mt-1 text-xs font-bold text-neutral-800">
            {isAr ? "+ إدخال عنوان توصيل جديد" : "+ Use a different address"}
          </span>
        </button>
      </div>

      {selectedAddressId === "new" && (
        <div className="mt-2 border border-[#0e7468]/20 bg-[#0e7468]/[0.03] p-3.5">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#073b36]">
            <input
              type="checkbox"
              checked={saveNewAddress}
              onChange={(e) => onToggleSaveNewAddress(e.target.checked)}
              className="size-4 accent-[#0e7468]"
            />
            <span>
              {isAr
                ? "احفظ هذا العنوان الجديد في حسابي لاستخدامه لاحقاً"
                : "Save this new address to my account for future orders"}
            </span>
          </label>
          {saveNewAddress && (
            <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-[#0e7468]/15 pt-2.5">
              <span className="text-[11px] font-bold text-neutral-600">
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
                    className={`flex items-center gap-1 border px-2 py-1 text-[11px] font-medium transition ${
                      active
                        ? "border-[#0e7468] bg-white text-[#073b36] shadow-xs"
                        : "border-black/15 bg-white/60 text-neutral-600 hover:bg-white"
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
