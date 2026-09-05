"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  parseLocale,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from "./validation";
import { getAuthCallbackUrl } from "./site-url";

export type AuthActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

function invalidState(
  error: {
    flatten(): { fieldErrors: Record<string, string[]> };
  },
  locale: "en" | "ar",
) {
  return {
    status: "error" as const,
    message:
      locale === "ar"
        ? "يرجى مراجعة الحقول المحددة."
        : "Please check the highlighted fields.",
    fieldErrors: error.flatten().fieldErrors,
  };
}

function values(formData: FormData) {
  return {
    locale: formData.get("locale"),
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };
}

export async function signInAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse(values(formData));
  if (!parsed.success)
    return invalidState(parsed.error, parseLocale(formData.get("locale")));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return {
      status: "error",
      message:
        parsed.data.locale === "ar"
          ? "البريد الإلكتروني أو كلمة المرور غير صحيحة."
          : "The email or password is incorrect.",
    };
  }

  redirect(`/${parsed.data.locale}/account`);
}

export async function signUpAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse(values(formData));
  if (!parsed.success)
    return invalidState(parsed.error, parseLocale(formData.get("locale")));

  const { locale, fullName, email, password } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: getAuthCallbackUrl(locale, `/${locale}/account`),
    },
  });

  if (error) {
    return {
      status: "error",
      message:
        locale === "ar"
          ? "تعذر إنشاء الحساب الآن. حاول مرة أخرى."
          : "We could not create the account. Please try again.",
    };
  }

  if (data.session) redirect(`/${locale}/account`);

  return {
    status: "success",
    message:
      locale === "ar"
        ? "تحقق من بريدك الإلكتروني لتأكيد الحساب."
        : "Check your email to confirm your account.",
  };
}

export async function requestPasswordResetAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = forgotPasswordSchema.safeParse(values(formData));
  if (!parsed.success)
    return invalidState(parsed.error, parseLocale(formData.get("locale")));

  const { locale, email } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getAuthCallbackUrl(
      locale,
      `/${locale}/account/update-password`,
    ),
  });

  if (error) {
    return {
      status: "error",
      message:
        locale === "ar"
          ? "تعذر إرسال رابط الاستعادة الآن. حاول لاحقاً."
          : "We could not send a recovery link. Please try again later.",
    };
  }

  return {
    status: "success",
    message:
      locale === "ar"
        ? "إذا كان الحساب موجوداً، ستصلك رسالة لاستعادة كلمة المرور."
        : "If that account exists, a recovery email is on its way.",
  };
}

export async function updatePasswordAction(
  _state: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = updatePasswordSchema.safeParse(values(formData));
  if (!parsed.success)
    return invalidState(parsed.error, parseLocale(formData.get("locale")));

  const { locale, password } = parsed.data;
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    return {
      status: "error",
      message:
        locale === "ar"
          ? "انتهت صلاحية رابط الاستعادة. اطلب رابطاً جديداً."
          : "This recovery link has expired. Request a new one.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return {
      status: "error",
      message:
        locale === "ar"
          ? "تعذر تحديث كلمة المرور. حاول مرة أخرى."
          : "We could not update your password. Please try again.",
    };
  }

  redirect(`/${locale}/account?password=updated`);
}

export async function signOutAction(formData: FormData) {
  const locale = parseLocale(formData.get("locale"));
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${locale}`);
}
