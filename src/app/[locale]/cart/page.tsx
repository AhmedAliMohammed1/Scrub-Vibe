"use client";
import { use } from "react";
import Link from "next/link";
import { useShop } from "@/components/store/cart-provider";
import { isLocale } from "@/lib/i18n";
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
      <p className="eyebrow">NOVA BAG</p>
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
    </main>
  );
}
