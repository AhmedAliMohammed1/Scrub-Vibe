"use client";

import { useState } from "react";
import {
  Building2,
  Home,
  Briefcase,
  MapPin,
  Pencil,
  Trash2,
  CheckCircle2,
  Loader2,
  Star,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { ShippingGovernorateOption } from "@/features/shipping/types";
import {
  deleteCustomerAddressAction,
  setDefaultCustomerAddressAction,
} from "./actions";
import {
  ADDRESS_LABELS,
  formatAddressDisplay,
  type CustomerAddress,
} from "./types";

type Props = {
  address: CustomerAddress;
  shippingLocations: ShippingGovernorateOption[];
  locale: Locale;
  onEdit: (address: CustomerAddress) => void;
  onDeleted: (addressId: number) => void;
  onDefaultSet: (addressId: number) => void;
};

const labelIcons = {
  clinic: Building2,
  home: Home,
  work: Briefcase,
  other: MapPin,
};

export function AddressCard({
  address,
  shippingLocations,
  locale,
  onEdit,
  onDeleted,
  onDefaultSet,
}: Props) {
  const isAr = locale === "ar";
  const [busy, setBusy] = useState<"delete" | "default" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const Icon = labelIcons[address.label] || MapPin;
  const labelInfo = ADDRESS_LABELS[address.label] || ADDRESS_LABELS.other;
  const displayLabel = address.customLabel || labelInfo[locale];

  const governorate = shippingLocations.find(
    (g) => g.code === address.governorateCode,
  );
  const governorateName = governorate
    ? isAr
      ? governorate.nameAr
      : governorate.nameEn
    : address.governorateCode;

  const formattedAddress = formatAddressDisplay(address, governorateName, locale);

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setBusy("delete");
    try {
      const res = await deleteCustomerAddressAction(address.id);
      if (res.success) {
        onDeleted(address.id);
      }
    } finally {
      setBusy(null);
      setConfirmDelete(false);
    }
  };

  const handleSetDefault = async () => {
    if (address.isDefault || busy) return;
    setBusy("default");
    try {
      const res = await setDefaultCustomerAddressAction(address.id);
      if (res.success) {
        onDefaultSet(address.id);
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      className={`relative flex flex-col justify-between border p-5 transition md:p-6 ${
        address.isDefault
          ? "border-[#0e7468] bg-[#0e7468]/[0.03] shadow-sm"
          : "border-black/10 bg-white hover:border-black/25"
      }`}
    >
      <div>
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/10 pb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#073b36]">
            <Icon size={16} className="text-[#0e7468]" />
            <span>{displayLabel}</span>
          </div>
          {address.isDefault ? (
            <span className="flex items-center gap-1 rounded-full bg-[#0e7468]/15 px-2.5 py-0.5 text-[11px] font-bold text-[#073b36]">
              <CheckCircle2 size={13} className="text-[#0e7468]" />
              {isAr ? "العنوان الافتراضي" : "Default Address"}
            </span>
          ) : (
            <button
              type="button"
              onClick={handleSetDefault}
              disabled={Boolean(busy)}
              className="flex items-center gap-1 text-[11px] font-medium text-neutral-500 transition hover:text-[#0e7468]"
            >
              {busy === "default" ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Star size={12} />
              )}
              <span>{isAr ? "تعيين كافتراضي" : "Make Default"}</span>
            </button>
          )}
        </div>

        {/* Recipient & Contact */}
        <div className="mt-3">
          <h3 className="font-bold text-sm text-neutral-900">
            {address.recipientName}
          </h3>
          <p className="mt-0.5 text-xs text-neutral-600 dir-ltr text-start font-mono">
            {address.phone}
          </p>
        </div>

        {/* Formatted Address */}
        <p className="mt-3 text-xs leading-relaxed text-neutral-700">
          {formattedAddress}
        </p>
      </div>

      {/* Action Footer */}
      <div className="mt-5 flex items-center justify-end gap-2 border-t border-black/10 pt-3">
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-[#a6432b]">
              {isAr ? "تأكيد الحذف؟" : "Confirm delete?"}
            </span>
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy === "delete"}
              className="bg-[#a6432b] px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-[#8c3624]"
            >
              {busy === "delete" ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                isAr ? "نعم، احذف" : "Yes, delete"
              )}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              disabled={busy === "delete"}
              className="border border-black/15 px-2 py-1 text-[11px] text-neutral-600 transition hover:bg-neutral-100"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onEdit(address)}
              disabled={Boolean(busy)}
              className="flex items-center gap-1.5 border border-black/15 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:border-black/30 hover:bg-neutral-50"
            >
              <Pencil size={13} />
              <span>{isAr ? "تعديل" : "Edit"}</span>
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={Boolean(busy)}
              className="flex items-center gap-1.5 border border-black/15 px-3 py-1.5 text-xs font-semibold text-neutral-600 transition hover:border-[#a6432b] hover:text-[#a6432b]"
            >
              <Trash2 size={13} />
              <span>{isAr ? "حذف" : "Delete"}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
