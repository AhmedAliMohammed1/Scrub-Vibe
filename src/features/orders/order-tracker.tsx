"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import {
  Check,
  Clock3,
  ExternalLink,
  Lock,
  PackageCheck,
  Truck,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
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

async function fetchTrackedOrder(orderNumber: string, token: string) {
  const response = await fetch(
    `/api/orders/${encodeURIComponent(orderNumber)}?token=${encodeURIComponent(token)}`,
    { cache: "no-store" },
  );
  if (response.status === 401) return { state: "locked" as const, order: null };
  if (!response.ok) return { state: "error" as const, order: null };
  return {
    state: "ready" as const,
    order: (await response.json()) as TrackedOrder,
  };
}

export function OrderTracker({
  locale,
  orderNumber,
}: {
  locale: Locale;
  orderNumber: string;
}) {
  const ar = locale === "ar";
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "locked" | "error">(
    "loading",
  );
  const [manualToken, setManualToken] = useState("");

  useEffect(() => {
    let active = true;
    void fetchTrackedOrder(orderNumber, storedToken(orderNumber)).then(
      (result) => {
        if (!active) return;
        setOrder(result.order);
        setState(result.state);
      },
    );
    return () => {
      active = false;
    };
  }, [orderNumber]);

  async function unlockOrder() {
    setState("loading");
    const result = await fetchTrackedOrder(orderNumber, manualToken);
    setOrder(result.order);
    setState(result.state);
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
    return (
      <main className="mx-auto min-h-[65vh] max-w-lg px-5 py-16 sm:py-24">
        <div className="rounded-xs border border-[var(--border-subtle)] bg-white p-6 shadow-xs sm:p-8">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-[#f0f5f3] text-[#073b36]">
            <Lock size={22} strokeWidth={1.8} aria-hidden="true" />
          </div>
          <p className="eyebrow mt-4 text-center text-[#a5472f]">
            {ar ? "طلب محمي بكلمة مرور" : "PROTECTED ORDER"}
          </p>
          <h1 className="mt-2 text-center font-serif text-3xl text-[var(--text-strong)]">
            {ar ? "افتح تتبع طلبك" : "Unlock order tracking"}
          </h1>
          <p className="mt-3 text-center text-xs leading-relaxed text-[var(--text-muted)]">
            {ar
              ? "لحماية خصوصية طلباتك، يرجى تسجيل الدخول بالحساب المستخدم في الطلب، أو إدخال رمز التتبع السري الخاص بك."
              : "To protect your order privacy, please sign in with the account used at checkout, or enter your tracking security token."}
          </p>
          <form
            className="mt-6 grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              void unlockOrder();
            }}
          >
            <label
              className="text-[11px] font-bold uppercase tracking-[.14em] text-[var(--text-muted)]"
              htmlFor="tracking-token"
            >
              {ar ? "رمز التتبع السري" : "Tracking token"}
            </label>
            <input
              id="tracking-token"
              value={manualToken}
              onChange={(event) => setManualToken(event.target.value)}
              className="h-12 rounded-xs border border-[var(--border-subtle)] bg-[var(--surface-canvas)] px-4 text-sm text-[var(--text-strong)] outline-none focus:border-[#0e7468]"
              required
            />
            <button
              type="submit"
              className="mt-2 h-12 rounded-xs bg-[#073b36] text-xs font-bold uppercase tracking-[.14em] text-white shadow-xs hover:bg-[#0e7468]"
            >
              {ar ? "فتح بيانات الطلب" : "Open order"}
            </button>
          </form>
          <Link
            href={`/${locale}/account` as Route}
            className="mt-5 block text-center text-xs font-semibold text-[var(--text-muted)] underline underline-offset-4 hover:text-[#073b36]"
          >
            {ar ? "تسجيل الدخول بالحساب" : "Sign in to account"}
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
          trackingToken={manualToken || storedToken(order.order_number)}
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
            trackingToken={manualToken || storedToken(order.order_number)}
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
