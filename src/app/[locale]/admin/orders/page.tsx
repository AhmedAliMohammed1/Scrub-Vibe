import type { Metadata, Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { Banknote, CircleDollarSign, Clock3, PackageCheck, ShoppingCart, Truck } from "lucide-react";
import { notFound } from "next/navigation";
import { updateOrderAction } from "@/features/orders/admin-actions";
import { getPaymobConfigurationStatus } from "@/features/checkout/paymob";
import { getRecoveryStats } from "@/features/cart-recovery/repository";
import type { TrackedOrder } from "@/features/orders/types";
import { isLocale } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRoles } from "@/server/auth/roles";

export const metadata: Metadata = { title: "Orders | Scrub Vibe Admin", robots: { index: false, follow: false } };

type AdminOrder = TrackedOrder & {
  email: string | null; street_address: string; building: string | null; floor: string | null;
  apartment: string | null; landmark: string | null; customer_notes: string | null;
  payment_proofs: { id: string; storage_path: string; amount_minor: number; status: string; review_note: string | null; created_at: string }[];
};

type WebhookEvent = {
  id: number;
  provider_event_id: string;
  transaction_id: string | null;
  outcome: string;
  error_code: string | null;
  received_at: string;
};

const statuses: TrackedOrder["status"][] = ["awaiting_payment", "payment_review", "confirmed", "processing", "ready_to_ship", "shipped", "out_for_delivery", "delivered", "cancelled", "returned"];
const paymentStatuses: TrackedOrder["payment_status"][] = ["pending", "proof_submitted", "paid", "rejected", "failed", "cod_due", "cod_collected", "refunded"];

export default async function AdminOrdersPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ status?: string; error?: string; success?: string }> }) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  await requireRoles(["support", "warehouse", "admin", "super_admin"]);
  const admin = createAdminClient();
  let request = admin.from("orders").select(`
    *, order_items(*), order_status_history(id, status, payment_status, note, created_at),
    payment_proofs(id, storage_path, amount_minor, status, review_note, created_at)
  `).order("created_at", { ascending: false }).limit(100);
  if (query.status && statuses.includes(query.status as TrackedOrder["status"])) request = request.eq("status", query.status as TrackedOrder["status"]);
  const [ordersResult, webhookResult, recoveryStats] = await Promise.all([
    request,
    admin
      .from("payment_webhook_events")
      .select("id, provider_event_id, transaction_id, outcome, error_code, received_at")
      .order("received_at", { ascending: false })
      .limit(10),
    getRecoveryStats().catch((err) => {
      console.error("[admin/orders] Failed to load recovery stats:", err);
      return {
        totalSent: 0,
        totalRecovered: 0,
        recoveryRatePercent: 0,
        recoveredRevenueMinor: 0,
        byStage: {
          firstReminder: { sent: 0, recovered: 0 },
          secondReminder: { sent: 0, recovered: 0 },
          discountOffer: { sent: 0, recovered: 0 },
        },
      };
    }),
  ]);
  const { data, error } = ordersResult;
  if (error) throw new Error("Orders could not be loaded.");
  const orders = data as unknown as AdminOrder[];
  const webhookEvents = (webhookResult.data ?? []) as WebhookEvent[];
  const paymobStatus = getPaymobConfigurationStatus();
  const proofUrls = new Map<string, string>();
  await Promise.all(orders.flatMap((order) => order.payment_proofs.map(async (proof) => {
    const { data: signed } = await admin.storage.from("payment-proofs").createSignedUrl(proof.storage_path, 900);
    if (signed?.signedUrl) proofUrls.set(proof.id, signed.signedUrl);
  })));
  const ar = locale === "ar";
  const paidOrders = orders.filter((order) => ["paid", "cod_collected"].includes(order.payment_status));
  const revenue = paidOrders.reduce((sum, order) => sum + order.total_minor, 0);
  const awaitingReview = orders.filter((order) => order.payment_status === "proof_submitted").length;
  const fulfilmentQueue = orders.filter((order) => ["confirmed", "processing", "ready_to_ship"].includes(order.status)).length;

  return <main className="min-h-screen bg-[#eef2ef]">
    <header className="bg-[#062f2b] text-white"><div className="mx-auto max-w-[1500px] px-5 py-10 md:px-10"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow text-[#81c5b8]">SCRUB VIBE · OPERATIONS</p><h1 className="mt-3 font-serif text-5xl md:text-7xl">{ar ? "الطلبات والمدفوعات" : "Orders & payments"}</h1></div><div className="flex gap-2"><Link href={`/${locale}/admin` as Route} className="border border-white/25 px-4 py-3 text-[10px] font-bold uppercase tracking-[.14em]">{ar ? "لوحة التحكم" : "Dashboard"}</Link><Link href={`/${locale}/admin/banners` as Route} className="border border-white/25 px-4 py-3 text-[10px] font-bold uppercase tracking-[.14em]">{ar ? "البانرات" : "Banners"}</Link></div></div></div></header>
    <div className="mx-auto max-w-[1500px] px-5 py-8 md:px-10 md:py-12">
      {query.error && (
        <aside className="mb-6 border border-rose-300 bg-rose-50 p-4 text-xs font-semibold text-rose-900">
          ⚠️ {query.error}
        </aside>
      )}
      {query.success && (
        <aside className="mb-6 border border-emerald-300 bg-emerald-50 p-4 text-xs font-semibold text-emerald-900">
          ✓ {query.success}
        </aside>
      )}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={CircleDollarSign} label={ar ? "الإيراد المحصل" : "Collected revenue"} value={formatMoney(revenue, locale)} />
        <Metric icon={Banknote} label={ar ? "متوسط الطلب المدفوع" : "Paid average order"} value={formatMoney(paidOrders.length ? Math.round(revenue / paidOrders.length) : 0, locale)} />
        <Metric icon={Clock3} label={ar ? "إيصالات للمراجعة" : "Proofs to review"} value={awaitingReview.toString()} alert={awaitingReview > 0} />
        <Metric icon={PackageCheck} label={ar ? "قائمة التجهيز" : "Fulfilment queue"} value={fulfilmentQueue.toString()} />
      </section>

      <section className="mt-5 border border-[#0e7468]/30 bg-white p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-4">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} className="text-[#0e7468]" />
            <h2 className="font-serif text-2xl text-[#062f2b]">
              {ar ? "استعادة السلات المتروكة" : "Abandoned cart recovery"}
            </h2>
          </div>
          <span className="bg-[#dce9e5] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#073b36]">
            {ar ? `نسبة الاستعادة: ${recoveryStats.recoveryRatePercent}٪` : `Recovery rate: ${recoveryStats.recoveryRatePercent}%`}
          </span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border border-black/5 bg-[#f4f7f4] p-4">
            <p className="text-[10px] font-bold uppercase text-neutral-500">{ar ? "تذكيرات مرسلة" : "Reminders sent"}</p>
            <strong className="mt-1 block font-serif text-2xl text-[#062f2b]">{recoveryStats.totalSent}</strong>
          </div>
          <div className="border border-black/5 bg-[#f4f7f4] p-4">
            <p className="text-[10px] font-bold uppercase text-neutral-500">{ar ? "سلات مستعادة" : "Carts recovered"}</p>
            <strong className="mt-1 block font-serif text-2xl text-[#0e7468]">{recoveryStats.totalRecovered}</strong>
          </div>
          <div className="border border-black/5 bg-[#f4f7f4] p-4">
            <p className="text-[10px] font-bold uppercase text-neutral-500">{ar ? "إيراد مسترد" : "Recovered revenue"}</p>
            <strong className="mt-1 block font-serif text-2xl text-[#062f2b]">{formatMoney(recoveryStats.recoveredRevenueMinor, locale)}</strong>
          </div>
          <div className="border border-black/5 bg-[#f4f7f4] p-4">
            <p className="text-[10px] font-bold uppercase text-neutral-500">{ar ? "المراحل" : "Stage breakdown"}</p>
            <p className="mt-1 text-[11px] leading-5 text-neutral-600">
              1st (2h): {recoveryStats.byStage.firstReminder.sent} · 2nd (24h): {recoveryStats.byStage.secondReminder.sent} · 3rd (48h): {recoveryStats.byStage.discountOffer.sent}
            </p>
          </div>
        </div>
      </section>

      <section className={`mt-5 border p-5 ${paymobStatus.configured ? "border-emerald-300 bg-emerald-50" : "border-amber-300 bg-amber-50"}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.14em] text-neutral-500">Paymob</p>
            <h2 className="mt-2 font-serif text-3xl">{paymobStatus.configured ? (ar ? "جاهز للاختبار" : "Ready for testing") : (ar ? "متوقف بأمان" : "Safely on hold")}</h2>
            <p className="mt-2 text-xs text-neutral-600">{paymobStatus.configured ? (ar ? "كل الإعدادات موجودة. أكمل اختبار Paymob التجريبي قبل استقبال مدفوعات حقيقية." : "All settings are present. Complete a Paymob sandbox acceptance test before taking live payments.") : (ar ? "لن يظهر Paymob للعملاء حتى تكتمل كل المفاتيح المطلوبة." : "Paymob stays hidden from customers until every required setting is present.")}</p>
          </div>
          {!paymobStatus.configured && <div className="max-w-xl text-xs"><strong>{ar ? "الإعدادات الناقصة" : "Missing settings"}</strong><p className="mt-1 font-mono text-[10px] leading-5">{paymobStatus.missing.join(" · ")}</p></div>}
        </div>
        {webhookEvents.length > 0 && <div className="mt-5 border-t border-black/10 pt-4"><p className="text-[10px] font-bold uppercase tracking-[.12em]">{ar ? "آخر إشعارات Paymob" : "Recent Paymob callbacks"}</p><div className="mt-2 grid gap-2">{webhookEvents.map((event) => <p key={event.id} className="flex flex-wrap justify-between gap-2 text-[10px]"><span className="font-mono">{event.transaction_id ?? event.provider_event_id}</span><span>{event.outcome}{event.error_code ? ` · ${event.error_code}` : ""} · {new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(new Date(event.received_at))}</span></p>)}</div></div>}
      </section>
      <nav className="mt-8 flex flex-wrap gap-2"><Link href={`/${locale}/admin/orders` as Route} className="border border-black/10 bg-white px-3 py-2 text-[10px] font-bold uppercase">{ar ? "الكل" : "All"}</Link>{["payment_review", "confirmed", "processing", "shipped", "delivered"].map((status) => <Link key={status} href={`/${locale}/admin/orders?status=${status}` as Route} className="border border-black/10 bg-white px-3 py-2 text-[10px] font-bold uppercase">{status.replaceAll("_", " ")}</Link>)}</nav>
      <div className="mt-6 grid gap-5">{orders.map((order) => <article key={order.id} className="border border-black/10 bg-white p-5 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-serif text-3xl">{order.order_number}</h2><Tag value={order.status} /><Tag value={order.payment_status} /></div><p className="mt-2 text-xs text-neutral-500">{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.created_at))} · {order.customer_name} · <a href={`tel:${order.phone}`} className="underline">{order.phone}</a></p></div><strong className="font-serif text-3xl">{formatMoney(order.total_minor, locale)}</strong></div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr_320px]">
          <section><h3 className="text-[10px] font-bold uppercase tracking-[.14em] text-neutral-500">{ar ? "المنتجات" : "Items"}</h3><div className="mt-3 divide-y divide-black/10">{order.order_items.map((item) => <div key={item.id} className="flex justify-between gap-4 py-3 text-xs"><span>{ar ? item.title_ar : item.title_en}<small className="mt-1 block text-neutral-500">{ar ? item.colour_ar : item.colour_en} · {item.size} · ×{item.quantity} · {item.sku}</small></span><strong>{formatMoney(item.line_total_minor, locale)}</strong></div>)}</div></section>
          <section className="text-xs leading-5">
            <h3 className="text-[10px] font-bold uppercase tracking-[.14em] text-neutral-500">{ar ? "التوصيل والدفع" : "Delivery & payment"}</h3>
            <address className="mt-3 not-italic">
              {order.street_address}<br />
              {[order.building, order.floor, order.apartment].filter(Boolean).join(" · ")}<br />
              {ar ? (order.shipping_city_name_ar ?? order.city) : (order.shipping_city_name_en ?? order.city)}, {ar ? (order.shipping_governorate_name_ar ?? order.governorate) : (order.shipping_governorate_name_en ?? order.governorate)}
            </address>
            {order.shipping_zone_name_en && <p className="mt-2 text-neutral-500">{ar ? order.shipping_zone_name_ar : order.shipping_zone_name_en} · {formatMoney(order.shipping_minor, locale)} · {order.delivery_min_days}–{order.delivery_max_days} {ar ? "أيام" : "days"}</p>}
            {order.discount_minor > 0 && <p className="mt-2 border-s-2 border-[#0e7468] ps-3 font-bold text-[#0e7468]">{ar ? "كود الخصم" : "Discount code"}: {order.discount_code} · −{formatMoney(order.discount_minor, locale)}</p>}
            <p className="mt-3 font-bold uppercase">{order.payment_method.replaceAll("_", " ")}</p>
            {order.payment_method === "cod" && <div className="mt-2 border-s-2 border-[#0e7468] ps-3"><strong>{ar ? "المقدم" : "Deposit"}: {formatMoney(order.cod_deposit_minor, locale)}</strong><br />{ar ? "المتبقي" : "Balance"}: {formatMoney(order.cod_balance_due_minor, locale)}<br />{order.cod_deposit_method?.replaceAll("_", " ")}</div>}
            {order.customer_notes && <p className="mt-3 border-s-2 border-[#0e7468] ps-3">{order.customer_notes}</p>}
            {order.payment_proofs.map((proof) => <div key={proof.id} className="mt-4"><a href={proofUrls.get(proof.id)} target="_blank" rel="noreferrer" className="block"><div className="relative aspect-video overflow-hidden bg-black/5">{proofUrls.get(proof.id) && <Image src={proofUrls.get(proof.id)!} alt="Payment proof" fill sizes="360px" unoptimized className="object-contain" />}</div><span className="mt-2 block text-[10px] font-bold uppercase underline">{ar ? "فتح إيصال الدفع" : "Open payment proof"} · {formatMoney(proof.amount_minor, locale)} · {proof.status}</span></a></div>)}
          </section>
          <form key={`${order.id}-${order.status}-${order.payment_status}-${order.shipment_number ?? ""}`} action={updateOrderAction} className="grid content-start gap-3 border border-black/10 bg-[#f5f7f5] p-4">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="currentFilter" value={query.status ?? ""} />
            {["cancelled", "returned"].includes(order.status) ? (
              <div className="grid gap-1">
                <span className="text-[10px] font-bold uppercase">{ar ? "حالة الطلب" : "Order status"}</span>
                <input type="hidden" name="status" value={order.status} />
                <div className="flex h-10 items-center justify-between border border-neutral-300 bg-neutral-200/60 px-2 text-xs font-semibold text-neutral-700">
                  <span>{order.status}</span>
                  <span className="text-[10px] font-bold uppercase text-amber-800">{ar ? "حالة نهائية (مغلق)" : "Terminal (Locked)"}</span>
                </div>
                <span className="text-[10px] leading-3 text-neutral-500">
                  {ar ? "تم تحرير المخزون تلقائياً. لا يمكن إعادة فتح الطلب الملغى." : "Stock was released to inventory. This order cannot be reopened."}
                </span>
              </div>
            ) : (
              <label className="grid gap-1 text-[10px] font-bold uppercase">{ar ? "حالة الطلب" : "Order status"}<select name="status" defaultValue={order.status} className="h-10 border bg-white px-2 text-xs">{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
            )}
            <label className="grid gap-1 text-[10px] font-bold uppercase">{ar ? "حالة الدفع" : "Payment status"}<select name="paymentStatus" defaultValue={order.payment_status} className="h-10 border bg-white px-2 text-xs">{paymentStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
            <label className="grid gap-1 text-[10px] font-bold uppercase">{ar ? "قرار الإيصال" : "Proof decision"}<select name="proofStatus" defaultValue="" className="h-10 border bg-white px-2 text-xs"><option value="">{ar ? "بدون تغيير" : "No change"}</option><option value="approved">{ar ? "موافقة — تأكيد الطلب تلقائياً" : "Approve — confirm order automatically"}</option><option value="rejected">{ar ? "رفض — إبقاء الطلب للمراجعة" : "Reject — keep order in review"}</option></select><span className="normal-case leading-4 text-neutral-500">{ar ? "قرار الإيصال يحدد حالة الدفع والطلب تلقائياً لمنع التعارض." : "A proof decision sets the correct payment and order statuses automatically."}</span></label>
            <label className="grid gap-1 text-[10px] font-bold uppercase">{ar ? "شركة الشحن" : "Courier"}<input name="courier" defaultValue={order.courier ?? ""} className="h-10 border bg-white px-2 text-xs" /></label>
            <label className="grid gap-1 text-[10px] font-bold uppercase">{ar ? "رقم الشحنة" : "Shipment number"}<input name="shipmentNumber" defaultValue={order.shipment_number ?? ""} className="h-10 border bg-white px-2 text-xs" /></label>
            <label className="grid gap-1 text-[10px] font-bold uppercase">{ar ? "رابط التتبع" : "Tracking URL"}<input name="trackingUrl" type="url" defaultValue={order.tracking_url ?? ""} className="h-10 border bg-white px-2 text-xs" /></label>
            <label className="grid gap-1 text-[10px] font-bold uppercase">{ar ? "ملاحظة للعميل" : "Customer update"}<textarea name="note" maxLength={500} className="min-h-16 border bg-white p-2 text-xs" /></label>
            <button className="mt-1 flex h-11 items-center justify-center gap-2 bg-[#073b36] text-[10px] font-bold uppercase tracking-[.12em] text-white"><Truck size={14} />{ar ? "حفظ التحديث" : "Save update"}</button>
          </form>
        </div>
      </article>)}</div>
      {!orders.length && <div className="mt-6 border border-dashed border-black/15 bg-white p-12 text-center text-sm text-neutral-500">{ar ? "لا توجد طلبات بهذه الحالة." : "No orders match this status."}</div>}
    </div>
  </main>;
}

function Metric({ icon: Icon, label, value, alert }: { icon: typeof Clock3; label: string; value: string; alert?: boolean }) {
  return <article className={`border p-5 ${alert ? "border-amber-300 bg-amber-50" : "border-black/10 bg-white"}`}><Icon size={19} className="text-[#0e7468]" /><p className="mt-5 text-[10px] font-bold uppercase tracking-[.12em] text-neutral-500">{label}</p><strong className="mt-2 block font-serif text-3xl font-normal">{value}</strong></article>;
}
function Tag({ value }: { value: string }) { return <span className="bg-[#dce9e5] px-2 py-1 text-[9px] font-bold uppercase text-[#073b36]">{value.replaceAll("_", " ")}</span>; }
