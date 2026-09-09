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
      className={`relative flex flex-col justify-between rounded-xs border p-5 transition md:p-6 shadow-subtle ${
        address.isDefault
          ? "border-[var(--color-primary)] bg-[var(--color-secondary)]/15"
          : "border-[var(--border-subtle)] bg-[var(--surface-raised)] hover:border-[var(--border-strong)]"
      }`}
    >
      <div>
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-primary)]">
            <Icon size={16} className="text-[var(--color-primary)]" />
            <span>{displayLabel}</span>
          </div>
          {address.isDefault ? (
            <span className="flex items-center gap-1 rounded-xs bg-[var(--color-secondary)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--color-primary-dark)]">
              <CheckCircle2 size={13} className="text-[var(--color-primary)]" />
              {isAr ? "العنوان الافتراضي" : "Default Address"}
            </span>
          ) : (
            <button
              type="button"
              onClick={handleSetDefault}
              disabled={Boolean(busy)}
              className="flex items-center gap-1 text-[11px] font-medium text-[var(--text-muted)] transition hover:text-[var(--color-primary)]"
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
          <h3 className="font-semibold text-sm text-[var(--text-primary)]">
            {address.recipientName}
          </h3>
          <p className="mt-0.5 text-xs text-[var(--text-secondary)] dir-ltr text-start font-mono">
            {address.phone}
          </p>
        </div>

        {/* Formatted Address */}
        <p className="mt-3 text-xs leading-relaxed text-[var(--text-secondary)]">
          {formattedAddress}
        </p>
      </div>

      {/* Action Footer */}
      <div className="mt-5 flex items-center justify-end gap-2 border-t border-[var(--border-subtle)] pt-3">
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-[var(--color-accent)]">
              {isAr ? "تأكيد الحذف؟" : "Confirm delete?"}
            </span>
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy === "delete"}
              className="rounded-xs bg-[var(--color-accent)] px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-[var(--color-accent-hover)] active:scale-[0.99]"
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
              className="rounded-xs border border-[var(--border-subtle)] px-2 py-1 text-[11px] text-[var(--text-secondary)] transition hover:bg-[var(--surface-sunken)]"
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
              className="flex items-center gap-1.5 rounded-xs border border-[var(--border-subtle)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-sunken)] active:scale-[0.99]"
            >
              <Pencil size={13} />
              <span>{isAr ? "تعديل" : "Edit"}</span>
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={Boolean(busy)}
              className="flex items-center gap-1.5 rounded-xs border border-[var(--border-subtle)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] active:scale-[0.99]"
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
