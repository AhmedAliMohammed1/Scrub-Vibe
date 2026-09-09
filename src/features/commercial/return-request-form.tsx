"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";

type OrderItem = { id: number; title_en: string; title_ar: string; colour_en: string | null; colour_ar: string | null; size: string | null; quantity: number };

export function ReturnRequestForm({ orderId, items, locale }: { orderId: string; items: OrderItem[]; locale: Locale }) {
  const ar = locale === "ar";
  const router = useRouter();
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [message, setMessage] = useState("");
  const payload = useMemo(() => Object.entries(selected).filter(([, quantity]) => quantity > 0).map(([id, quantity]) => ({ orderItemId: Number(id), quantity })), [selected]);

  async function submit(formData: FormData) {
    if (!payload.length) { setStatus("error"); setMessage(ar ? "اختر منتجاً واحداً على الأقل." : "Select at least one item."); return; }
    setStatus("submitting"); setMessage("");
    formData.set("orderId", orderId); formData.set("locale", locale); formData.set("items", JSON.stringify(payload));
    const response = await fetch("/api/returns", { method: "POST", body: formData });
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    if (!response.ok) { setStatus("error"); setMessage(body.message ?? (ar ? "تعذر إرسال الطلب." : "Could not submit the request.")); return; }
    router.push(`/${locale}/account/returns?created=1`); router.refresh();
  }

  return <form action={submit} className="mt-8 space-y-7">
    <fieldset><legend className="font-serif text-2xl">{ar ? "المنتجات والكميات" : "Items and quantities"}</legend><div className="mt-3 divide-y divide-black/10 border-y border-black/10">{items.map((item) => <label key={item.id} className="grid grid-cols-[1fr_88px] items-center gap-4 py-4"><span><strong className="block text-sm">{ar ? item.title_ar : item.title_en}</strong><small className="text-neutral-500">{ar ? item.colour_ar : item.colour_en}{item.size ? ` · ${item.size}` : ""} · {ar ? `تم شراء ${item.quantity}` : `${item.quantity} purchased`}</small></span><select aria-label={ar ? "كمية الاسترجاع" : "Return quantity"} value={selected[item.id] ?? 0} onChange={(event) => setSelected((current) => ({ ...current, [item.id]: Number(event.target.value) }))} className="h-11 border border-black/15 bg-white px-2">{Array.from({ length: item.quantity + 1 }, (_, quantity) => <option key={quantity} value={quantity}>{quantity}</option>)}</select></label>)}</div></fieldset>
    <div className="grid gap-5 sm:grid-cols-2"><label className="text-xs font-bold">{ar ? "نوع الطلب" : "Request type"}<select name="requestType" required className="mt-2 h-12 w-full border border-black/15 bg-white px-3 font-normal"><option value="exchange">{ar ? "استبدال" : "Exchange"}</option><option value="return">{ar ? "استرجاع" : "Return"}</option></select></label><label className="text-xs font-bold">{ar ? "السبب" : "Reason"}<select name="reasonCode" required className="mt-2 h-12 w-full border border-black/15 bg-white px-3 font-normal"><option value="size">{ar ? "المقاس" : "Size"}</option><option value="colour">{ar ? "اللون" : "Colour"}</option><option value="damaged">{ar ? "تالف" : "Damaged"}</option><option value="incorrect">{ar ? "منتج غير صحيح" : "Incorrect item"}</option><option value="quality">{ar ? "الجودة" : "Quality"}</option><option value="changed_mind">{ar ? "تغيير الرأي" : "Changed mind"}</option><option value="other">{ar ? "سبب آخر" : "Other"}</option></select></label></div>
    <label className="block text-xs font-bold">{ar ? "تفاصيل إضافية" : "Additional details"}<textarea name="customerNote" maxLength={1000} rows={4} className="mt-2 w-full border border-black/15 bg-white p-3 font-normal" placeholder={ar ? "اشرح ما الذي حدث وما الذي تفضله..." : "Tell us what happened and your preferred outcome…"} /></label>
    <label className="block text-xs font-bold">{ar ? "صور إثبات (اختياري)" : "Evidence photos (optional)"}<input name="evidence" type="file" accept="image/jpeg,image/png,image/webp" multiple className="mt-2 block w-full border border-dashed border-black/20 bg-white p-4 font-normal" /><small className="mt-1 block font-normal text-neutral-500">{ar ? "حتى ٣ صور، ٥ ميجابايت لكل صورة." : "Up to 3 images, 5 MB each."}</small></label>
    {message && <p role="alert" className="border border-[#a5472f]/30 bg-[#a5472f]/8 p-3 text-sm text-[#8f3825]">{message}</p>}
    <button disabled={status === "submitting"} className="min-h-12 bg-[#073b36] px-7 text-xs font-bold uppercase tracking-[.12em] text-white disabled:opacity-60">{status === "submitting" ? (ar ? "جارٍ الإرسال..." : "Submitting…") : (ar ? "إرسال الطلب" : "Submit request")}</button>
  </form>;
}

