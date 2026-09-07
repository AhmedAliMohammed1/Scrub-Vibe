import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { ShippingGovernorateOption } from "./types";

type LocationRow = {
  code: string;
  name_en: string;
  name_ar: string;
  shipping_cities: {
    code: string;
    name_en: string;
    name_ar: string;
    position: number;
  }[];
  shipping_zones: {
    id: number;
    code: string;
    name_en: string;
    name_ar: string;
    shipping_fee_minor: number;
    free_shipping_threshold_minor: number | null;
    cod_enabled: boolean;
    cod_surcharge_minor: number;
    delivery_min_days: number;
    delivery_max_days: number;
  };
};

export async function getShippingLocations(
  supabase: SupabaseClient<Database>,
): Promise<ShippingGovernorateOption[]> {
  const { data, error } = await supabase
    .from("shipping_governorates")
    .select(`
      code, name_en, name_ar, position,
      shipping_cities(code, name_en, name_ar, position),
      shipping_zones!inner(
        id, code, name_en, name_ar, shipping_fee_minor,
        free_shipping_threshold_minor, cod_enabled, cod_surcharge_minor,
        delivery_min_days, delivery_max_days
      )
    `)
    .eq("is_active", true)
    .eq("shipping_zones.is_active", true)
    .order("position")
    .order("position", { referencedTable: "shipping_cities" });

  if (error) {
    throw new Error(`Shipping locations could not be loaded: ${error.message}`);
  }

  return ((data ?? []) as unknown as LocationRow[]).map((row) => ({
    code: row.code,
    nameEn: row.name_en,
    nameAr: row.name_ar,
    cities: row.shipping_cities.map((city) => ({
      code: city.code,
      nameEn: city.name_en,
      nameAr: city.name_ar,
    })),
    zone: {
      id: row.shipping_zones.id,
      code: row.shipping_zones.code,
      nameEn: row.shipping_zones.name_en,
      nameAr: row.shipping_zones.name_ar,
      shippingFeeMinor: row.shipping_zones.shipping_fee_minor,
      freeShippingThresholdMinor:
        row.shipping_zones.free_shipping_threshold_minor,
      codEnabled: row.shipping_zones.cod_enabled,
      codSurchargeMinor: row.shipping_zones.cod_surcharge_minor,
      deliveryMinDays: row.shipping_zones.delivery_min_days,
      deliveryMaxDays: row.shipping_zones.delivery_max_days,
    },
  }));
}
