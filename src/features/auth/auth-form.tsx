"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { Locale } from "@/lib/i18n";
import {
  requestPasswordResetAction,
  signInAction,
  signUpAction,
  updatePasswordAction,
} from "./actions";
import type { AuthActionState } from "./actions";

type Mode = "sign-in" | "sign-up" | "forgot-password" | "update-password";

const content = {
  en: {
    fullName: "Full name",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm password",
    signIn: "Sign in",
    signUp: "Create account",
    forgot: "Send recovery link",
    update: "Update password",
    pending: "Please wait…",
    forgotLink: "Forgot your password?",
    newAccount: "New to NOVA? Create an account",
    existingAccount: "Already have an account? Sign in",
    backToSignIn: "Back to sign in",
  },
  ar: {
    fullName: "الاسم الكامل",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    confirmPassword: "تأكيد كلمة المرور",
    signIn: "تسجيل الدخول",
    signUp: "إنشاء حساب",
    forgot: "إرسال رابط الاستعادة",
    update: "تحديث كلمة المرور",
    pending: "يرجى الانتظار…",
    forgotLink: "نسيت كلمة المرور؟",
    newAccount: "جديد في نوفا؟ أنشئ حساباً",
    existingAccount: "لديك حساب بالفعل؟ سجل الدخول",
    backToSignIn: "العودة إلى تسجيل الدخول",
  },
} as const;

const actions = {
  "sign-in": signInAction,
  "sign-up": signUpAction,
  "forgot-password": requestPasswordResetAction,
  "update-password": updatePasswordAction,
};

const initialAuthState: AuthActionState = { status: "idle" };

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <span className="mt-1 block text-[11px] text-[#a6432b]">{errors[0]}</span>
  );
}

export function AuthForm({ mode, locale }: { mode: Mode; locale: Locale }) {
  const t = content[locale];
  const [state, formAction, pending] = useActionState(
    actions[mode],
    initialAuthState,
  );
  const isPasswordForm = mode !== "forgot-password";
  const submitLabel = {
    "sign-in": t.signIn,
    "sign-up": t.signUp,
    "forgot-password": t.forgot,
    "update-password": t.update,
  }[mode];

  return (
    <form action={formAction} className="mt-10 space-y-5" noValidate>
      <input type="hidden" name="locale" value={locale} />
      {mode === "sign-up" && (
        <label className="block text-xs font-bold uppercase tracking-[.12em]">
          {t.fullName}
          <input
            type="text"
            name="fullName"
            autoComplete="name"
            required
            className="mt-2 h-12 w-full border border-black/20 bg-transparent px-4 font-normal normal-case outline-none focus:border-black"
          />
          <FieldError errors={state.fieldErrors?.fullName} />
        </label>
      )}
      {mode !== "update-password" && (
        <label className="block text-xs font-bold uppercase tracking-[.12em]">
          {t.email}
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            className="mt-2 h-12 w-full border border-black/20 bg-transparent px-4 font-normal normal-case outline-none focus:border-black"
          />
          <FieldError errors={state.fieldErrors?.email} />
        </label>
      )}
      {isPasswordForm && (
        <label className="block text-xs font-bold uppercase tracking-[.12em]">
          {t.password}
          <input
            type="password"
            name="password"
            autoComplete={
              mode === "sign-in" ? "current-password" : "new-password"
            }
            required
            minLength={mode === "sign-in" ? 1 : 8}
            className="mt-2 h-12 w-full border border-black/20 bg-transparent px-4 font-normal normal-case outline-none focus:border-black"
          />
          <FieldError errors={state.fieldErrors?.password} />
        </label>
      )}
      {(mode === "sign-up" || mode === "update-password") && (
        <label className="block text-xs font-bold uppercase tracking-[.12em]">
          {t.confirmPassword}
          <input
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            required
            minLength={8}
            className="mt-2 h-12 w-full border border-black/20 bg-transparent px-4 font-normal normal-case outline-none focus:border-black"
          />
          <FieldError errors={state.fieldErrors?.confirmPassword} />
        </label>
      )}
      {state.message && (
        <p
          aria-live="polite"
          className={`border px-4 py-3 text-xs leading-5 ${
            state.status === "success"
              ? "border-[#526744]/30 bg-[#526744]/8 text-[#3f5135]"
              : "border-[#a6432b]/30 bg-[#a6432b]/8 text-[#8c3624]"
          }`}
        >
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full bg-neutral-950 text-xs font-bold uppercase tracking-[.14em] text-white transition-opacity disabled:cursor-wait disabled:opacity-55"
      >
        {pending ? t.pending : submitLabel}
      </button>
      <div className="space-y-3 text-center text-xs">
        {mode === "sign-in" && (
          <>
            <Link
              className="block underline underline-offset-4"
              href={`/${locale}/account/forgot-password`}
            >
              {t.forgotLink}
            </Link>
            <Link
              className="block underline underline-offset-4"
              href={`/${locale}/account/sign-up`}
            >
              {t.newAccount}
            </Link>
          </>
        )}
        {mode === "sign-up" && (
          <Link
            className="underline underline-offset-4"
            href={`/${locale}/account`}
          >
            {t.existingAccount}
          </Link>
        )}
        {mode === "forgot-password" && (
          <Link
            className="underline underline-offset-4"
            href={`/${locale}/account`}
          >
            {t.backToSignIn}
          </Link>
        )}
      </div>
    </form>
  );
}
