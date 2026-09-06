"use client";

import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { Trash2 } from "lucide-react";
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
  const { cart, cartItems, removeCartItem } = useShop();
  if (!isLocale(locale)) return null;

  const orderLines = cartItems.map(
    (line) =>
      `• ${line.title[locale]} — ${locale === "ar" ? "اللون" : "Colour"}: ${line.colourName[locale]}, ${locale === "ar" ? "المقاس" : "Size"}: ${line.size}, ${locale === "ar" ? "الكمية" : "Qty"}: ${line.quantity}`,
  );
  const message =
    locale === "ar"
      ? `مرحباً سكراب فايب، أريد إتمام الطلب التالي:\n${orderLines.join("\n")}`
      : `Hello Scrub Vibe, I would like to complete this order:\n${orderLines.join("\n")}`;

  return (
    <main className="mx-auto min-h-[60vh] max-w-4xl px-5 py-20">
      <p className="eyebrow">SCRUB VIBE BAG</p>
      <h1 className="mt-4 font-serif text-6xl">
        {locale === "ar" ? "حقيبتك" : "Your bag"}
      </h1>

      <div className="mt-10 divide-y divide-black/10 border-y border-black/15">
        {cartItems.length ? (
          cartItems.map((line) => (
            <article
              key={line.key}
              className="grid grid-cols-[88px_1fr_auto] gap-4 py-5"
            >
              <Link
                href={`/${locale}/products/${line.slug}`}
                className="relative aspect-[3/4] overflow-hidden bg-[#ebe9e4]"
              >
                <Image
                  src={line.image.src}
                  alt={line.image.alt[locale]}
                  fill
                  sizes="88px"
                  className="object-cover"
                />
              </Link>
              <div>
                <Link
                  href={`/${locale}/products/${line.slug}`}
                  className="font-medium hover:underline"
                >
                  {line.title[locale]}
                </Link>
                <p className="mt-2 flex items-center gap-2 text-xs text-neutral-600">
                  <span
                    className="size-3 rounded-full border border-black/15"
                    style={{ backgroundColor: line.swatch }}
                  />
                  {line.colourName[locale]} ·{" "}
                  {locale === "ar" ? "مقاس" : "Size"} {line.size} ·{" "}
                  {locale === "ar" ? "الكمية" : "Qty"} {line.quantity}
                </p>
                <strong className="mt-3 block text-xs">
                  {formatMoney(line.price * line.quantity, locale)}
                </strong>
              </div>
              <button
                type="button"
                onClick={() => removeCartItem(line.key)}
                aria-label={locale === "ar" ? "حذف المنتج" : "Remove item"}
                className="grid size-9 place-items-center rounded-full border border-black/15 hover:bg-black hover:text-white"
              >
                <Trash2 size={15} />
              </button>
            </article>
          ))
        ) : (
          <p className="py-10 text-lg">
            {locale === "ar"
              ? "حقيبتك فارغة حالياً."
              : "Your bag is empty for now."}
          </p>
        )}
      </div>

      <p className="mt-4 text-sm text-neutral-600">
        {cart
          ? `${cart} ${locale === "ar" ? "قطع في الحقيبة" : `item${cart === 1 ? "" : "s"} in your bag`}`
          : ""}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={`/${locale}/shop`}
          className="inline-block bg-neutral-950 px-6 py-4 text-xs font-bold uppercase tracking-[.14em] text-white"
        >
          {locale === "ar" ? "واصل التسوق" : "Continue shopping"}
        </Link>
        {cart > 0 && (<>
          <Link
            href={`/${locale}/checkout` as Route}
            onClick={() =>
              trackStoreEvent("begin_checkout", {
                metadata: { cart_items: cart, cart_lines: cartItems.length },
              })
            }
            className="inline-block bg-[#0e7468] px-6 py-4 text-xs font-bold uppercase tracking-[.14em] text-white"
          >
            {locale === "ar" ? "الدفع وإتمام الطلب" : "Secure checkout"}
          </Link>
          <a href={`https://wa.me/201096733209?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer" className="inline-block border border-black/20 px-6 py-4 text-xs font-bold uppercase tracking-[.14em]">
            {locale === "ar" ? "مساعدة عبر واتساب" : "WhatsApp help"}
          </a>
        </>)}
      </div>
    </main>
  );
}
