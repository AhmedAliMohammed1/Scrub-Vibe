"use client";

import { useState } from "react";
import { Plus, MapPin } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { ShippingGovernorateOption } from "@/features/shipping/types";
import { AddressCard } from "./address-card";
import { AddressDialog } from "./address-dialog";
import type { CustomerAddress } from "./types";

type Props = {
  initialAddresses: CustomerAddress[];
  shippingLocations: ShippingGovernorateOption[];
  locale: Locale;
};

export function AddressBook({
  initialAddresses,
  shippingLocations,
  locale,
}: Props) {
  const isAr = locale === "ar";
  const [addresses, setAddresses] = useState<CustomerAddress[]>(initialAddresses);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);

  const handleOpenAdd = () => {
    setEditingAddress(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (address: CustomerAddress) => {
    setEditingAddress(address);
    setDialogOpen(true);
  };

  const handleSuccess = (savedAddress: CustomerAddress) => {
    setAddresses((prev) => {
      const exists = prev.some((a) => a.id === savedAddress.id);
      let updated = exists
        ? prev.map((a) => (a.id === savedAddress.id ? savedAddress : a))
        : [savedAddress, ...prev];

      // If the saved address is default, clear default flag on others
      if (savedAddress.isDefault) {
        updated = updated.map((a) =>
          a.id === savedAddress.id ? a : { ...a, isDefault: false },
        );
      }
      // Re-sort: default first, then most recent
      return updated.sort((a, b) => {
        if (a.isDefault === b.isDefault) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return a.isDefault ? -1 : 1;
      });
    });
  };

  const handleDeleted = (addressId: number) => {
    setAddresses((prev) => {
      const remaining = prev.filter((a) => a.id !== addressId);
      // If the deleted address was default and there are remaining addresses, mark first as default
      if (remaining.length > 0 && !remaining.some((a) => a.isDefault)) {
        remaining[0].isDefault = true;
      }
      return remaining;
    });
  };

  const handleDefaultSet = (addressId: number) => {
    setAddresses((prev) =>
      prev
        .map((a) => ({
          ...a,
          isDefault: a.id === addressId,
        }))
        .sort((a, b) => (a.id === addressId ? -1 : b.id === addressId ? 1 : 0)),
    );
  };

  return (
    <div className="mt-12">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <h2 className="font-serif text-2xl md:text-3xl text-[var(--text-primary)]">
            {isAr ? "عناوين التوصيل المحفوظة" : "Saved delivery addresses"}
          </h2>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {isAr
              ? "احفظ عناوين العيادة أو المستشفى أو المنزل لتسريع عملية الشراء."
              : "Save your clinic, hospital, or home delivery locations for quick checkout."}
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 rounded-xs bg-[var(--color-primary)] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-subtle transition-all hover:bg-[var(--color-primary-hover)] active:scale-[0.99]"
        >
          <Plus size={15} />
          <span>{isAr ? "إضافة عنوان جديد" : "Add New Address"}</span>
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="mt-6 rounded-xs border border-dashed border-[var(--border-subtle)] bg-[var(--surface-raised)] p-8 text-center">
          <MapPin size={32} className="mx-auto text-[var(--text-muted)]" />
          <p className="mt-3 font-medium text-sm text-[var(--text-primary)]">
            {isAr ? "لا توجد عناوين محفوظة بعد" : "No saved addresses yet"}
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {isAr
              ? "أضف عنوان عيادتك أو منزلك ليتم تعبئته تلقائياً عند إتمام الطلب."
              : "Add your clinic or home address to prefill details automatically during checkout."}
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xs border border-[var(--border-subtle)] bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] transition-all hover:border-[var(--border-strong)] hover:bg-[var(--surface-sunken)] active:scale-[0.99]"
          >
            <Plus size={14} />
            <span>{isAr ? "إضافة أول عنوان" : "Add Your First Address"}</span>
          </button>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {addresses.map((addr) => (
            <AddressCard
              key={addr.id}
              address={addr}
              shippingLocations={shippingLocations}
              locale={locale}
              onEdit={handleOpenEdit}
              onDeleted={handleDeleted}
              onDefaultSet={handleDefaultSet}
            />
          ))}
        </div>
      )}

      <AddressDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleSuccess}
        addressToEdit={editingAddress}
        shippingLocations={shippingLocations}
        locale={locale}
      />
    </div>
  );
}
