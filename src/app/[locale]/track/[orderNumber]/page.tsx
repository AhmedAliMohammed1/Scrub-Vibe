import { notFound } from "next/navigation";
import { OrderTracker } from "@/features/orders/order-tracker";
import { isLocale } from "@/lib/i18n";

export default async function TrackOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; orderNumber: string }>;
  searchParams: Promise<{ token?: string; phone?: string }>;
}) {
  const { locale, orderNumber } = await params;
  const { token, phone } = await searchParams;
  if (!isLocale(locale)) notFound();
  return (
    <OrderTracker
      locale={locale}
      orderNumber={orderNumber.toUpperCase()}
      initialToken={token ?? ""}
      initialPhone={phone ?? ""}
    />
  );
}
