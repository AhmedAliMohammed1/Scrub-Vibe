"use client";
import { use } from "react";
import Link from "next/link";
import { useShop } from "@/components/store/cart-provider";
import { isLocale } from "@/lib/i18n";
import { trackStoreEvent } from "@/lib/analytics";
export default function CartPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const { cart } = useShop();
  if (!isLocale(locale)) return null;
  return (
    <main className="mx-auto min-h-[60vh] max-w-3xl px-5 py-20">
      <p className="eyebrow">SCRUB VIBE BAG</p>
      <h1 className="mt-4 font-serif text-6xl">
        {locale === "ar" ? "حقيبتك" : "Your bag"}
      </h1>
      <div className="mt-10 border-y border-black/15 py-10">
        <p className="text-lg">
          {cart
            ? `${cart} ${locale === "ar" ? "قطع محفوظة في هذه الجلسة" : "items saved in this session"}`
            : locale === "ar"
              ? "حقيبتك فارغة حالياً."
              : "Your bag is empty for now."}
        </p>
      </div>
      <Link
        href={`/${locale}/shop`}
        className="mt-8 inline-block bg-neutral-950 px-6 py-4 text-xs font-bold uppercase tracking-[.14em] text-white"
      >
        {locale === "ar" ? "واصل التسوق" : "Continue shopping"}
      </Link>
      {cart > 0 && (
        <a
          href={`https://wa.me/201096733209?text=${encodeURIComponent(
            locale === "ar"
              ? `مرحباً سكراب فايب، أريد إتمام طلب يحتوي على ${cart} قطعة.`
              : `Hello Scrub Vibe, I would like to complete an order for ${cart} item${cart === 1 ? "" : "s"}.`,
          )}`}
          target="_blank"
          rel="noreferrer"
          onClick={() =>
            trackStoreEvent("begin_checkout", {
              metadata: { cart_items: cart },
            })
          }
          className="ms-3 mt-8 inline-block bg-[#0e7468] px-6 py-4 text-xs font-bold uppercase tracking-[.14em] text-white"
        >
          {locale === "ar" ? "اطلب عبر واتساب" : "Order on WhatsApp"}
        </a>
      )}
    </main>
  );
}
