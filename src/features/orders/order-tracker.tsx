"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Clock3, PackageCheck, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import type { TrackedOrder } from "./types";

const progress = ["confirmed", "processing", "ready_to_ship", "shipped", "out_for_delivery", "delivered"] as const;

function storedToken(orderNumber: string) {
  try {
    const saved = JSON.parse(localStorage.getItem("scrub-vibe-order-tokens") ?? "{}") as Record<string, string>;
    return saved[orderNumber] ?? "";
  } catch { return ""; }
}

async function fetchTrackedOrder(orderNumber: string, token: string) {
  const response = await fetch(`/api/orders/${encodeURIComponent(orderNumber)}?token=${encodeURIComponent(token)}`, { cache: "no-store" });
  if (response.status === 401) return { state: "locked" as const, order: null };
  if (!response.ok) return { state: "error" as const, order: null };
  return { state: "ready" as const, order: await response.json() as TrackedOrder };
}

export function OrderTracker({ locale, orderNumber }: { locale: Locale; orderNumber: string }) {
  const ar = locale === "ar";
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "locked" | "error">("loading");
  const [manualToken, setManualToken] = useState("");

  useEffect(() => {
    let active = true;
    void fetchTrackedOrder(orderNumber, storedToken(orderNumber)).then((result) => {
      if (!active) return;
      setOrder(result.order);
      setState(result.state);
    });
    return () => { active = false; };
  }, [orderNumber]);

  async function unlockOrder() {
    setState("loading");
    const result = await fetchTrackedOrder(orderNumber, manualToken);
    setOrder(result.order);
    setState(result.state);
  }

  if (state === "loading") return <div className="min-h-[55vh] py-24 text-center text-sm">{ar ? "جارٍ تحميل الطلب…" : "Loading your order…"}</div>;
  if (state === "locked") return (
    <main className="mx-auto min-h-[65vh] max-w-xl px-5 py-20">
      <p className="eyebrow text-[#a6432b]">{ar ? "طلب محمي" : "PROTECTED ORDER"}</p>
      <h1 className="mt-4 font-serif text-5xl">{ar ? "افتح تتبع طلبك" : "Unlock order tracking"}</h1>
      <p className="mt-5 text-sm leading-6 text-neutral-600">{ar ? "سجّل الدخول بالحساب المستخدم في الطلب، أو أدخل رمز التتبع الخاص بك." : "Sign in with the account used for checkout, or enter your private tracking token."}</p>
      <form className="mt-8 grid gap-3" onSubmit={(event) => { event.preventDefault(); void unlockOrder(); }}>
        <label className="text-xs font-bold" htmlFor="tracking-token">{ar ? "رمز التتبع" : "Tracking token"}</label>
        <input id="tracking-token" value={manualToken} onChange={(event) => setManualToken(event.target.value)} className="h-12 border border-black/20 bg-white px-4 text-sm" required />
        <button className="h-12 bg-[#073b36] text-xs font-bold uppercase tracking-[.14em] text-white">{ar ? "فتح الطلب" : "Open order"}</button>
      </form>
      <Link href={`/${locale}/account`} className="mt-5 block text-center text-xs underline">{ar ? "تسجيل الدخول" : "Sign in"}</Link>
    </main>
  );
  if (state === "error" || !order) return <div className="min-h-[55vh] py-24 text-center text-sm">{ar ? "تعذر العثور على الطلب." : "We could not find this order."}</div>;

  const currentIndex = progress.indexOf(order.status as (typeof progress)[number]);
  const paymentLabel: Record<TrackedOrder["payment_status"], [string, string]> = {
    pending: ["Payment in progress", "الدفع قيد التنفيذ"], proof_submitted: ["Proof under review", "إيصال الدفع قيد المراجعة"],
    paid: ["Payment successful", "تم الدفع بنجاح"], rejected: ["Payment proof rejected", "تم رفض إيصال الدفع"],
    failed: ["Payment failed", "فشل الدفع"], cod_due: ["Cash due on delivery", "الدفع عند الاستلام"],
    cod_collected: ["Cash collected", "تم تحصيل المبلغ"], refunded: ["Payment refunded", "تم رد المبلغ"],
  };
  return (
    <main className="mx-auto min-h-[70vh] max-w-5xl px-5 py-14 md:px-10 md:py-20">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div><p className="eyebrow text-[#0e7468]">{ar ? "تتبع الطلب" : "ORDER TRACKER"}</p><h1 className="mt-3 font-serif text-5xl md:text-7xl">{order.order_number}</h1></div>
        <div className="border border-[#0e7468]/25 bg-[#dce9e5] px-5 py-3 text-sm font-bold text-[#073b36]">{paymentLabel[order.payment_status][ar ? 1 : 0]}</div>
      </div>

      {order.status === "cancelled" || order.status === "returned" ? (
        <div className="mt-10 border border-[#a6432b]/30 bg-[#a6432b]/8 p-5 text-sm">{order.status === "cancelled" ? (ar ? "تم إلغاء هذا الطلب." : "This order was cancelled.") : (ar ? "تم إرجاع هذا الطلب." : "This order was returned.")}</div>
      ) : (
        <ol className="mt-12 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {progress.map((status, index) => {
            const active = index <= currentIndex;
            const labels: Record<typeof status, [string, string]> = {
              confirmed: ["Confirmed", "تم التأكيد"], processing: ["Preparing", "قيد التجهيز"], ready_to_ship: ["Ready", "جاهز للشحن"],
              shipped: ["Shipped", "تم الشحن"], out_for_delivery: ["Out for delivery", "خرج للتوصيل"], delivered: ["Delivered", "تم التوصيل"],
            };
            return <li key={status} className={`border p-4 ${active ? "border-[#0e7468] bg-[#dce9e5]" : "border-black/10 bg-white/40"}`}>
              <span className={`grid size-7 place-items-center rounded-full ${active ? "bg-[#0e7468] text-white" : "bg-black/5"}`}>{active ? <Check size={14} /> : index + 1}</span>
              <strong className="mt-3 block text-[10px] uppercase tracking-[.1em]">{labels[status][ar ? 1 : 0]}</strong>
            </li>;
          })}
        </ol>
      )}

      <div className="mt-10 grid gap-6 md:grid-cols-[1.3fr_.7fr]">
        <section className="border border-black/10 bg-white p-5 md:p-7">
          <h2 className="font-serif text-3xl">{ar ? "المنتجات" : "Order items"}</h2>
          <div className="mt-5 divide-y divide-black/10">
            {order.order_items.map((item) => <div key={item.id} className="grid grid-cols-[64px_1fr_auto] gap-4 py-4">
              <div className="relative aspect-[3/4] overflow-hidden bg-[#ebe9e4]">{item.image_url && <Image src={item.image_url} alt={ar ? item.title_ar : item.title_en} fill sizes="64px" className="object-cover" />}</div>
              <div><strong className="text-sm">{ar ? item.title_ar : item.title_en}</strong><p className="mt-1 text-xs text-neutral-500">{ar ? item.colour_ar : item.colour_en} · {item.size} · ×{item.quantity}</p></div>
              <strong className="text-xs">{formatMoney(item.line_total_minor, locale)}</strong>
            </div>)}
          </div>
        </section>
        <aside className="grid content-start gap-5">
          <section className="border border-black/10 bg-white p-5">
            <h2 className="font-serif text-2xl">{ar ? "الشحنة" : "Shipment"}</h2>
            {order.shipment_number ? <div className="mt-4 text-sm"><p className="flex items-center gap-2"><Truck size={16} /> {order.courier || (ar ? "شركة الشحن" : "Courier")}</p><strong className="mt-3 block break-all">{order.shipment_number}</strong>{order.tracking_url && <a href={order.tracking_url} target="_blank" rel="noreferrer" className="mt-4 inline-block text-xs underline">{ar ? "تتبع مع شركة الشحن" : "Track with courier"}</a>}</div> : <p className="mt-4 flex gap-2 text-xs text-neutral-500"><Clock3 size={15} />{ar ? "سيظهر رقم الشحنة عند تسليم الطلب لشركة الشحن." : "The shipment number appears once your parcel reaches the courier."}</p>}
          </section>
          <section className="border border-black/10 bg-white p-5 text-sm">
            <h2 className="font-serif text-2xl">{ar ? "الإجمالي" : "Total"}</h2>
            <dl className="mt-4 grid gap-2"><div className="flex justify-between"><dt>{ar ? "المنتجات" : "Items"}</dt><dd>{formatMoney(order.subtotal_minor, locale)}</dd></div><div className="flex justify-between"><dt>{ar ? "الشحن" : "Shipping"}</dt><dd>{order.shipping_minor ? formatMoney(order.shipping_minor, locale) : (ar ? "مجاني" : "Free")}</dd></div><div className="mt-2 flex justify-between border-t pt-3 font-bold"><dt>{ar ? "الإجمالي" : "Total"}</dt><dd>{formatMoney(order.total_minor, locale)}</dd></div></dl>
          </section>
        </aside>
      </div>

      <section className="mt-6 border border-black/10 bg-white p-5 md:p-7">
        <h2 className="flex items-center gap-2 font-serif text-3xl"><PackageCheck size={22} />{ar ? "آخر التحديثات" : "Latest updates"}</h2>
        <ol className="mt-5 space-y-4">{order.order_status_history.toReversed().map((entry) => <li key={entry.id} className="border-s-2 border-[#0e7468] ps-4"><strong className="text-xs uppercase">{entry.status.replaceAll("_", " ")}</strong><p className="mt-1 text-[11px] text-neutral-500">{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(entry.created_at))}</p>{entry.note && <p className="mt-1 text-xs">{entry.note}</p>}</li>)}</ol>
      </section>
    </main>
  );
}
