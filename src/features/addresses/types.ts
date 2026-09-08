import type { Locale } from "@/lib/i18n";
import type { Database } from "@/types/database";

export type AddressLabel = "clinic" | "home" | "work" | "other";

export type AddressRow = Database["public"]["Tables"]["customer_addresses"]["Row"];

export type CustomerAddress = {
  id: number;
  userId: string;
  label: AddressLabel;
  customLabel: string | null;
  recipientName: string;
  phone: string;
  governorateCode: string;
  cityCode: string;
  city: string;
  streetAddress: string;
  building: string | null;
  floor: string | null;
  apartment: string | null;
  landmark: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CustomerAddressInput = {
  label: AddressLabel;
  customLabel?: string | null;
  recipientName: string;
  phone: string;
  governorateCode: string;
  cityCode: string;
  city: string;
  streetAddress: string;
  building?: string | null;
  floor?: string | null;
  apartment?: string | null;
  landmark?: string | null;
  isDefault?: boolean;
};

export const ADDRESS_LABELS: Record<
  AddressLabel,
  { en: string; ar: string; icon: "building-2" | "home" | "briefcase" | "map-pin" }
> = {
  clinic: {
    en: "Clinic / Hospital",
    ar: "عيادة / مستشفى",
    icon: "building-2",
  },
  home: {
    en: "Home",
    ar: "المنزل",
    icon: "home",
  },
  work: {
    en: "Work / Office",
    ar: "العمل / المكتب",
    icon: "briefcase",
  },
  other: {
    en: "Other",
    ar: "أخرى",
    icon: "map-pin",
  },
};

export function mapAddressRowToDomain(row: AddressRow): CustomerAddress {
  return {
    id: row.id,
    userId: row.user_id,
    label: (row.label as AddressLabel) || "clinic",
    customLabel: row.custom_label,
    recipientName: row.recipient_name,
    phone: row.phone,
    governorateCode: row.governorate_code,
    cityCode: row.city_code,
    city: row.city,
    streetAddress: row.street_address,
    building: row.building,
    floor: row.floor,
    apartment: row.apartment,
    landmark: row.landmark,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function formatAddressDisplay(
  address: Pick<CustomerAddress, "streetAddress" | "building" | "floor" | "apartment" | "city" | "landmark">,
  governorateName?: string,
  locale: Locale = "en",
): string {
  const isAr = locale === "ar";
  const parts: string[] = [];

  if (address.building) {
    parts.push(isAr ? `عمارة ${address.building}` : `Bldg ${address.building}`);
  }
  if (address.floor) {
    parts.push(isAr ? `طابق ${address.floor}` : `Fl ${address.floor}`);
  }
  if (address.apartment) {
    parts.push(isAr ? `شقة/عيادة ${address.apartment}` : `Apt/Clinic ${address.apartment}`);
  }

  parts.push(address.streetAddress);
  parts.push(address.city);

  if (governorateName) {
    parts.push(governorateName);
  }

  if (address.landmark) {
    parts.push(isAr ? `(علامة مميزة: ${address.landmark})` : `(Near: ${address.landmark})`);
  }

  return parts.join(isAr ? "، " : ", ");
}
