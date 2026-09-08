import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  mapAddressRowToDomain,
  type CustomerAddress,
  type CustomerAddressInput,
} from "./types";

export async function getCustomerAddresses(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<CustomerAddress[]> {
  const { data, error } = await supabase
    .from("customer_addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[addresses/getCustomerAddresses] Failed to fetch addresses", error);
    return [];
  }

  return (data ?? []).map(mapAddressRowToDomain);
}

export async function getCustomerAddressById(
  supabase: SupabaseClient<Database>,
  userId: string,
  addressId: number,
): Promise<CustomerAddress | null> {
  const { data, error } = await supabase
    .from("customer_addresses")
    .select("*")
    .eq("id", addressId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapAddressRowToDomain(data);
}

export async function createCustomerAddress(
  supabase: SupabaseClient<Database>,
  userId: string,
  input: CustomerAddressInput,
): Promise<CustomerAddress> {
  const { data, error } = await supabase
    .from("customer_addresses")
    .insert({
      user_id: userId,
      label: input.label,
      custom_label: input.customLabel ?? null,
      recipient_name: input.recipientName,
      phone: input.phone,
      governorate_code: input.governorateCode,
      city_code: input.cityCode,
      city: input.city,
      street_address: input.streetAddress,
      building: input.building ?? null,
      floor: input.floor ?? null,
      apartment: input.apartment ?? null,
      landmark: input.landmark ?? null,
      is_default: Boolean(input.isDefault),
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create address");
  }

  return mapAddressRowToDomain(data);
}

export async function updateCustomerAddress(
  supabase: SupabaseClient<Database>,
  userId: string,
  addressId: number,
  input: Partial<CustomerAddressInput>,
): Promise<CustomerAddress> {
  const updatePayload: Database["public"]["Tables"]["customer_addresses"]["Update"] = {};

  if (input.label !== undefined) updatePayload.label = input.label;
  if (input.customLabel !== undefined) updatePayload.custom_label = input.customLabel ?? null;
  if (input.recipientName !== undefined) updatePayload.recipient_name = input.recipientName;
  if (input.phone !== undefined) updatePayload.phone = input.phone;
  if (input.governorateCode !== undefined) updatePayload.governorate_code = input.governorateCode;
  if (input.cityCode !== undefined) updatePayload.city_code = input.cityCode;
  if (input.city !== undefined) updatePayload.city = input.city;
  if (input.streetAddress !== undefined) updatePayload.street_address = input.streetAddress;
  if (input.building !== undefined) updatePayload.building = input.building ?? null;
  if (input.floor !== undefined) updatePayload.floor = input.floor ?? null;
  if (input.apartment !== undefined) updatePayload.apartment = input.apartment ?? null;
  if (input.landmark !== undefined) updatePayload.landmark = input.landmark ?? null;
  if (input.isDefault !== undefined) updatePayload.is_default = Boolean(input.isDefault);

  const { data, error } = await supabase
    .from("customer_addresses")
    .update(updatePayload)
    .eq("id", addressId)
    .eq("user_id", userId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to update address");
  }

  return mapAddressRowToDomain(data);
}

export async function deleteCustomerAddress(
  supabase: SupabaseClient<Database>,
  userId: string,
  addressId: number,
): Promise<boolean> {
  const { error } = await supabase
    .from("customer_addresses")
    .delete()
    .eq("id", addressId)
    .eq("user_id", userId);

  if (error) {
    console.error("[addresses/deleteCustomerAddress] Failed to delete address", error);
    throw new Error(error.message);
  }

  return true;
}

export async function setDefaultCustomerAddress(
  supabase: SupabaseClient<Database>,
  userId: string,
  addressId: number,
): Promise<boolean> {
  const { error } = await supabase
    .from("customer_addresses")
    .update({ is_default: true })
    .eq("id", addressId)
    .eq("user_id", userId);

  if (error) {
    console.error("[addresses/setDefaultCustomerAddress] Failed to set default address", error);
    throw new Error(error.message);
  }

  return true;
}
