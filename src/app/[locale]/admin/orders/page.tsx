import type { Metadata, Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { Banknote, CircleDollarSign, Clock3, PackageCheck, Truck } from "lucide-react";
import { notFound } from "next/navigation";
import { updateOrderAction } from "@/features/orders/admin-actions";
import type { TrackedOrder } from "@/features/orders/types";
import { isLocale } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRoles } from "@/server/auth/roles";

export const metadata: Metadata = { title: "Orders | Scrub Vibe Admin", robots: { index: false, follow: false } };

type AdminOrder = TrackedOrder & {
  email: string | null; street_address: string; building: string | null; floor: string | null;
  apartment: string | null; landmark: string | null; customer_notes: string | null;
  payment_proofs: { id: string; storage_path: string; status: string; review_note: string | null; created_at: string }[];
};

const statuses: TrackedOrder["status"][] = ["awaiting_payment", "payment_review", "confirmed", "processing", "ready_to_ship", "shipped", "out_for_delivery", "delivered", "cancelled", "returned"];
const paymentStatuses: TrackedOrder["payment_status"][] = ["pending", "proof_submitted", "paid", "rejected", "failed", "cod_due", "cod_collected", "refunded"];

export default async function AdminOrdersPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ status?: string }> }) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  await requireRoles(["support", "warehouse", "admin", "super_admin"]);
  const admin = createAdminClient();
  let request = admin.from("orders").select(`
    *, order_items(*), order_status_history(id, status, payment_status, note, created_at),
    payment_proofs(id, storage_path, status, review_note, created_at)
  `).order("created_at", { ascending: false }).limit(100);
  if (query.status && statuses.includes(query.status as TrackedOrder["status"])) request = request.eq("status", query.status as TrackedOrder["status"]);
  const { data, error } = await request;
  if (error) throw new Error("Orders could not be loaded.");
  const orders = data as unknown as AdminOrder[];
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
    <header className="bg-[#062f2b] text-white"><div className="mx-auto max-w-[1500px] px-5 py-10 md:px-10"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow text-[#81c5b8]">SCRUB VIBE · OPERATIONS</p><h1 className="mt-3 font-serif text-5xl md:text-7xl">{ar ? "الطلبات والمدفوعات" : "Orders & payments"}</h1></div><Link href={`/${locale}/admin` as Route} className="border border-white/25 px-4 py-3 text-[10px] font-bold uppercase tracking-[.14em]">{ar ? "لوحة التحكم" : "Dashboard"}</Link></div></div></header>
    <div className="mx-auto max-w-[1500px] px-5 py-8 md:px-10 md:py-12">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={CircleDollarSign} label={ar ? "الإيراد المحصل" : "Collected revenue"} value={formatMoney(revenue, locale)} />
        <Metric icon={Banknote} label={ar ? "متوسط الطلب المدفوع" : "Paid average order"} value={formatMoney(paidOrders.length ? Math.round(revenue / paidOrders.length) : 0, locale)} />
        <Metric icon={Clock3} label={ar ? "إيصالات للمراجعة" : "Proofs to review"} value={awaitingReview.toString()} alert={awaitingReview > 0} />
        <Metric icon={PackageCheck} label={ar ? "قائمة التجهيز" : "Fulfilment queue"} value={fulfilmentQueue.toString()} />
      </section>
      <nav className="mt-8 flex flex-wrap gap-2"><Link href={`/${locale}/admin/orders` as Route} className="border border-black/10 bg-white px-3 py-2 text-[10px] font-bold uppercase">{ar ? "الكل" : "All"}</Link>{["payment_review", "confirmed", "processing", "shipped", "delivered"].map((status) => <Link key={status} href={`/${locale}/admin/orders?status=${status}` as Route} className="border border-black/10 bg-white px-3 py-2 text-[10px] font-bold uppercase">{status.replaceAll("_", " ")}</Link>)}</nav>
      <div className="mt-6 grid gap-5">{orders.map((order) => <article key={order.id} className="border border-black/10 bg-white p-5 md:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-serif text-3xl">{order.order_number}</h2><Tag value={order.status} /><Tag value={order.payment_status} /></div><p className="mt-2 text-xs text-neutral-500">{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.created_at))} · {order.customer_name} · <a href={`tel:${order.phone}`} className="underline">{order.phone}</a></p></div><strong className="font-serif text-3xl">{formatMoney(order.total_minor, locale)}</strong></div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr_320px]">
          <section><h3 className="text-[10px] font-bold uppercase tracking-[.14em] text-neutral-500">{ar ? "المنتجات" : "Items"}</h3><div className="mt-3 divide-y divide-black/10">{order.order_items.map((item) => <div key={item.id} className="flex justify-between gap-4 py-3 text-xs"><span>{ar ? item.title_ar : item.title_en}<small className="mt-1 block text-neutral-500">{ar ? item.colour_ar : item.colour_en} · {item.size} · ×{item.quantity} · {item.sku}</small></span><strong>{formatMoney(item.line_total_minor, locale)}</strong></div>)}</div></section>
          <section className="text-xs leading-5"><h3 className="text-[10px] font-bold uppercase tracking-[.14em] text-neutral-500">{ar ? "التوصيل والدفع" : "Delivery & payment"}</h3><address className="mt-3 not-italic">{order.street_address}<br />{[order.building, order.floor, order.apartment].filter(Boolean).join(" · ")}<br />{order.city}, {order.governorate}</address><p className="mt-3 font-bold uppercase">{order.payment_method.replaceAll("_", " ")}</p>{order.customer_notes && <p className="mt-3 border-s-2 border-[#0e7468] ps-3">{order.customer_notes}</p>}{order.payment_proofs.map((proof) => <div key={proof.id} className="mt-4"><a href={proofUrls.get(proof.id)} target="_blank" rel="noreferrer" className="block"><div className="relative aspect-video overflow-hidden bg-black/5">{proofUrls.get(proof.id) && <Image src={proofUrls.get(proof.id)!} alt="Payment proof" fill sizes="360px" unoptimized className="object-contain" />}</div><span className="mt-2 block text-[10px] font-bold uppercase underline">{ar ? "فتح إيصال الدفع" : "Open payment proof"} · {proof.status}</span></a></div>)}</section>
          <form action={updateOrderAction} className="grid content-start gap-3 border border-black/10 bg-[#f5f7f5] p-4">
            <input type="hidden" name="locale" value={locale} /><input type="hidden" name="orderId" value={order.id} />
            <label className="grid gap-1 text-[10px] font-bold uppercase">{ar ? "حالة الطلب" : "Order status"}<select name="status" defaultValue={order.status} className="h-10 border bg-white px-2 text-xs">{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
            <label className="grid gap-1 text-[10px] font-bold uppercase">{ar ? "حالة الدفع" : "Payment status"}<select name="paymentStatus" defaultValue={order.payment_status} className="h-10 border bg-white px-2 text-xs">{paymentStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
            <label className="grid gap-1 text-[10px] font-bold uppercase">{ar ? "قرار الإيصال" : "Proof decision"}<select name="proofStatus" defaultValue="" className="h-10 border bg-white px-2 text-xs"><option value="">{ar ? "بدون تغيير" : "No change"}</option><option value="approved">approved</option><option value="rejected">rejected</option></select></label>
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
