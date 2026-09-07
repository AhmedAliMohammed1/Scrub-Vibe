export type ShippingCityOption = {
  code: string;
  nameEn: string;
  nameAr: string;
};

export type ShippingZoneOption = {
  id: number;
  code: string;
  nameEn: string;
  nameAr: string;
  shippingFeeMinor: number;
  freeShippingThresholdMinor: number | null;
  codEnabled: boolean;
  codSurchargeMinor: number;
  deliveryMinDays: number;
  deliveryMaxDays: number;
};

export type ShippingGovernorateOption = {
  code: string;
  nameEn: string;
  nameAr: string;
  cities: ShippingCityOption[];
  zone: ShippingZoneOption;
};

export type ShippingQuote = {
  baseMinor: number;
  discountMinor: number;
  codSurchargeMinor: number;
  shippingMinor: number;
  totalMinor: number;
  freeShippingApplied: boolean;
};

export function calculateShippingQuote(
  subtotalMinor: number,
  paymentMethod: string,
  zone: ShippingZoneOption | null,
): ShippingQuote | null {
  if (!zone || subtotalMinor < 0) return null;

  const freeShippingApplied =
    zone.freeShippingThresholdMinor !== null &&
    subtotalMinor >= zone.freeShippingThresholdMinor;
  const discountMinor = freeShippingApplied ? zone.shippingFeeMinor : 0;
  const codSurchargeMinor = paymentMethod === "cod" ? zone.codSurchargeMinor : 0;
  const shippingMinor =
    zone.shippingFeeMinor - discountMinor + codSurchargeMinor;

  return {
    baseMinor: zone.shippingFeeMinor,
    discountMinor,
    codSurchargeMinor,
    shippingMinor,
    totalMinor: subtotalMinor + shippingMinor,
    freeShippingApplied,
  };
}
