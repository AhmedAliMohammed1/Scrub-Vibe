import { notFound } from "next/navigation";
import { CheckoutForm } from "@/features/checkout/checkout-form";
import { hasPaymobConfiguration } from "@/features/checkout/paymob";
import { isLocale } from "@/lib/i18n";

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <CheckoutForm locale={locale} payments={{
    paymob: hasPaymobConfiguration(),
    vodafoneNumber: process.env.NEXT_PUBLIC_VODAFONE_CASH_NUMBER ?? null,
    instapayAddress: process.env.NEXT_PUBLIC_INSTAPAY_ADDRESS ?? null,
  }} />;
}
