"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import {
  AlertCircle,
  Check,
  Clock3,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  PackageCheck,
  Phone,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import { createClient } from "@/lib/supabase/client";
import type { TrackedOrder } from "./types";
import { OrderAccountPrompt } from "./order-account-prompt";
import { PaymentProofReupload } from "./payment-proof-reupload";

const progress = [
  "confirmed",
  "processing",
  "ready_to_ship",
  "shipped",
  "out_for_delivery",
  "delivered",
] as const;

type LockedInfo = {
  hasAccount: boolean;
  email: string | null;
  phoneHint: string | null;
};

type FetchResult =
  | { state: "ready"; order: TrackedOrder; lockedInfo: null }
  | { state: "locked"; order: null; lockedInfo: LockedInfo }
  | { state: "error"; order: null; lockedInfo: null };

function storedToken(orderNumber: string) {
  try {
    const saved = JSON.parse(
      localStorage.getItem("scrub-vibe-order-tokens") ?? "{}",
    ) as Record<string, string>;
    return saved[orderNumber] ?? "";
  } catch {
    return "";
  }
}

async function fetchTrackedOrder(
  orderNumber: string,
  token?: string,
  phone?: string,
): Promise<FetchResult> {
  const query = new URLSearchParams();
  if (token) query.set("token", token);
  if (phone) query.set("phone", phone);

  const response = await fetch(
    `/api/orders/${encodeURIComponent(orderNumber)}${query.toString() ? `?${query.toString()}` : ""}`,
    { cache: "no-store" },
  );
  if (response.status === 401) {
    const data = (await response.json().catch(() => ({}))) as {
      has_account?: boolean;
      email?: string | null;
      phone_hint?: string | null;
    };
    return {
      state: "locked",
      order: null,
      lockedInfo: {
        hasAccount: Boolean(data.has_account),
        email: data.email ?? null,
        phoneHint: data.phone_hint ?? null,
      },
    };
  }
  if (!response.ok) return { state: "error", order: null, lockedInfo: null };
  return {
    state: "ready",
    order: (await response.json()) as TrackedOrder,
    lockedInfo: null,
  };
}

export function OrderTracker({
  locale,
  orderNumber,
  initialToken,
  initialPhone,
}: {
  locale: Locale;
  orderNumber: string;
  initialToken?: string;
  initialPhone?: string;
}) {
  const ar = locale === "ar";
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "locked" | "error">(
    "loading",
  );
  const [lockedInfo, setLockedInfo] = useState<LockedInfo | null>(null);
  const [activeToken, setActiveToken] = useState<string>(initialToken || "");
  const [activePhone, setActivePhone] = useState<string>(initialPhone || "");

  // Unlocking method and form inputs
  const [unlockMethod, setUnlockMethod] = useState<"password" | "phone" | "token">("password");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phoneInput, setPhoneInput] = useState(initialPhone || "");
  const [manualToken, setManualToken] = useState(initialToken || "");
  const [unlockError, setUnlockError] = useState("");
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    let active = true;
    const urlParams =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : null;
    const resolvedToken =
      initialToken || urlParams?.get("token") || storedToken(orderNumber);
    const resolvedPhone = initialPhone || urlParams?.get("phone") || "";

    if (resolvedToken) {
      try {
        const saved = JSON.parse(
          localStorage.getItem("scrub-vibe-order-tokens") ?? "{}",
        ) as Record<string, string>;
        saved[orderNumber] = resolvedToken;
        localStorage.setItem("scrub-vibe-order-tokens", JSON.stringify(saved));
      } catch {}
    }

    void fetchTrackedOrder(orderNumber, resolvedToken, resolvedPhone).then(
      (result) => {
        if (!active) return;
        if (resolvedToken) setActiveToken(resolvedToken);
        if (resolvedPhone) setActivePhone(resolvedPhone);
        setOrder(result.order);
        setState(result.state);
        if (result.lockedInfo) {
          setLockedInfo(result.lockedInfo);
          if (result.lockedInfo.email) {
            setLoginEmail(result.lockedInfo.email);
          }
          if (!result.lockedInfo.hasAccount) {
            setUnlockMethod("phone");
          }
        }
      },
    );
    return () => {
      active = false;
    };
  }, [orderNumber, initialToken, initialPhone]);

  async function handleUnlockWithPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUnlockError("");
    const targetEmail = (loginEmail || lockedInfo?.email || "").trim();
    if (!targetEmail || !loginPassword) {
      setUnlockError(
        ar
          ? "يرجى كتابة البريد الإلكتروني وكلمة المرور."
          : "Please enter both email and password.",
      );
      return;
    }
    setUnlocking(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: targetEmail.toLowerCase(),
        password: loginPassword,
      });
      if (authError) {
        setUnlockError(
          ar
            ? "كلمة المرور أو البريد الإلكتروني غير صحيح."
            : "Incorrect password or email.",
        );
        setUnlocking(false);
        return;
      }
      const result = await fetchTrackedOrder(orderNumber, activeToken, activePhone);
      setOrder(result.order);
      setState(result.state);
      if (result.lockedInfo) setLockedInfo(result.lockedInfo);
    } catch {
      setUnlockError(
        ar
          ? "حدث خطأ في الاتصال بالخادم."
          : "Server connection error. Please try again.",
      );
    } finally {
      setUnlocking(false);
    }
  }

  async function handleUnlockWithPhone(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUnlockError("");
    const candidatePhone = phoneInput.trim();
    if (!candidatePhone) {
      setUnlockError(
        ar
          ? "يرجى كتابة رقم الهاتف المستخدم في الطلب."
          : "Please enter the phone number used at checkout.",
      );
      return;
    }
    setUnlocking(true);
    try {
      const result = await fetchTrackedOrder(orderNumber, activeToken, candidatePhone);
      if (result.state === "ready") {
        setActivePhone(candidatePhone);
        setOrder(result.order);
        setState("ready");
      } else {
        setUnlockError(
          ar
            ? "رقم الهاتف غير مطابق لبيانات هذا الطلب."
            : "Phone number does not match this order.",
        );
      }
    } catch {
      setUnlockError(
        ar
          ? "حدث خطأ في الاتصال بالخادم."
          : "Server connection error. Please try again.",
      );
    } finally {
      setUnlocking(false);
    }
  }

  async function handleUnlockWithToken(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUnlockError("");
    const candidateToken = manualToken.trim();
    if (!candidateToken) {
      setUnlockError(
        ar ? "يرجى إدخال رمز التتبع." : "Please enter your tracking token.",
      );
      return;
    }
    setUnlocking(true);
    try {
      const result = await fetchTrackedOrder(orderNumber, candidateToken, activePhone);
      if (result.state === "ready") {
        setActiveToken(candidateToken);
        try {
          const saved = JSON.parse(
            localStorage.getItem("scrub-vibe-order-tokens") ?? "{}",
          ) as Record<string, string>;
          saved[orderNumber] = candidateToken;
          localStorage.setItem("scrub-vibe-order-tokens", JSON.stringify(saved));
        } catch {}
        setOrder(result.order);
        setState("ready");
      } else {
        setUnlockError(
          ar
            ? "رمز التتبع غير صحيح أو منتهي الصلاحية."
            : "Invalid or expired tracking token.",
        );
      }
    } catch {
      setUnlockError(
        ar
          ? "حدث خطأ في الاتصال بالخادم."
          : "Server connection error. Please try again.",
      );
    } finally {
      setUnlocking(false);
    }
  }

  if (state === "loading") {
    return (
      <div className="flex min-h-[55vh] items-center justify-center py-24 text-center">
        <div className="space-y-3">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-[#0e7468] border-t-transparent" />
          <p className="text-xs font-bold uppercase tracking-[.14em] text-[var(--text-muted)]">
            {ar ? "جارٍ استرجاع بيانات الطلب…" : "Loading order details…"}
          </p>
        </div>
      </div>
    );
  }

  if (state === "locked") {
    const hasAccount = Boolean(lockedInfo?.hasAccount);
    return (
      <main className="mx-auto min-h-[65vh] max-w-lg px-5 py-16 sm:py-24">
        <div className="rounded-xs border border-[var(--border-subtle)] bg-white p-6 shadow-xs sm:p-8">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#f0f5f3] text-[#073b36]">
            <Lock size={22} strokeWidth={1.8} aria-hidden="true" />
          </div>
          <p className="eyebrow mt-4 text-center text-[#a5472f]">
            {hasAccount
              ? ar
                ? "طلب مرتبط بحساب مسجل"
                : "ACCOUNT-LINKED ORDER"
              : ar
                ? "طلب محمي بخصوصية"
                : "PROTECTED ORDER"}
          </p>
          <h1 className="mt-2 text-center font-serif text-2xl sm:text-3xl text-[var(--text-strong)]">
            {ar ? "افتح تتبع طلبك" : "Unlock Order Tracking"}
          </h1>
          <p className="mt-2 text-center text-xs leading-relaxed text-[var(--text-muted)]">
            {hasAccount
              ? ar
                ? "هذا الطلب مسجل بحساب على متجرنا. يرجى إدخال كلمة المرور أو تأكيد رقم هاتفك لعرض حالة الطلب وتحديث إيصال الدفع."
                : "This order is linked to a registered customer account. Sign in with your password or confirm your mobile number to view details and re-upload payment proof."
              : ar
                ? "لحماية خصوصية بياناتك، يرجى تأكيد رقم هاتفك المستخدم في الطلب أو إدخال رمز التتبع."
                : "To protect your order details, please confirm the phone number used at checkout or enter your tracking token."}
          </p>

          {/* Unlock Method Segmented Tabs */}
          <div className="mt-6 flex rounded-xs border border-[var(--border-subtle)] bg-[#f6f7f4] p-1 text-xs">
            {hasAccount && (
              <button
                type="button"
                onClick={() => {
                  setUnlockMethod("password");
                  setUnlockError("");
                }}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xs py-2 font-bold transition ${
                  unlockMethod === "password"
                    ? "bg-white text-[#073b36] shadow-xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text-strong)]"
                }`}
              >
                <KeyRound size={14} />
                <span>{ar ? "كلمة المرور" : "Password"}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setUnlockMethod("phone");
                setUnlockError("");
              }}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xs py-2 font-bold transition ${
                unlockMethod === "phone"
                  ? "bg-white text-[#073b36] shadow-xs"
                  : "text-[var(--text-muted)] hover:text-[var(--text-strong)]"
              }`}
            >
              <Phone size={14} />
              <span>{ar ? "رقم الهاتف" : "Phone"}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setUnlockMethod("token");
                setUnlockError("");
              }}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xs py-2 font-bold transition ${
                unlockMethod === "token"
                  ? "bg-white text-[#073b36] shadow-xs"
                  : "text-[var(--text-muted)] hover:text-[var(--text-strong)]"
              }`}
            >
              <ShieldCheck size={14} />
              <span>{ar ? "رمز التتبع" : "Token"}</span>
            </button>
          </div>

          {/* Error Banner */}
          {unlockError && (
            <div className="mt-4 flex items-center gap-2 rounded-xs border border-[#a5472f]/30 bg-[#a5472f]/10 p-3 text-xs font-semibold text-[#a5472f]">
              <AlertCircle size={16} className="shrink-0" />
              <span>{unlockError}</span>
            </div>
          )}

          {/* Form 1: Password Unlock */}
          {unlockMethod === "password" && (
            <form onSubmit={handleUnlockWithPassword} className="mt-5 space-y-3">
              <div>
                <label
                  className="block text-[11px] font-bold uppercase tracking-[.14em] text-[var(--text-muted)]"
                  htmlFor="unlock-email"
                >
                  {ar ? "البريد الإلكتروني" : "Email Address"}
                </label>
                <input
                  id="unlock-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="doctor@example.com"
                  className="mt-1 h-11 w-full rounded-xs border border-[var(--border-subtle)] bg-[var(--surface-canvas)] px-3.5 text-xs text-[var(--text-strong)] outline-none focus:border-[#0e7468]"
                  required
                />
              </div>
              <div>
                <label
                  className="block text-[11px] font-bold uppercase tracking-[.14em] text-[var(--text-muted)]"
                  htmlFor="unlock-password"
                >
                  {ar ? "كلمة المرور الخاصة بحسابك" : "Account Password"}
                </label>
                <div className="relative mt-1">
                  <input
                    id="unlock-password"
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 w-full rounded-xs border border-[var(--border-subtle)] bg-[var(--surface-canvas)] px-3.5 pr-10 text-xs text-[var(--text-strong)] outline-none focus:border-[#0e7468]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 grid w-10 place-items-center text-neutral-400 hover:text-neutral-700"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={unlocking}
                className="mt-2 h-11 w-full rounded-xs bg-[#073b36] text-xs font-bold uppercase tracking-[.14em] text-white shadow-xs transition hover:bg-[#0e7468] disabled:opacity-50"
              >
                {unlocking
                  ? ar
                    ? "جارٍ التحقق…"
                    : "Verifying…"
                  : ar
                    ? "تسجيل الدخول وفتح بيانات الطلب"
                    : "Sign In & Unlock Order"}
              </button>
            </form>
          )}

          {/* Form 2: Phone Unlock */}
          {unlockMethod === "phone" && (
            <form onSubmit={handleUnlockWithPhone} className="mt-5 space-y-3">
              <div>
                <label
                  className="block text-[11px] font-bold uppercase tracking-[.14em] text-[var(--text-muted)]"
                  htmlFor="unlock-phone"
                >
                  {ar ? "رقم الهاتف المستخدم في الطلب" : "Checkout Mobile Number"}
                </label>
                {lockedInfo?.phoneHint && (
                  <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                    {ar
                      ? `رقم الهاتف ينتهي بالأرقام: ••••${lockedInfo.phoneHint}`
                      : `Registered phone ends in: ••••${lockedInfo.phoneHint}`}
                  </p>
                )}
                <input
                  id="unlock-phone"
                  type="tel"
                  dir="ltr"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="01012345678"
                  className="mt-1 h-11 w-full rounded-xs border border-[var(--border-subtle)] bg-[var(--surface-canvas)] px-3.5 text-xs text-[var(--text-strong)] outline-none focus:border-[#0e7468]"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={unlocking}
                className="mt-2 h-11 w-full rounded-xs bg-[#073b36] text-xs font-bold uppercase tracking-[.14em] text-white shadow-xs transition hover:bg-[#0e7468] disabled:opacity-50"
              >
                {unlocking
                  ? ar
                    ? "جارٍ التحقق…"
                    : "Verifying…"
                  : ar
                    ? "تأكيد رقم الهاتف وفتح الطلب"
                    : "Confirm Phone & Unlock Order"}
              </button>
            </form>
          )}

          {/* Form 3: Token Unlock */}
          {unlockMethod === "token" && (
            <form onSubmit={handleUnlockWithToken} className="mt-5 space-y-3">
              <div>
                <label
                  className="block text-[11px] font-bold uppercase tracking-[.14em] text-[var(--text-muted)]"
                  htmlFor="tracking-token"
                >
                  {ar ? "رمز التتبع السري" : "Tracking Security Token"}
                </label>
                <input
                  id="tracking-token"
                  dir="ltr"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="••••••••••••••••••••••••••••••••"
                  className="mt-1 h-11 w-full rounded-xs border border-[var(--border-subtle)] bg-[var(--surface-canvas)] px-3.5 text-xs text-[var(--text-strong)] outline-none focus:border-[#0e7468]"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={unlocking}
                className="mt-2 h-11 w-full rounded-xs bg-[#073b36] text-xs font-bold uppercase tracking-[.14em] text-white shadow-xs transition hover:bg-[#0e7468] disabled:opacity-50"
              >
                {unlocking
                  ? ar
                    ? "جارٍ التحقق…"
                    : "Verifying…"
                  : ar
                    ? "فتح بيانات الطلب بالرمز"
                    : "Unlock Order with Token"}
              </button>
            </form>
          )}

          <Link
            href={`/${locale}/account` as Route}
            className="mt-5 block text-center text-xs font-semibold text-[var(--text-muted)] underline underline-offset-4 hover:text-[#073b36]"
          >
            {ar ? "الانتقال لصفحة تسجيل الدخول" : "Go to Account Sign In"}
          </Link>
        </div>
      </main>
    );
  }

  if (state === "error" || !order) {
    return (
      <main className="mx-auto min-h-[55vh] max-w-lg px-5 py-24 text-center">
        <div className="rounded-xs border border-[var(--border-subtle)] bg-white p-8 shadow-xs">
          <h2 className="font-serif text-2xl text-[var(--text-strong)]">
            {ar ? "تعذر العثور على هذا الطلب" : "Order not found"}
          </h2>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            {ar
              ? "يرجى التحقق من صحة رقم الطلب والرابط المرسل إليك عبر البريد."
              : "Please verify the order number and tracking link from your email."}
          </p>
          <Link
            href={`/${locale}/shop` as Route}
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xs bg-[#073b36] px-6 text-xs font-bold uppercase tracking-[.14em] text-white hover:bg-[#0e7468]"
          >
            {ar ? "العودة للمتجر" : "Back to shop"}
          </Link>
        </div>
      </main>
    );
  }

  const currentIndex = progress.indexOf(
    order.status as (typeof progress)[number],
  );
  const paymentLabel: Record<TrackedOrder["payment_status"], [string, string]> =
    {
      pending: ["Payment in progress", "الدفع قيد التنفيذ"],
      proof_submitted: ["Proof under review", "إيصال الدفع قيد المراجعة"],
      paid: ["Payment verified", "تم الدفع بنجاح"],
      partially_refunded: ["Payment partially refunded", "تم رد جزء من المبلغ"],
      rejected: ["Payment proof rejected", "تم رفض إيصال الدفع"],
      failed: ["Payment failed", "فشل الدفع"],
      cod_due: order.cod_deposit_minor
        ? [
            "Deposit verified · balance due on delivery",
            "تم تأكيد المقدم · الباقي عند الاستلام",
          ]
        : ["Cash due on delivery", "الدفع عند الاستلام"],
      cod_collected: ["Cash collected", "تم تحصيل المبلغ"],
      refunded: ["Payment refunded", "تم رد المبلغ"],
    };

  return (
    <main className="mx-auto min-h-[70vh] max-w-5xl px-5 py-10 sm:px-6 md:px-10 md:py-16">
      {/* Tracker Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
        <div>
          <p className="eyebrow text-[#0e7468]">
            {ar ? "تتبع حالة الطلب" : "ORDER STATUS"}
          </p>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl md:text-5xl text-[var(--text-strong)]">
            {order.order_number}
          </h1>
        </div>
        <div className="rounded-xs border border-[#0e7468]/30 bg-[#dce9e5] px-4 py-2 text-xs font-bold text-[#073b36]">
          {paymentLabel[order.payment_status][ar ? 1 : 0]}
        </div>
      </div>

      {/* Post-Purchase Account Suggestion */}
      {!order.has_account && (
        <OrderAccountPrompt
          orderNumber={order.order_number}
          trackingToken={activeToken || manualToken || storedToken(order.order_number)}
          customerName={order.customer_name}
          email={order.email}
          phone={order.phone}
          locale={locale}
          onSuccess={() => {
            setOrder((prev) =>
              prev ? { ...prev, has_account: true, is_owner: true } : null,
            );
          }}
        />
      )}

      {/* Payment Proof Re-upload when rejected */}
      {order.payment_status === "rejected" &&
        order.status !== "cancelled" &&
        order.status !== "returned" && (
          <PaymentProofReupload
            orderNumber={order.order_number}
            trackingToken={activeToken || manualToken || storedToken(order.order_number)}
            phone={activePhone || phoneInput}
            paymentMethod={order.payment_method}
            codDepositMinor={order.cod_deposit_minor}
            totalMinor={order.total_minor}
            reviewNote={order.payment_proof?.review_note}
            locale={locale}
            onSuccess={() => {
              setOrder((prev) =>
                prev
                  ? {
                      ...prev,
                      status: "payment_review",
                      payment_status: "proof_submitted",
                    }
                  : null,
              );
            }}
          />
        )}

      {/* Progress Timeline Stepper */}
      {order.status === "cancelled" ||
      order.status === "partially_returned" ||
      order.status === "returned" ? (
        <div className="mt-8 rounded-xs border border-[#a5472f]/40 bg-[#a5472f]/10 p-5 text-sm font-semibold text-[#a5472f]">
          {order.status === "cancelled"
            ? ar
              ? "تم إلغاء هذا الطلب بناءً على طلبك أو لتعذر تأكيد الدفع."
              : "This order was cancelled."
            : order.status === "partially_returned"
              ? ar
                ? "تم استرجاع جزء من هذا الطلب وإكمال تسويته."
                : "Part of this order was returned and settled."
              : ar
                ? "تم إرجاع هذا الطلب وتأكيد الاستلام بالمخزن."
                : "This order was returned."}
        </div>
      ) : (
        <div className="mt-8 rounded-xs border border-[var(--border-subtle)] bg-white p-5 shadow-xs sm:p-7">
          <ol className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {progress.map((status, index) => {
              const active = index <= currentIndex;
              const isCurrent = index === currentIndex;
              const labels: Record<typeof status, [string, string]> = {
                confirmed: ["Confirmed", "تم التأكيد"],
                processing: ["Preparing", "قيد التجهيز"],
                ready_to_ship: ["Ready", "جاهز للشحن"],
                shipped: ["Shipped", "تم الشحن"],
                out_for_delivery: ["Out for delivery", "خرج للتوصيل"],
                delivered: ["Delivered", "تم التوصيل"],
              };
              return (
                <li
                  key={status}
                  className={`rounded-xs border p-3.5 transition ${
                    isCurrent
                      ? "border-[#073b36] bg-[#f0f5f3] ring-1 ring-[#073b36]"
                      : active
                        ? "border-[#0e7468] bg-[#dce9e5]/60"
                        : "border-[var(--border-subtle)] bg-[var(--surface-canvas)] opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`grid size-6 place-items-center rounded-full text-xs font-bold ${
                        active
                          ? "bg-[#073b36] text-white"
                          : "bg-black/10 text-neutral-500"
                      }`}
                    >
                      {active ? (
                        <Check size={13} strokeWidth={2.5} />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <strong className="text-[11px] font-bold uppercase tracking-[.08em] text-[var(--text-strong)]">
                      {labels[status][ar ? 1 : 0]}
                    </strong>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* Main Order Details Grid */}
      <div className="mt-8 grid gap-6 md:grid-cols-[1.3fr_0.7fr]">
        {/* Order Items */}
        <section className="rounded-xs border border-[var(--border-subtle)] bg-white p-5 shadow-xs sm:p-7">
          <h2 className="font-serif text-2xl text-[var(--text-strong)]">
            {ar ? "محتويات الطلب" : "Order items"}
          </h2>
          <div className="mt-5 divide-y divide-[var(--border-subtle)]">
            {order.order_items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[64px_1fr_auto] gap-4 py-4 sm:gap-6"
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-xs border border-[var(--border-subtle)] bg-[#ebe9e4]">
                  {item.image_url && (
                    <Image
                      src={item.image_url}
                      alt={ar ? item.title_ar : item.title_en}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <strong className="line-clamp-1 text-sm font-semibold text-[var(--text-strong)]">
                    {ar ? item.title_ar : item.title_en}
                  </strong>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {ar ? item.colour_ar : item.colour_en} · {item.size} · ×
                    {item.quantity}
                  </p>
                </div>
                <strong className="text-sm font-bold text-[var(--text-strong)]">
                  {formatMoney(item.line_total_minor, locale)}
                </strong>
              </div>
            ))}
          </div>
        </section>

        {/* Shipment & Financial Totals */}
        <aside className="grid content-start gap-6">
          {/* Shipment Details */}
          <section className="rounded-xs border border-[var(--border-subtle)] bg-white p-5 shadow-xs sm:p-6">
            <h2 className="font-serif text-xl text-[var(--text-strong)]">
              {ar ? "تفاصيل الشحن والتوصيل" : "Shipment & Delivery"}
            </h2>
            <p className="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">
              {ar
                ? (order.shipping_city_name_ar ?? order.city)
                : (order.shipping_city_name_en ?? order.city)}{" "}
              ·{" "}
              {ar
                ? (order.shipping_governorate_name_ar ?? order.governorate)
                : (order.shipping_governorate_name_en ?? order.governorate)}
            </p>
            {order.delivery_min_days && order.delivery_max_days && (
              <p className="mt-2 text-xs font-semibold text-[#0e7468]">
                {ar
                  ? `التوصيل المتوقع: ${order.delivery_min_days}–${order.delivery_max_days} أيام عمل`
                  : `Estimated delivery: ${order.delivery_min_days}–${order.delivery_max_days} business days`}
              </p>
            )}
            {order.shipment_number ? (
              <div className="mt-4 rounded-xs bg-[#f0f5f3] p-3 text-xs">
                <p className="flex items-center gap-2 font-bold text-[#073b36]">
                  <Truck size={16} aria-hidden="true" />
                  {order.courier || (ar ? "شركة الشحن" : "Courier")}
                </p>
                <strong className="mt-2 block font-mono text-xs text-[var(--text-strong)] break-all">
                  {order.shipment_number}
                </strong>
                {order.tracking_url && (
                  <a
                    href={order.tracking_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 font-bold uppercase tracking-[.1em] text-[#0e7468] underline"
                  >
                    <span>
                      {ar ? "تتبع الشحنة خارجياً" : "Track with courier"}
                    </span>
                    <ExternalLink size={12} aria-hidden="true" />
                  </a>
                )}
              </div>
            ) : (
              <p className="mt-4 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <Clock3 size={15} aria-hidden="true" />
                <span>
                  {ar
                    ? "سيتم إرفاق رقم بوليصة الشحن فور تسليم الطرد للمندوب."
                    : "The courier tracking number appears once handed over."}
                </span>
              </p>
            )}
          </section>

          {/* Payment Breakdown */}
          <section className="rounded-xs border border-[var(--border-subtle)] bg-white p-5 shadow-xs sm:p-6 text-sm">
            <h2 className="font-serif text-xl text-[var(--text-strong)]">
              {ar ? "ملخص الحساب" : "Payment details"}
            </h2>
            <dl className="mt-4 space-y-2.5">
              <div className="flex justify-between text-xs text-[var(--text-muted)]">
                <dt>{ar ? "المنتجات" : "Items subtotal"}</dt>
                <dd className="font-semibold text-[var(--text-strong)]">
                  {formatMoney(order.subtotal_minor, locale)}
                </dd>
              </div>
              {order.discount_minor > 0 && (
                <div className="flex justify-between text-xs font-bold text-[#0e7468]">
                  <dt>
                    {ar
                      ? `خصم ${order.discount_code ?? ""}`
                      : `${order.discount_code ?? "Discount"}`}
                  </dt>
                  <dd>−{formatMoney(order.discount_minor, locale)}</dd>
                </div>
              )}
              <div className="flex justify-between text-xs text-[var(--text-muted)]">
                <dt>{ar ? "الشحن" : "Shipping"}</dt>
                <dd className="font-semibold text-[var(--text-strong)]">
                  {order.shipping_base_minor
                    ? formatMoney(order.shipping_base_minor, locale)
                    : ar
                      ? "مجاني"
                      : "Free"}
                </dd>
              </div>
              {order.shipping_discount_minor > 0 && (
                <div className="flex justify-between text-xs text-[#0e7468]">
                  <dt>{ar ? "خصم الشحن" : "Shipping discount"}</dt>
                  <dd>−{formatMoney(order.shipping_discount_minor, locale)}</dd>
                </div>
              )}
              {order.cod_surcharge_minor > 0 && (
                <div className="flex justify-between text-xs text-[var(--text-muted)]">
                  <dt>{ar ? "رسوم الدفع عند الاستلام" : "COD service fee"}</dt>
                  <dd className="font-semibold text-[var(--text-strong)]">
                    {formatMoney(order.cod_surcharge_minor, locale)}
                  </dd>
                </div>
              )}
              {order.payment_method === "cod" && (
                <>
                  <div className="flex justify-between border-t border-dashed border-[var(--border-subtle)] pt-2 text-xs font-bold text-[#0e7468]">
                    <dt>{ar ? "المقدم المدفوع" : "Deposit paid"}</dt>
                    <dd>{formatMoney(order.cod_deposit_minor, locale)}</dd>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-[#a5472f]">
                    <dt>{ar ? "المتبقي عند الاستلام" : "Due on delivery"}</dt>
                    <dd>{formatMoney(order.cod_balance_due_minor, locale)}</dd>
                  </div>
                </>
              )}
              <div className="flex justify-between border-t border-[var(--border-subtle)] pt-3 text-base font-bold text-[var(--text-strong)]">
                <dt>{ar ? "الإجمالي الكلي" : "Total amount"}</dt>
                <dd>{formatMoney(order.total_minor, locale)}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>

      {/* Status History Timeline */}
      <section className="mt-8 rounded-xs border border-[var(--border-subtle)] bg-white p-5 shadow-xs sm:p-7">
        <h2 className="flex items-center gap-2.5 font-serif text-2xl text-[var(--text-strong)]">
          <PackageCheck
            size={22}
            className="text-[#0e7468]"
            aria-hidden="true"
          />
          <span>{ar ? "سجل تحديثات الطلب" : "Order status history"}</span>
        </h2>
        <ol className="mt-6 space-y-4">
          {order.order_status_history.toReversed().map((entry) => (
            <li
              key={entry.id}
              className="border-s-2 border-[#0e7468] ps-4 text-xs"
            >
              <strong className="block font-bold uppercase tracking-[.1em] text-[var(--text-strong)]">
                {entry.status.replaceAll("_", " ")}
              </strong>
              <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                {new Intl.DateTimeFormat(locale, {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(entry.created_at))}
              </p>
              {entry.note && (
                <p className="mt-1.5 text-xs text-[var(--text-strong)]">
                  {entry.note}
                </p>
              )}
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
