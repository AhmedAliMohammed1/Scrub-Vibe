"use server";

import { timingSafeEqual } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashToken } from "@/features/checkout/security";
import type { Locale } from "@/lib/i18n";

export async function checkEmailExistsAction(
  email: string,
): Promise<{ exists: boolean }> {
  const cleanEmail = email?.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) return { exists: false };

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("profiles")
      .select("id")
      .ilike("email", cleanEmail)
      .limit(1)
      .maybeSingle();

    return { exists: Boolean(data) };
  } catch (error) {
    console.error("[claim-actions] Check email exists failed", error);
    return { exists: false };
  }
}

export async function claimOrderWithPasswordAction({
  orderNumber,
  trackingToken,
  email,
  password,
  locale,
}: {
  orderNumber: string;
  trackingToken: string;
  email: string;
  password: string;
  locale: Locale;
}): Promise<{ success: boolean; error?: string }> {
  const ar = locale === "ar";
  if (!orderNumber || !trackingToken || !email || !password) {
    return {
      success: false,
      error: ar ? "يرجى إدخال كلمة المرور." : "Please enter your password.",
    };
  }

  const admin = createAdminClient();
  const { data: order, error: orderError } = await admin
    .from("orders")
    .select(
      "id, order_number, user_id, tracking_token_hash, customer_name, phone, governorate, city, street_address, building, floor, apartment, landmark",
    )
    .eq("order_number", orderNumber.toUpperCase())
    .maybeSingle();

  if (orderError || !order) {
    return {
      success: false,
      error: ar ? "لم يتم العثور على هذا الطلب." : "Order not found.",
    };
  }

  // Cryptographic token verification
  const tokenHash = hashToken(trackingToken);
  const a = Buffer.from(tokenHash, "hex");
  const b = Buffer.from(order.tracking_token_hash, "hex");
  const tokenValid = a.length === b.length && timingSafeEqual(a, b);
  if (!tokenValid) {
    return {
      success: false,
      error: ar
        ? "رمز الأمان غير صالح لهذا الطلب."
        : "Invalid tracking security token.",
    };
  }

  // Authenticate user with password
  const supabase = await createClient();
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

  if (authError || !authData.user) {
    return {
      success: false,
      error: ar ? "كلمة المرور غير صحيحة." : "Incorrect password.",
    };
  }

  const userId = authData.user.id;

  // Link order to user
  const { error: updateError } = await admin
    .from("orders")
    .update({ user_id: userId })
    .eq("id", order.id);

  if (updateError) {
    console.error("[claim-actions] Failed to link order to user", updateError);
    return {
      success: false,
      error: ar
        ? "تعذر ربط الطلب بالحساب. حاول مجدداً."
        : "Could not link order to account. Please try again.",
    };
  }

  // Copy order delivery address to user address book if none exists
  try {
    const { data: existingAddresses } = await admin
      .from("customer_addresses")
      .select("id")
      .eq("user_id", userId)
      .limit(1);

    if (!existingAddresses || existingAddresses.length === 0) {
      const { data: gov } = await admin
        .from("shipping_governorates")
        .select("code")
        .ilike("name_en", order.governorate)
        .maybeSingle();

      const governorateCode = gov?.code ?? "cairo";
      await admin.from("customer_addresses").insert({
        user_id: userId,
        label: "clinic",
        recipient_name: order.customer_name,
        phone: order.phone,
        governorate_code: governorateCode,
        city_code: "other",
        city: order.city,
        street_address: order.street_address,
        building: order.building,
        floor: order.floor,
        apartment: order.apartment,
        landmark: order.landmark,
        is_default: true,
      });
    }
  } catch (err) {
    console.warn("[claim-actions] Non-fatal address copy failed", err);
  }

  return { success: true };
}

export async function createAccountAndClaimOrderAction({
  orderNumber,
  trackingToken,
  email,
  password,
  fullName,
  phone,
  locale,
}: {
  orderNumber: string;
  trackingToken: string;
  email: string;
  password: string;
  fullName: string;
  phone: string;
  locale: Locale;
}): Promise<{ success: boolean; error?: string }> {
  const ar = locale === "ar";
  if (!orderNumber || !trackingToken || !email || !password) {
    return {
      success: false,
      error: ar ? "يرجى إدخال كلمة المرور." : "Please enter your password.",
    };
  }

  if (password.length < 8) {
    return {
      success: false,
      error: ar
        ? "يجب أن تكون كلمة المرور ٨ أحرف على الأقل."
        : "Password must be at least 8 characters.",
    };
  }

  const cleanEmail = email.trim().toLowerCase();
  const admin = createAdminClient();

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select(
      "id, order_number, user_id, tracking_token_hash, customer_name, phone, governorate, city, street_address, building, floor, apartment, landmark",
    )
    .eq("order_number", orderNumber.toUpperCase())
    .maybeSingle();

  if (orderError || !order) {
    return {
      success: false,
      error: ar ? "لم يتم العثور على هذا الطلب." : "Order not found.",
    };
  }

  // Token verification
  const tokenHash = hashToken(trackingToken);
  const a = Buffer.from(tokenHash, "hex");
  const b = Buffer.from(order.tracking_token_hash, "hex");
  const tokenValid = a.length === b.length && timingSafeEqual(a, b);
  if (!tokenValid) {
    return {
      success: false,
      error: ar
        ? "رمز الأمان غير صالح لهذا الطلب."
        : "Invalid tracking security token.",
    };
  }

  // Create user in Supabase Auth via admin client (pre-confirm email for seamless onboarding)
  const { data: userData, error: createError } =
    await admin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName.trim() || order.customer_name,
      },
    });

  if (createError || !userData.user) {
    console.error("[claim-actions] Admin create user failed", createError);
    if (
      createError?.message?.includes("already registered") ||
      createError?.message?.includes("already been registered")
    ) {
      return {
        success: false,
        error: ar
          ? "هذا البريد مسجل بالفعل. أدخل كلمة المرور لتسجيل الدخول."
          : "This email is already registered. Please enter your password to sign in.",
      };
    }
    return {
      success: false,
      error: ar
        ? "تعذر إنشاء الحساب الآن. حاول مجدداً."
        : "Could not create account. Please try again.",
    };
  }

  const userId = userData.user.id;

  // Log in using regular server client so session cookies are written
  const supabase = await createClient();
  await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  // Link order to new user
  await admin.from("orders").update({ user_id: userId }).eq("id", order.id);

  // Update profile phone & locale
  await admin
    .from("profiles")
    .update({
      phone: phone.trim() || order.phone,
      preferred_locale: locale,
    })
    .eq("id", userId);

  // Save order delivery address as default in customer_addresses
  try {
    const { data: gov } = await admin
      .from("shipping_governorates")
      .select("code")
      .ilike("name_en", order.governorate)
      .maybeSingle();

    const governorateCode = gov?.code ?? "cairo";
    await admin.from("customer_addresses").insert({
      user_id: userId,
      label: "clinic",
      recipient_name: fullName.trim() || order.customer_name,
      phone: phone.trim() || order.phone,
      governorate_code: governorateCode,
      city_code: "other",
      city: order.city,
      street_address: order.street_address,
      building: order.building,
      floor: order.floor,
      apartment: order.apartment,
      landmark: order.landmark,
      is_default: true,
    });
  } catch (err) {
    console.warn("[claim-actions] Non-fatal address copy failed", err);
  }

  return { success: true };
}
