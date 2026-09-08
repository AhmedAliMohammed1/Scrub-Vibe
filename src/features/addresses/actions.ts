"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createCustomerAddress,
  deleteCustomerAddress,
  setDefaultCustomerAddress,
  updateCustomerAddress,
} from "./repository";
import { addressInputSchema } from "./validation";
import type { CustomerAddress } from "./types";

export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createCustomerAddressAction(
  rawInput: unknown,
): Promise<ActionResponse<CustomerAddress>> {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return { success: false, error: "unauthenticated" };
  }

  const parsed = addressInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: "invalid_input",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const address = await createCustomerAddress(supabase, userId, parsed.data);
    revalidatePath("/[locale]/account", "page");
    revalidatePath("/[locale]/checkout", "page");
    return { success: true, data: address };
  } catch (error) {
    console.error("[addresses/createAction] Error", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "create_failed",
    };
  }
}

export async function updateCustomerAddressAction(
  addressId: number,
  rawInput: unknown,
): Promise<ActionResponse<CustomerAddress>> {
  if (!Number.isInteger(addressId) || addressId <= 0) {
    return { success: false, error: "invalid_address_id" };
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return { success: false, error: "unauthenticated" };
  }

  const parsed = addressInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: "invalid_input",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const address = await updateCustomerAddress(
      supabase,
      userId,
      addressId,
      parsed.data,
    );
    revalidatePath("/[locale]/account", "page");
    revalidatePath("/[locale]/checkout", "page");
    return { success: true, data: address };
  } catch (error) {
    console.error("[addresses/updateAction] Error", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "update_failed",
    };
  }
}

export async function deleteCustomerAddressAction(
  addressId: number,
): Promise<ActionResponse<null>> {
  if (!Number.isInteger(addressId) || addressId <= 0) {
    return { success: false, error: "invalid_address_id" };
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return { success: false, error: "unauthenticated" };
  }

  try {
    await deleteCustomerAddress(supabase, userId, addressId);
    revalidatePath("/[locale]/account", "page");
    revalidatePath("/[locale]/checkout", "page");
    return { success: true };
  } catch (error) {
    console.error("[addresses/deleteAction] Error", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "delete_failed",
    };
  }
}

export async function setDefaultCustomerAddressAction(
  addressId: number,
): Promise<ActionResponse<null>> {
  if (!Number.isInteger(addressId) || addressId <= 0) {
    return { success: false, error: "invalid_address_id" };
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return { success: false, error: "unauthenticated" };
  }

  try {
    await setDefaultCustomerAddress(supabase, userId, addressId);
    revalidatePath("/[locale]/account", "page");
    revalidatePath("/[locale]/checkout", "page");
    return { success: true };
  } catch (error) {
    console.error("[addresses/setDefaultAction] Error", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "set_default_failed",
    };
  }
}
