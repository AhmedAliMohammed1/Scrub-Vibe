import { notFound } from "next/navigation";
import { PrintInvoiceButton } from "@/features/commercial/print-invoice-button";
import { isLocale } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/server/auth/roles";

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ locale: string; orderNumber: string }>;
}) {
  const { locale, orderNumber } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase, userId } = await requireUser();
  const { data: order } = await supabase
    .from("orders")
    .select(
      "order_number, created_at, customer_name, email, phone, street_address, building, floor, apartment, city, governorate, payment_method, payment_status, subtotal_minor, discount_minor, shipping_minor, cod_surcharge_minor, total_minor, currency, order_items(sku, title_en, title_ar, colour_en, colour_ar, size, unit_price_minor, quantity, line_total_minor)",
    )
    .eq("order_number", orderNumber)
    .eq("user_id", userId)
    .maybeSingle();
  if (!order) notFound();
  const ar = locale === "ar";
  const address = [
    order.street_address,
    order.building,
    order.floor,
    order.apartment,
    order.city,
    order.governorate,
  ]
    .filter(Boolean)
    .join(", ");
  return (
    <main className="mx-auto max-w-4xl bg-white px-5 py-12 text-[#17211f] print:max-w-none print:p-0 md:px-10">
      <header className="flex items-start justify-between gap-6 border-b-2 border-[#073b36] pb-7">
        <div>
          <p className="text-xl font-black tracking-[-.04em]">
            SCRUB <span className="font-light text-[#0e7468]">VIBE</span>
          </p>
          <p className="mt-2 text-xs text-neutral-500">Medical wear · Egypt</p>
        </div>
        <div className="text-end">
          <h1 className="font-serif text-4xl">{ar ? "فاتورة" : "Invoice"}</h1>
          <strong className="mt-2 block">{order.order_number}</strong>
          <small>
            {new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(
              new Date(order.created_at),
            )}
          </small>
        </div>
      </header>
      <section className="grid gap-6 border-b border-black/10 py-7 sm:grid-cols-2">
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-[.14em] text-neutral-500">
            {ar ? "بيانات العميل" : "Billed to"}
          </h2>
          <p className="mt-2 text-sm leading-6">
            {order.customer_name}
            <br />
            {order.email}
            <br />
            {order.phone}
          </p>
        </div>
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-[.14em] text-neutral-500">
            {ar ? "عنوان التوصيل" : "Delivery address"}
          </h2>
          <p className="mt-2 text-sm leading-6">{address}</p>
          <p className="mt-2 text-xs uppercase text-neutral-500">
            {order.payment_method.replaceAll("_", " ")} ·{" "}
            {order.payment_status.replaceAll("_", " ")}
          </p>
        </div>
      </section>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-black/20 text-[10px] uppercase tracking-[.12em] text-neutral-500">
              <th className="py-4 text-start">{ar ? "المنتج" : "Item"}</th>
              <th className="py-4 text-center">{ar ? "الكمية" : "Qty"}</th>
              <th className="py-4 text-end">{ar ? "السعر" : "Price"}</th>
              <th className="py-4 text-end">{ar ? "الإجمالي" : "Total"}</th>
            </tr>
          </thead>
          <tbody>
            {order.order_items.map((item) => (
              <tr key={item.sku} className="border-b border-black/10">
                <td className="py-4">
                  <strong>{ar ? item.title_ar : item.title_en}</strong>
                  <small className="mt-1 block text-neutral-500">
                    {ar ? item.colour_ar : item.colour_en}
                    {item.size ? ` · ${item.size}` : ""}
                    <br />
                    {item.sku}
                  </small>
                </td>
                <td className="py-4 text-center">{item.quantity}</td>
                <td className="py-4 text-end">
                  {formatMoney(item.unit_price_minor, locale)}
                </td>
                <td className="py-4 text-end font-bold">
                  {formatMoney(
                    item.line_total_minor ??
                      item.unit_price_minor * item.quantity,
                    locale,
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <dl className="ms-auto mt-7 max-w-sm space-y-3 text-sm">
        <div className="flex justify-between">
          <dt>{ar ? "المجموع الفرعي" : "Subtotal"}</dt>
          <dd>{formatMoney(order.subtotal_minor, locale)}</dd>
        </div>
        {order.discount_minor > 0 && (
          <div className="flex justify-between text-[#18794e]">
            <dt>{ar ? "الخصم" : "Discount"}</dt>
            <dd>-{formatMoney(order.discount_minor, locale)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt>{ar ? "الشحن" : "Shipping"}</dt>
          <dd>{formatMoney(order.shipping_minor, locale)}</dd>
        </div>
        {order.cod_surcharge_minor > 0 && (
          <div className="flex justify-between">
            <dt>{ar ? "رسوم الدفع عند الاستلام" : "COD fee"}</dt>
            <dd>{formatMoney(order.cod_surcharge_minor, locale)}</dd>
          </div>
        )}
        <div className="flex justify-between border-t-2 border-[#073b36] pt-4 text-lg font-bold">
          <dt>{ar ? "الإجمالي" : "Total"}</dt>
          <dd>{formatMoney(order.total_minor, locale)}</dd>
        </div>
      </dl>
      <footer className="mt-12 flex items-end justify-between gap-6 border-t border-black/10 pt-6">
        <p className="max-w-lg text-xs leading-5 text-neutral-500">
          {ar
            ? "هذه فاتورة إلكترونية صادرة عن Scrub Vibe. للاستفسارات تواصل مع فريق الدعم."
            : "This electronic invoice was issued by Scrub Vibe. Contact support with any questions."}
        </p>
        <PrintInvoiceButton
          label={ar ? "طباعة / حفظ PDF" : "Print / save PDF"}
        />
      </footer>
    </main>
  );
}
