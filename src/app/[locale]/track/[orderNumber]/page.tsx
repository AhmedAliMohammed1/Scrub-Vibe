import { notFound } from "next/navigation";
import { OrderTracker } from "@/features/orders/order-tracker";
import { isLocale } from "@/lib/i18n";

export default async function TrackOrderPage({ params }: { params: Promise<{ locale: string; orderNumber: string }> }) {
  const { locale, orderNumber } = await params;
  if (!isLocale(locale)) notFound();
  return <OrderTracker locale={locale} orderNumber={orderNumber.toUpperCase()} />;
}
