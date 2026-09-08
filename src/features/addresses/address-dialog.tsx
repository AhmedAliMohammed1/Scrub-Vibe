"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Home,
  Briefcase,
  MapPin,
  X,
  Loader2,
  Check,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { ShippingGovernorateOption } from "@/features/shipping/types";
import {
  createCustomerAddressAction,
  updateCustomerAddressAction,
} from "./actions";
import {
  ADDRESS_LABELS,
  type AddressLabel,
  type CustomerAddress,
} from "./types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (address: CustomerAddress) => void;
  addressToEdit?: CustomerAddress | null;
  shippingLocations: ShippingGovernorateOption[];
  locale: Locale;
};

const inputClass =
  "h-11 w-full border border-black/20 bg-white px-3 text-sm outline-none transition focus:border-[#0e7468]";

const labelIcons = {
  clinic: Building2,
  home: Home,
  work: Briefcase,
  other: MapPin,
};

export function AddressDialog({
  isOpen,
  onClose,
  onSuccess,
  addressToEdit,
  shippingLocations,
  locale,
}: Props) {
  const isAr = locale === "ar";

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="address-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative z-10 max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-none border border-black/10 bg-white p-6 shadow-2xl md:p-8">
        <div className="flex items-center justify-between border-b border-black/10 pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[.14em] text-[#0e7468]">
              {isAr ? "إدارة العناوين" : "ADDRESS MANAGEMENT"}
            </span>
            <h2 id="address-dialog-title" className="mt-1 font-serif text-2xl md:text-3xl">
              {addressToEdit
                ? isAr
                  ? "تعديل عنوان التوصيل"
                  : "Edit Delivery Address"
                : isAr
                ? "إضافة عنوان جديد"
                : "Add New Address"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isAr ? "إغلاق" : "Close"}
            className="grid size-9 place-items-center border border-black/10 text-neutral-600 transition hover:bg-neutral-100 hover:text-black"
          >
            <X size={18} />
          </button>
        </div>

        <AddressForm
          key={addressToEdit?.id ?? "new"}
          addressToEdit={addressToEdit}
          onClose={onClose}
          onSuccess={onSuccess}
          shippingLocations={shippingLocations}
          locale={locale}
        />
      </div>
    </div>
  );
}

type FormProps = {
  onClose: () => void;
  onSuccess: (address: CustomerAddress) => void;
  addressToEdit?: CustomerAddress | null;
  shippingLocations: ShippingGovernorateOption[];
  locale: Locale;
};

function AddressForm({
  onClose,
  onSuccess,
  addressToEdit,
  shippingLocations,
  locale,
}: FormProps) {
  const isAr = locale === "ar";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [label, setLabel] = useState<AddressLabel>(
    addressToEdit?.label ?? "clinic",
  );
  const [customLabel, setCustomLabel] = useState(
    addressToEdit?.customLabel ?? "",
  );
  const [recipientName, setRecipientName] = useState(
    addressToEdit?.recipientName ?? "",
  );
  const [phone, setPhone] = useState(addressToEdit?.phone ?? "");
  const [governorateCode, setGovernorateCode] = useState(
    addressToEdit?.governorateCode ?? (shippingLocations[0]?.code ?? ""),
  );
  const [cityCode, setCityCode] = useState(
    addressToEdit?.cityCode ?? (shippingLocations[0]?.cities[0]?.code ?? "other"),
  );
  const [customCity, setCustomCity] = useState(
    addressToEdit?.cityCode === "other" ? addressToEdit.city : "",
  );
  const [streetAddress, setStreetAddress] = useState(
    addressToEdit?.streetAddress ?? "",
  );
  const [building, setBuilding] = useState(addressToEdit?.building ?? "");
  const [floor, setFloor] = useState(addressToEdit?.floor ?? "");
  const [apartment, setApartment] = useState(addressToEdit?.apartment ?? "");
  const [landmark, setLandmark] = useState(addressToEdit?.landmark ?? "");
  const [isDefault, setIsDefault] = useState(addressToEdit?.isDefault ?? false);

  const selectedGovernorate =
    shippingLocations.find((item) => item.code === governorateCode) ?? null;

  const handleGovernorateChange = (code: string) => {
    setGovernorateCode(code);
    const gov = shippingLocations.find((item) => item.code === code);
    setCityCode(gov?.cities[0]?.code ?? "other");
    setCustomCity("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");

    const cityName =
      cityCode === "other"
        ? customCity.trim()
        : (selectedGovernorate?.cities.find((c) => c.code === cityCode)?.nameEn ?? "");

    const payload = {
      label,
      customLabel: label === "other" && customLabel.trim() ? customLabel.trim() : null,
      recipientName: recipientName.trim(),
      phone: phone.trim(),
      governorateCode,
      cityCode,
      city: cityName,
      streetAddress: streetAddress.trim(),
      building: building.trim() || null,
      floor: floor.trim() || null,
      apartment: apartment.trim() || null,
      landmark: landmark.trim() || null,
      isDefault,
    };

    try {
      const res = addressToEdit
        ? await updateCustomerAddressAction(addressToEdit.id, payload)
        : await createCustomerAddressAction(payload);

      if (!res.success || !res.data) {
        if (res.fieldErrors) {
          const firstErr = Object.values(res.fieldErrors)[0]?.[0];
          setError(firstErr ?? (isAr ? "بيانات غير صالحة." : "Invalid details."));
        } else {
          setError(
            res.error === "unauthenticated"
              ? isAr ? "يجب تسجيل الدخول أولاً." : "Please sign in first."
              : isAr ? "فشل حفظ العنوان. حاول مرة أخرى." : "Failed to save address. Please try again."
          );
        }
        setBusy(false);
        return;
      }

      onSuccess(res.data);
      onClose();
    } catch {
      setError(isAr ? "حدث خطأ غير متوقع." : "An unexpected error occurred.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      {/* Address Type / Label */}
      <div>
        <label className="block text-xs font-bold">
          {isAr ? "نوع المكان" : "Address Type"}
        </label>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(["clinic", "home", "work", "other"] as AddressLabel[]).map((lbl) => {
            const Icon = labelIcons[lbl];
            const active = label === lbl;
            return (
              <button
                key={lbl}
                type="button"
                onClick={() => setLabel(lbl)}
                className={`flex items-center justify-center gap-2 border px-3 py-2.5 text-xs font-semibold transition ${
                  active
                    ? "border-[#0e7468] bg-[#0e7468]/10 text-[#073b36]"
                    : "border-black/15 bg-neutral-50 text-neutral-600 hover:bg-white"
                }`}
              >
                <Icon size={16} />
                <span>{ADDRESS_LABELS[lbl][locale]}</span>
              </button>
            );
          })}
        </div>
        {label === "other" && (
          <div className="mt-2">
            <input
              type="text"
              placeholder={isAr ? "اسم المكان المخصص (اختياري)" : "Custom place name (e.g. Lab, Branch)"}
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              maxLength={50}
              className={inputClass}
            />
          </div>
        )}
      </div>

      {/* Contact Details */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold">
            {isAr ? "اسم المستلم" : "Recipient Full Name"}
          </label>
          <input
            type="text"
            required
            minLength={2}
            maxLength={120}
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder={isAr ? "د. أحمد علي" : "Dr. Ahmed Ali"}
            className={`mt-1 ${inputClass}`}
          />
        </div>
        <div>
          <label className="block text-xs font-bold">
            {isAr ? "رقم الموبايل المصري" : "Egyptian Mobile Number"}
          </label>
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01xxxxxxxxx"
            className={`mt-1 ${inputClass}`}
          />
        </div>
      </div>

      {/* Governorate & City Cascading */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-bold">
            {isAr ? "المحافظة" : "Governorate"}
          </label>
          <select
            required
            value={governorateCode}
            onChange={(e) => handleGovernorateChange(e.target.value)}
            className={`mt-1 ${inputClass}`}
          >
            <option value="" disabled>
              {isAr ? "اختر المحافظة" : "Choose governorate"}
            </option>
            {shippingLocations.map((loc) => (
              <option key={loc.code} value={loc.code}>
                {isAr ? loc.nameAr : loc.nameEn}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold">
            {isAr ? "المدينة / المنطقة" : "City / District"}
          </label>
          <select
            required
            value={cityCode}
            disabled={!selectedGovernorate}
            onChange={(e) => setCityCode(e.target.value)}
            className={`mt-1 ${inputClass}`}
          >
            <option value="" disabled>
              {isAr ? "اختر المدينة" : "Choose city"}
            </option>
            {selectedGovernorate?.cities.map((city) => (
              <option key={city.code} value={city.code}>
                {isAr ? city.nameAr : city.nameEn}
              </option>
            ))}
            <option value="other">{isAr ? "منطقة أخرى" : "Other area"}</option>
          </select>
        </div>
      </div>

      {cityCode === "other" && (
        <div>
          <label className="block text-xs font-bold">
            {isAr ? "اكتب اسم المدينة أو الحي" : "Enter City / Area"}
          </label>
          <input
            type="text"
            required
            minLength={2}
            maxLength={100}
            value={customCity}
            onChange={(e) => setCustomCity(e.target.value)}
            className={`mt-1 ${inputClass}`}
          />
        </div>
      )}

      {/* Street Address */}
      <div>
        <label className="block text-xs font-bold">
          {isAr ? "اسم الشارع وتفاصيل العنوان" : "Street Address"}
        </label>
        <input
          type="text"
          required
          minLength={5}
          maxLength={300}
          placeholder={isAr ? "شارع التحرير، بجوار المركز الطبي" : "El Tahrir St, Near Medical Center"}
          value={streetAddress}
          onChange={(e) => setStreetAddress(e.target.value)}
          className={`mt-1 ${inputClass}`}
        />
      </div>

      {/* Building / Floor / Clinic # */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-bold">
            {isAr ? "المبنى" : "Building"}
          </label>
          <input
            type="text"
            maxLength={50}
            value={building}
            onChange={(e) => setBuilding(e.target.value)}
            placeholder={isAr ? "عمارة ١٢" : "Bldg 12"}
            className={`mt-1 ${inputClass}`}
          />
        </div>
        <div>
          <label className="block text-xs font-bold">
            {isAr ? "الطابق" : "Floor"}
          </label>
          <input
            type="text"
            maxLength={30}
            value={floor}
            onChange={(e) => setFloor(e.target.value)}
            placeholder={isAr ? "الدور ٣" : "Fl 3"}
            className={`mt-1 ${inputClass}`}
          />
        </div>
        <div>
          <label className="block text-xs font-bold">
            {isAr ? "العيادة / الشقة" : "Clinic / Apt"}
          </label>
          <input
            type="text"
            maxLength={50}
            value={apartment}
            onChange={(e) => setApartment(e.target.value)}
            placeholder={isAr ? "عيادة ٥" : "Clinic 5"}
            className={`mt-1 ${inputClass}`}
          />
        </div>
      </div>

      {/* Landmark */}
      <div>
        <label className="block text-xs font-bold">
          {isAr ? "علامة مميزة (اختياري)" : "Landmark (optional)"}
        </label>
        <input
          type="text"
          maxLength={200}
          placeholder={isAr ? "أمام المستشفى العام" : "Opposite General Hospital"}
          value={landmark}
          onChange={(e) => setLandmark(e.target.value)}
          className={`mt-1 ${inputClass}`}
        />
      </div>

      {/* Is Default Checkbox */}
      <div className="pt-2">
        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="size-4 accent-[#0e7468]"
          />
          <span>
            {isAr
              ? "تعيين كعنوان توصيل افتراضي"
              : "Set as default delivery address"}
          </span>
        </label>
      </div>

      {error && (
        <p role="alert" className="border border-[#a6432b]/30 bg-[#a6432b]/8 p-3 text-xs text-[#8c3624]">
          {error}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-3 border-t border-black/10 pt-4">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="h-11 border border-black/20 px-5 text-xs font-bold uppercase tracking-wider text-neutral-700 transition hover:bg-neutral-50"
        >
          {isAr ? "إلغاء" : "Cancel"}
        </button>
        <button
          type="submit"
          disabled={busy}
          className="flex h-11 min-w-32 items-center justify-center gap-2 bg-[#073b36] px-6 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#0e7468] disabled:opacity-50"
        >
          {busy ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              <Check size={16} />
              <span>{addressToEdit ? (isAr ? "حفظ التعديل" : "Update") : (isAr ? "إضافة العنوان" : "Save Address")}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
