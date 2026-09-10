"use client";

import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRight,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { useShop } from "@/components/store/cart-provider";
import { isLocale } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import { trackStoreEvent } from "@/lib/analytics";

export default function CartPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const { cart, cartItems, removeCartItem, updateQuantity } = useShop();
  if (!isLocale(locale)) return null;
  const ar = locale === "ar";
  const subtotal = cartItems.reduce(
    (sum, line) => sum + line.price * line.quantity,
    0,
  );

  const orderLines = cartItems.map(
    (line) =>
      `• ${line.title[locale]} — ${ar ? "اللون" : "Colour"}: ${line.colourName[locale]}, ${ar ? "المقاس" : "Size"}: ${line.size}, ${ar ? "الكمية" : "Qty"}: ${line.quantity}`,
  );
  const message = ar
    ? `مرحباً سكراب فايب، أريد إتمام الطلب التالي:\n${orderLines.join("\n")}`
    : `Hello Scrub Vibe, I would like to complete this order:\n${orderLines.join("\n")}`;

  return (
    <main className="mx-auto min-h-[70vh] max-w-[1440px] px-5 py-10 sm:px-6 md:px-10 md:py-16">
      {/* Header */}
      <p className="eyebrow text-[#0e7468]">
        {ar ? "حقيبة سكراب فايب" : "SCRUB VIBE BAG"}
      </p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
        <h1 className="font-serif text-3xl sm:text-4xl md:text-6xl text-[var(--text-strong)]">
          {ar ? "حقيبة التسوق" : "Your bag"}
        </h1>
        {cart > 0 && (
          <span className="rounded-full bg-[#f0f5f3] px-3.5 py-1 text-xs font-bold text-[#073b36]">
            {cart} {ar ? "قطع مختارة" : `item${cart === 1 ? "" : "s"}`}
          </span>
        )}
      </div>

      {!cartItems.length ? (
        /* Empty Cart State */
        <section className="my-12 rounded-xs border border-[var(--border-subtle)] bg-white px-6 py-20 text-center shadow-xs">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#f0f5f3] text-[#073b36]">
            <ShoppingBag size={28} strokeWidth={1.6} aria-hidden="true" />
          </div>
          <h2 className="mt-6 font-serif text-2xl md:text-3xl text-[var(--text-strong)]">
            {ar ? "حقيبتك فارغة حالياً" : "Your shopping bag is empty"}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--text-muted)]">
            {ar
              ? "استكشف أحدث تشكيلات السكراب والبالتوهات المصممة خصيصاً للتحمل والراحة في أصعب الشيفتات الطبية."
              : "Discover medical scrub sets and lab coats engineered for peak comfort, tailored fit, and durability across long clinical shifts."}
          </p>
          <Link
            href={`/${locale}/shop` as Route}
            className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xs bg-[#073b36] px-8 text-xs font-bold uppercase tracking-[.14em] text-white shadow-xs hover:bg-[#0e7468]"
          >
            {ar ? "ابدأ التسوق الآن" : "Start shopping now"}
            <ArrowRight
              size={15}
              className="rtl:rotate-180"
              aria-hidden="true"
            />
          </Link>
        </section>
      ) : (
        /* Cart Items and Checkout Column */
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start xl:gap-12">
          {/* Items Section */}
          <section
            aria-label={ar ? "منتجات الحقيبة" : "Bag items"}
            className="divide-y divide-[var(--border-subtle)] rounded-xs border border-[var(--border-subtle)] bg-white shadow-xs"
          >
            {cartItems.map((line) => (
              <article
                key={line.key}
                className="relative grid grid-cols-[72px_minmax(0,1fr)] gap-4 p-4 sm:grid-cols-[112px_minmax(0,1fr)_auto] sm:gap-6 sm:p-5"
              >
                {/* Product Image */}
                <Link
                  href={`/${locale}/products/${line.slug}` as Route}
                  className="relative aspect-[3/4] overflow-hidden rounded-xs border border-[var(--border-subtle)] bg-[#ebe9e4]"
                >
                  <Image
                    src={line.image.src}
                    alt={line.image.alt[locale]}
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                </Link>

                {/* Details */}
                <div className="min-w-0 pe-8 sm:pe-0">
                  <Link
                    href={`/${locale}/products/${line.slug}` as Route}
                    className="line-clamp-2 text-sm font-semibold text-[var(--text-strong)] transition-colors hover:text-[#0e7468]"
                  >
                    {line.title[locale]}
                  </Link>
                  <p className="mt-2 flex min-w-0 items-center gap-2 text-xs text-[var(--text-muted)]">
                    <span
                      className="size-3 shrink-0 rounded-full border border-black/20"
                      style={{ backgroundColor: line.swatch }}
                    />
                    <span className="truncate">
                      {line.colourName[locale]} · {ar ? "المقاس" : "Size"}{" "}
                      <strong className="font-bold text-[var(--text-strong)]">
                        {line.size}
                      </strong>
                    </span>
                  </p>

                  <div className="mt-3 block text-sm font-bold text-[var(--text-strong)] sm:hidden">
                    {formatMoney(line.price * line.quantity, locale)}
                  </div>

                  {/* Quantity Stepper */}
                  <div className="mt-4 flex w-fit items-center rounded-xs border border-[var(--border-subtle)] bg-[var(--surface-canvas)]">
                    <button
                      type="button"
                      onClick={() => updateQuantity(line.key, -1)}
                      disabled={line.quantity <= 1}
                      aria-label={ar ? "تقليل الكمية" : "Decrease quantity"}
                      className="grid size-11 place-items-center text-[var(--text-strong)] hover:bg-black/5 disabled:opacity-30"
                    >
                      <Minus size={13} aria-hidden="true" />
                    </button>
                    <span
                      className="w-10 text-center text-xs font-bold text-[var(--text-strong)]"
                      aria-live="polite"
                    >
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(line.key, 1)}
                      disabled={line.quantity >= 10}
                      aria-label={ar ? "زيادة الكمية" : "Increase quantity"}
                      className="grid size-11 place-items-center text-[var(--text-strong)] hover:bg-black/5 disabled:opacity-30"
                    >
                      <Plus size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Right price and remove */}
                <div className="absolute end-2 top-2 flex flex-col items-end justify-between sm:static">
                  <button
                    type="button"
                    onClick={() => removeCartItem(line.key)}
                    aria-label={ar ? "حذف المنتج" : "Remove item"}
                    className="grid size-11 place-items-center rounded-full text-[var(--text-muted)] transition hover:bg-[#a5472f]/10 hover:text-[#a5472f]"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                  <strong className="hidden text-base font-bold text-[var(--text-strong)] sm:block">
                    {formatMoney(line.price * line.quantity, locale)}
                  </strong>
                </div>
              </article>
            ))}
          </section>

          {/* Sticky Order Summary */}
          <aside className="rounded-xs border border-[var(--border-subtle)] bg-white p-6 shadow-xs lg:sticky lg:top-24">
            <h2 className="font-serif text-2xl text-[var(--text-strong)]">
              {ar ? "ملخص الطلب" : "Order summary"}
            </h2>

            <dl className="mt-5 space-y-3 border-y border-[var(--border-subtle)] py-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-[var(--text-muted)]">
                  {ar ? "المجموع الفرعي" : "Subtotal"}
                </dt>
                <dd className="font-bold text-[var(--text-strong)]">
                  {formatMoney(subtotal, locale)}
                </dd>
              </div>
              <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                {ar
                  ? "يتم حساب رسوم الشحن وأي كود خصم إضافي في خطوة الدفع التالية."
                  : "Shipping fees and promotional discounts will be calculated at checkout."}
              </p>
            </dl>

            <Link
              href={`/${locale}/checkout` as Route}
              onClick={() =>
                trackStoreEvent("begin_checkout", {
                  metadata: {
                    cart_items: cart,
                    cart_lines: cartItems.length,
                  },
                })
              }
              className="mt-6 flex min-h-12 w-full items-center justify-center rounded-xs bg-[#073b36] px-6 text-xs font-bold uppercase tracking-[.14em] text-white shadow-xs transition hover:bg-[#0e7468]"
            >
              {ar ? "متابعة الدفع الآمن" : "Proceed to secure checkout"}
            </Link>

            <div className="mt-5 flex items-start gap-2.5 rounded-xs bg-[#f0f5f3] p-3 text-xs leading-relaxed text-[#073b36]">
              <ShieldCheck
                size={18}
                className="mt-0.5 shrink-0 text-[#0e7468]"
                aria-hidden="true"
              />
              <span>
                {ar
                  ? "دفع محمي ومضمون، يدعم فودافون كاش وإنستاباي والدفع عند الاستلام بمقدم."
                  : "Protected checkout supporting Vodafone Cash, InstaPay, and COD with deposit."}
              </span>
            </div>

            <a
              href={`https://wa.me/201096733209?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex min-h-11 items-center justify-center text-center text-xs font-semibold text-[var(--text-strong)] underline underline-offset-4 hover:text-[#0e7468]"
            >
              {ar ? "طلب عبر الواتساب مباشرة؟" : "Order via WhatsApp directly?"}
            </a>

            <Link
              href={`/${locale}/shop` as Route}
              className="flex min-h-11 items-center justify-center text-center text-xs font-medium text-[var(--text-muted)] hover:text-[#073b36]"
            >
              {ar ? "مواصلة التسوق" : "Continue shopping"}
            </Link>
          </aside>
        </div>
      )}
    </main>
  );
}
