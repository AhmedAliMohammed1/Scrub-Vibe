"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Sparkles,
  UserCheck,
  UserPlus,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";
import {
  checkEmailExistsAction,
  claimOrderWithPasswordAction,
  createAccountAndClaimOrderAction,
} from "./claim-actions";

type Props = {
  orderNumber: string;
  trackingToken: string;
  customerName: string;
  email?: string | null;
  phone: string;
  locale: Locale;
  onSuccess?: () => void;
};

export function OrderAccountPrompt({
  orderNumber,
  trackingToken,
  customerName,
  email,
  phone,
  locale,
  onSuccess,
}: Props) {
  const ar = locale === "ar";
  const [checkingEmail, setCheckingEmail] = useState(true);
  const [accountExists, setAccountExists] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!email || !email.includes("@")) return;

    let active = true;
    void checkEmailExistsAction(email).then((result) => {
      if (!active) return;
      setAccountExists(result.exists);
      setCheckingEmail(false);
    });

    return () => {
      active = false;
    };
  }, [email]);

  if (dismissed || !email || !email.includes("@")) return null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password || password.length < 6) {
      setError(
        ar
          ? "يجب ألا تقل كلمة المرور عن ٦ أحرف."
          : "Password must be at least 6 characters.",
      );
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      if (accountExists) {
        const result = await claimOrderWithPasswordAction({
          orderNumber,
          trackingToken,
          email: email ?? "",
          password,
          locale,
        });

        if (!result.success) {
          setError(
            result.error ??
              (ar
                ? "تعذر ربط الطلب بالحساب. تأكد من صحة كلمة المرور."
                : "Could not link order. Check your password."),
          );
          setSubmitting(false);
          return;
        }
      } else {
        const result = await createAccountAndClaimOrderAction({
          orderNumber,
          trackingToken,
          email: email ?? "",
          password,
          fullName: customerName,
          phone,
          locale,
        });

        if (!result.success) {
          setError(
            result.error ??
              (ar
                ? "تعذر إنشاء الحساب الآن. حاول مجدداً."
                : "Could not create account. Please try again."),
          );
          setSubmitting(false);
          return;
        }
      }

      setSuccess(true);
      onSuccess?.();
    } catch {
      setError(
        ar
          ? "حدث خطأ غير متوقع. حاول مرة أخرى."
          : "An unexpected error occurred. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="mt-8 overflow-hidden rounded-xs border border-[#0e7468]/30 bg-[#f0f5f3] p-5 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#073b36] text-white">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.14em] text-[#0e7468]">
                {ar ? "تم تأكيد الارتباط" : "ORDER LINKED"}
              </p>
              <h3 className="font-serif text-lg text-[#073b36]">
                {ar
                  ? "تم ربط هذا الطلب بحسابك وحفظ بياناتك بنجاح!"
                  : "This order is now linked to your account!"}
              </h3>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                {ar
                  ? "يمكنك الآن متابعة جميع طلباتك وفواتيرك وعناوينك في أي وقت من لوحة حسابك."
                  : "You can now view all your orders, invoices, and saved addresses anytime in your account."}
              </p>
            </div>
          </div>
          <Link
            href={`/${locale}/account` as Route}
            className="inline-flex h-11 items-center justify-center rounded-xs bg-[#073b36] px-5 text-xs font-bold uppercase tracking-[.14em] text-white transition hover:bg-[#0e7468]"
          >
            {ar ? "فتح حسابي" : "Go to account"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="mt-8 rounded-xs border border-[#0e7468]/25 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="grid size-10 shrink-0 place-items-center rounded-xs bg-[#073b36]/10 text-[#073b36]">
            {accountExists ? <KeyRound size={20} /> : <Sparkles size={20} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-xs bg-[#0e7468]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[.1em] text-[#073b36]">
                {accountExists
                  ? ar
                    ? "حساب مسجل مسبقاً"
                    : "Existing account detected"
                  : ar
                    ? "توفير وقت لطلباتك القادمة"
                    : "Save details for next time"}
              </span>
            </div>
            <h2 className="mt-2 font-serif text-xl sm:text-2xl text-[var(--text-strong)]">
              {accountExists
                ? ar
                  ? "اربط هذا الطلب بحسابك المسجل"
                  : "Link this order to your existing account"
                : ar
                  ? "احفظ بياناتك وأنشئ حساباً لطلباتك القادمة"
                  : "Save your details & create an account"}
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-secondary)] max-w-2xl">
              {accountExists
                ? ar
                  ? `وجدنا حساباً مسجلاً بالبريد (${email}). أدخل كلمة المرور لربط هذا الطلب تلقائياً ومتابعته في سجل طلباتك.`
                  : `An account was found for (${email}). Enter your password to automatically link this order to your order history.`
                : ar
                  ? `أدخل كلمة مرور فقط لحفظ عنوان التوصيل (${customerName} - ${phone}) وتسهيل طلباتك المستقبلية بضغطة زر.`
                  : `Set a password to save your delivery address (${customerName} - ${phone}) and speed up your future orders.`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-xs font-semibold text-neutral-400 hover:text-neutral-700"
          aria-label={ar ? "تخطي" : "Skip"}
        >
          ✕
        </button>
      </div>

      {checkingEmail ? (
        <div className="mt-5 flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <Loader2 className="animate-spin" size={14} />
          <span>
            {ar ? "جارٍ التحقق من الحساب…" : "Checking account status…"}
          </span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="max-w-md">
            <label className="block text-xs font-bold text-[var(--text-muted)]">
              {accountExists
                ? ar
                  ? "كلمة المرور الخاصة بحسابك"
                  : "Enter your account password"
                : ar
                  ? "اختر كلمة مرور للحساب الجديد (٨ أحرف على الأقل)"
                  : "Choose a password (min 8 characters)"}
            </label>
            <div className="relative mt-1.5">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={accountExists ? 6 : 8}
                autoComplete={
                  accountExists ? "current-password" : "new-password"
                }
                placeholder="••••••••"
                className="h-11 w-full rounded-xs border border-[var(--border-subtle)] bg-white px-4 pe-10 text-sm text-[var(--text-strong)] outline-none transition focus:border-[#0e7468] focus:ring-2 focus:ring-[#0e7468]/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 end-0 flex items-center pe-3 text-neutral-400 hover:text-neutral-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-xs border border-[#a5472f]/30 bg-[#a5472f]/10 px-3.5 py-2 text-xs font-semibold text-[#a5472f]">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xs bg-[#073b36] px-6 text-xs font-bold uppercase tracking-[.14em] text-white shadow-xs transition hover:bg-[#0e7468] disabled:opacity-50 active:scale-[0.99]"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={15} />
                  <span>{ar ? "جارٍ الحفظ…" : "Saving…"}</span>
                </>
              ) : accountExists ? (
                <>
                  <UserCheck size={16} />
                  <span>
                    {ar ? "تسجيل الدخول وربط الطلب" : "Sign In & Link Order"}
                  </span>
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  <span>
                    {ar
                      ? "إنشاء حساب وحفظ البيانات"
                      : "Create Account & Save Details"}
                  </span>
                </>
              )}
            </button>

            {accountExists && (
              <Link
                href={`/${locale}/account/forgot-password` as Route}
                className="text-xs text-[var(--text-muted)] underline underline-offset-4 hover:text-[#073b36]"
              >
                {ar ? "نسيت كلمة المرور؟" : "Forgot password?"}
              </Link>
            )}

            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="text-xs text-neutral-400 hover:text-neutral-700"
            >
              {ar ? "ليس الآن" : "Not now"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
