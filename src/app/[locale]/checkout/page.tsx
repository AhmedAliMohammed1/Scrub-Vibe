import { notFound } from "next/navigation";
import { CheckoutForm } from "@/features/checkout/checkout-form";
import { isCheckoutPhoneOtpEnabled } from "@/features/checkout/config";
import { hasPaymobConfiguration } from "@/features/checkout/paymob";
import { getShippingLocations } from "@/features/shipping/repository";
import { isLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const [{ locale }, supabase] = await Promise.all([params, createClient()]);
  if (!isLocale(locale)) notFound();
  const [productsResult, shippingResult] = await Promise.all([
    supabase
      .from("products")
      .select("id, cod_deposit_minor")
      .eq("status", "active"),
    getShippingLocations(supabase).catch((error) => {
      console.error("[checkout] Shipping locations could not be loaded", error);
      return [];
    }),
  ]);
  const { data: products, error: productsError } = productsResult;
  const codDeposits = productsError
    ? null
    : Object.fromEntries(
        (products ?? []).map((product) => [
          String(product.id),
          product.cod_deposit_minor,
        ]),
      );

  return <CheckoutForm locale={locale} shippingLocations={shippingResult} payments={{
    paymob: hasPaymobConfiguration(),
    vodafoneNumber: process.env.NEXT_PUBLIC_VODAFONE_CASH_NUMBER ?? null,
    instapayAddress: process.env.NEXT_PUBLIC_INSTAPAY_ADDRESS ?? null,
  }} codDeposits={codDeposits} otpEnabled={isCheckoutPhoneOtpEnabled()} />;
}
