"use client";

import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, Minus, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useShop } from "@/components/store/cart-provider";
import { isLocale } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import { trackStoreEvent } from "@/lib/analytics";

export default function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const { cart, cartItems, removeCartItem, updateQuantity } = useShop();
  if (!isLocale(locale)) return null;
  const ar = locale === "ar";
  const subtotal = cartItems.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const orderLines = cartItems.map((line) => `• ${line.title[locale]} — ${ar ? "اللون" : "Colour"}: ${line.colourName[locale]}, ${ar ? "المقاس" : "Size"}: ${line.size}, ${ar ? "الكمية" : "Qty"}: ${line.quantity}`);
  const message = ar ? `مرحباً سكراب فايب، أريد إتمام الطلب التالي:\n${orderLines.join("\n")}` : `Hello Scrub Vibe, I would like to complete this order:\n${orderLines.join("\n")}`;

  return (
    <main className="mx-auto min-h-[65vh] max-w-6xl px-5 py-10 md:px-10 md:py-16">
      <p className="eyebrow text-[#0e7468]">{ar ? "حقيبة سكراب فايب" : "SCRUB VIBE BAG"}</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4 border-b border-black/12 pb-7">
        <h1 className="font-serif text-5xl leading-none md:text-7xl">{ar ? "حقيبتك" : "Your bag"}</h1>
        {cart > 0 && <p className="text-sm text-[var(--text-muted)]">{cart} {ar ? "قطع" : `item${cart === 1 ? "" : "s"}`}</p>}
      </div>

      {!cartItems.length ? (
        <section className="grid min-h-[360px] place-items-center py-12 text-center">
          <div><h2 className="font-serif text-4xl">{ar ? "حقيبتك فارغة حالياً" : "Your bag is ready for something good."}</h2><p className="mx-auto mt-3 max-w-md text-sm text-[var(--text-muted)]">{ar ? "اكتشف السكراب والبالتوهات المصممة لشيفتاتك." : "Explore scrubs and lab coats designed to move through every shift."}</p><Link href={`/${locale}/shop`} className="mt-7 inline-flex min-h-12 items-center gap-2 bg-[#073b36] px-7 text-xs font-bold uppercase tracking-[.14em] text-white hover:bg-[#0e7468]">{ar ? "ابدأ التسوق" : "Start shopping"}<ArrowRight size={15} className="rtl:rotate-180" aria-hidden="true" /></Link></div>
        </section>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
          <section aria-label={ar ? "منتجات الحقيبة" : "Bag items"} className="divide-y divide-black/10 border-y border-black/12">
            {cartItems.map((line) => (
              <article key={line.key} className="grid grid-cols-[88px_minmax(0,1fr)_auto] gap-4 py-5 sm:grid-cols-[112px_minmax(0,1fr)_auto]">
                <Link href={`/${locale}/products/${line.slug}`} className="relative aspect-[3/4] overflow-hidden bg-[#ebe9e4]"><Image src={line.image.src} alt={line.image.alt[locale]} fill sizes="112px" className="object-cover" /></Link>
                <div className="min-w-0">
                  <Link href={`/${locale}/products/${line.slug}`} className="line-clamp-2 font-semibold hover:text-[#0e7468]">{line.title[locale]}</Link>
                  <p className="mt-2 flex min-w-0 items-center gap-2 text-xs text-[var(--text-muted)]"><span className="size-3 shrink-0 rounded-full border border-black/15" style={{ backgroundColor: line.swatch }} /><span className="truncate">{line.colourName[locale]} · {ar ? "مقاس" : "Size"} {line.size}</span></p>
                  <strong className="mt-3 block text-sm sm:hidden">{formatMoney(line.price * line.quantity, locale)}</strong>
                  <div className="mt-4 flex w-fit items-center border border-black/15 bg-white">
                    <button type="button" onClick={() => updateQuantity(line.key, -1)} disabled={line.quantity <= 1} aria-label={ar ? "تقليل الكمية" : "Decrease quantity"} className="grid size-11 place-items-center hover:bg-black/5 disabled:opacity-30"><Minus size={13} aria-hidden="true" /></button>
                    <span className="w-9 text-center text-xs font-semibold" aria-live="polite">{line.quantity}</span>
                    <button type="button" onClick={() => updateQuantity(line.key, 1)} disabled={line.quantity >= 10} aria-label={ar ? "زيادة الكمية" : "Increase quantity"} className="grid size-11 place-items-center hover:bg-black/5 disabled:opacity-30"><Plus size={13} aria-hidden="true" /></button>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button type="button" onClick={() => removeCartItem(line.key)} aria-label={ar ? "حذف المنتج" : "Remove item"} className="grid size-11 place-items-center rounded-full border border-black/15 hover:border-[#a5472f] hover:text-[#a5472f]"><Trash2 size={16} aria-hidden="true" /></button>
                  <strong className="hidden text-sm sm:block">{formatMoney(line.price * line.quantity, locale)}</strong>
                </div>
              </article>
            ))}
          </section>
          <aside className="border border-[#0e7468]/25 bg-white p-6 shadow-[0_16px_45px_rgba(7,59,54,.07)] lg:sticky lg:top-24">
            <h2 className="font-serif text-3xl">{ar ? "ملخص الحقيبة" : "Bag summary"}</h2>
            <dl className="mt-6 border-y border-black/10 py-4 text-sm"><div className="flex justify-between gap-4"><dt>{ar ? "الإجمالي المبدئي" : "Subtotal"}</dt><dd className="font-bold">{formatMoney(subtotal, locale)}</dd></div><p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">{ar ? "يتم حساب الشحن والخصومات في الخطوة التالية." : "Delivery and discounts are calculated at checkout."}</p></dl>
            <Link href={`/${locale}/checkout` as Route} onClick={() => trackStoreEvent("begin_checkout", { metadata: { cart_items: cart, cart_lines: cartItems.length } })} className="mt-5 flex min-h-13 w-full items-center justify-center bg-[#073b36] px-5 text-xs font-bold uppercase tracking-[.14em] text-white hover:bg-[#0e7468]">{ar ? "الدفع وإتمام الطلب" : "Secure checkout"}</Link>
            <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-[var(--text-muted)]"><ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#0e7468]" aria-hidden="true" />{ar ? "دفع محمي، مع خيارات فودافون كاش وإنستاباي والدفع عند الاستلام بمقدم." : "Protected checkout with Vodafone Cash, InstaPay, and cash on delivery with a deposit."}</p>
            <a href={`https://wa.me/201096733209?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer" className="mt-5 block text-center text-xs font-semibold underline underline-offset-4">{ar ? "تحتاج مساعدة؟ واتساب" : "Need help? WhatsApp us"}</a>
            <Link href={`/${locale}/shop`} className="mt-4 block text-center text-xs text-[var(--text-muted)] hover:text-[#0e7468]">{ar ? "واصل التسوق" : "Continue shopping"}</Link>
          </aside>
        </div>
      )}
    </main>
  );
}
