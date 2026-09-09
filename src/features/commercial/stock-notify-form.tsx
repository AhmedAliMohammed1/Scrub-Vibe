"use client";

import { useMemo, useState } from "react";
import { BellRing, CheckCircle2 } from "lucide-react";
import type { Product } from "@/features/catalog/types";
import type { Locale } from "@/lib/i18n";

export function StockNotifyForm({ product, locale }: { product: Product; locale: Locale }) {
  const ar = locale === "ar";
  const options = useMemo(() => product.colors.flatMap((colour) =>
    Object.entries(colour.allVariants)
      .filter(([size]) => (colour.stockBySize[size] ?? 0) <= 0)
      .map(([size, variantId]) => ({ variantId, label: `${colour.name[locale]} · ${size}` }))), [product.colors, locale]);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(formData: FormData) {
    setStatus("sending");
    setMessage("");
    const response = await fetch("/api/stock/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        productId: product.id,
        variantId: formData.get("variantId") || undefined,
        email: formData.get("email"),
        locale,
      }),
    });
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    setStatus(response.ok ? "success" : "error");
    setMessage(body.message ?? (ar ? "تعذر حفظ التنبيه." : "Could not save the alert."));
  }

  return (
    <form action={submit} className="mt-7 border border-[#0e7468]/20 bg-[#f0f5f3] p-5">
      <div className="flex items-start gap-3"><BellRing size={20} className="mt-0.5 text-[#0e7468]" /><div><h2 className="font-serif text-2xl">{ar ? "أخبرني عند توفره" : "Notify me when available"}</h2><p className="mt-1 text-xs text-[var(--text-muted)]">{ar ? "سنرسل رسالة واحدة فقط عند عودة اختيارك للمخزون." : "We’ll send one email when your selection is back in stock."}</p></div></div>
      {options.length > 0 && <label className="mt-4 block text-xs font-bold">{ar ? "اللون والمقاس" : "Colour and size"}<select name="variantId" className="mt-2 h-12 w-full border border-black/15 bg-white px-3 font-normal" required><option value="">{ar ? "اختر" : "Select"}</option>{options.map((option) => <option key={option.variantId} value={option.variantId}>{option.label}</option>)}</select></label>}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row"><label className="sr-only" htmlFor={`stock-email-${product.id}`}>{ar ? "البريد الإلكتروني" : "Email"}</label><input id={`stock-email-${product.id}`} name="email" type="email" required autoComplete="email" placeholder={ar ? "البريد الإلكتروني" : "Email address"} className="h-12 min-w-0 flex-1 border border-black/15 bg-white px-4 text-sm" /><button disabled={status === "sending" || status === "success"} className="h-12 bg-[#073b36] px-5 text-xs font-bold uppercase tracking-[.12em] text-white disabled:opacity-60">{status === "sending" ? (ar ? "جارٍ الحفظ..." : "Saving…") : (ar ? "أرسل التنبيه" : "Create alert")}</button></div>
      {status !== "idle" && <p className={`mt-3 flex items-center gap-2 text-xs ${status === "error" ? "text-[#a5472f]" : "text-[#18794e]"}`} role="status">{status === "success" && <CheckCircle2 size={15} />}{message}</p>}
    </form>
  );
}
