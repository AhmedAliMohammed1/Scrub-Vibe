import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Check,
  Clock3,
  PackageCheck,
  RotateCcw,
  WalletCards,
} from "lucide-react";
import { isLocale } from "@/lib/i18n";
import { requireUser } from "@/server/auth/roles";
import {
  returnRefundMethodLabel,
  returnResolutionLabel,
  returnStatusLabel,
} from "@/features/commercial/return-workflow";

const terminalStatuses = new Set(["rejected", "completed", "cancelled"]);

function formatMoney(minor: number, locale: "en" | "ar") {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    style: "currency",
    currency: "EGP",
  }).format(minor / 100);
}

function formatDate(value: string, locale: "en" | "ar") {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function ReturnsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ created?: string; error?: string }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const { supabase, userId } = await requireUser();
  const { data: rows, error } = await supabase
    .from("return_requests")
    .select(
      "id, return_number, request_type, status, resolution, reason_code, customer_note, staff_note, requested_at, reviewed_at, received_at, completed_at, refund_amount_minor, refund_method, refund_reference, refund_completed_at, orders(order_number), return_request_items(id, quantity, received_quantity, requested_colour, requested_size, order_items(title_en, title_ar, colour_en, colour_ar, size)), return_status_history(id, status, note, created_at)",
    )
    .eq("user_id", userId)
    .order("requested_at", { ascending: false });
  const ar = locale === "ar";

  return (
    <main className="mx-auto min-h-[70vh] max-w-5xl px-5 py-12 md:px-10 md:py-18">
      <Link
        href={`/${locale}/account`}
        className="inline-flex min-h-11 items-center text-xs font-semibold underline underline-offset-4"
      >
        ← {ar ? "الحساب" : "Account"}
      </Link>
      <div className="mt-6 border-b border-black/10 pb-7">
        <p className="eyebrow text-[#0e7468]">
          {ar ? "خدمة ما بعد البيع" : "AFTER-SALES CARE"}
        </p>
        <h1 className="mt-3 font-serif text-4xl text-[#172421] sm:text-5xl">
          {ar ? "الاسترجاع والاستبدال" : "Returns & exchanges"}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
          {ar
            ? "تابع المراجعة والاستلام والتسوية، واقرأ رسائل فريقنا في مكان واحد."
            : "Follow review, receipt, and settlement progress, with every customer update in one place."}
        </p>
      </div>

      {query.created && (
        <p className="mt-5 rounded-xs border border-[#18794e]/30 bg-[#18794e]/8 p-4 text-sm text-[#12643f]">
          {ar
            ? "تم إرسال طلبك وسنراجعه قريباً."
            : "Your request was submitted and will be reviewed shortly."}
        </p>
      )}
      {(query.error || error) && (
        <p className="mt-5 rounded-xs border border-[#a5472f]/30 bg-[#a5472f]/8 p-4 text-sm text-[#8f3520]">
          {ar
            ? "تعذر تحميل طلبات الاسترجاع الآن. حاول مرة أخرى."
            : "We could not load your return requests. Please try again."}
        </p>
      )}

      <div className="mt-8 space-y-6">
        {rows?.length ? (
          rows.map((row) => {
            const history = row.return_status_history.toSorted(
              (a, b) =>
                new Date(a.created_at).getTime() -
                new Date(b.created_at).getTime(),
            );
            return (
              <article
                key={row.id}
                className="overflow-hidden rounded-xs border border-black/10 bg-white shadow-xs"
              >
                <header className="flex flex-wrap items-start justify-between gap-4 bg-[#f3f7f5] p-5 sm:p-6">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#0e7468]">
                      {row.request_type === "exchange"
                        ? ar
                          ? "طلب استبدال"
                          : "Exchange request"
                        : ar
                          ? "طلب استرجاع"
                          : "Return request"}
                    </p>
                    <h2 className="mt-1 font-serif text-2xl text-[#172421]">
                      {row.return_number}
                    </h2>
                    <p className="mt-1 text-xs text-neutral-500">
                      {row.orders?.order_number} ·{" "}
                      {formatDate(row.requested_at, locale)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.08em] ${
                      row.status === "rejected" || row.status === "cancelled"
                        ? "bg-[#f6e6e1] text-[#8f3520]"
                        : row.status === "completed"
                          ? "bg-[#073b36] text-white"
                          : "bg-[#dce9e5] text-[#073b36]"
                    }`}
                  >
                    {returnStatusLabel(row.status, locale)}
                  </span>
                </header>

                <div className="grid gap-7 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,.85fr)]">
                  <div>
                    {row.staff_note && (
                      <section className="rounded-xs border-s-4 border-[#0e7468] bg-[#edf5f2] p-4">
                        <h3 className="text-xs font-bold uppercase tracking-[.1em] text-[#073b36]">
                          {ar ? "آخر رسالة من فريقنا" : "Latest team update"}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-[#263936]">
                          {row.staff_note}
                        </p>
                      </section>
                    )}

                    <section className="mt-5">
                      <h3 className="text-xs font-bold uppercase tracking-[.1em] text-neutral-700">
                        {ar ? "المنتجات" : "Items"}
                      </h3>
                      <div className="mt-3 divide-y divide-black/10 border-y border-black/10">
                        {row.return_request_items.map((item) => {
                          const title =
                            (ar
                              ? item.order_items?.title_ar
                              : item.order_items?.title_en) ??
                            (ar ? "منتج" : "Product");
                          const variant = [
                            ar
                              ? item.order_items?.colour_ar
                              : item.order_items?.colour_en,
                            item.order_items?.size,
                          ]
                            .filter(Boolean)
                            .join(" · ");
                          return (
                            <div
                              key={item.id}
                              className="flex flex-wrap justify-between gap-3 py-3 text-sm"
                            >
                              <div>
                                <strong>{title}</strong>
                                {variant && (
                                  <p className="mt-1 text-xs text-neutral-500">
                                    {variant}
                                  </p>
                                )}
                              </div>
                              <p className="text-xs text-neutral-600">
                                {ar ? "المطلوب" : "Requested"}: {item.quantity}
                                {item.received_quantity > 0 && (
                                  <>
                                    {" "}
                                    · {ar ? "المستلم" : "Received"}:{" "}
                                    {item.received_quantity}
                                  </>
                                )}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </section>

                    <section className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xs border border-black/10 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[.1em] text-neutral-500">
                          {ar ? "سبب الطلب" : "Request reason"}
                        </p>
                        <p className="mt-2 text-sm font-semibold">
                          {row.reason_code.replaceAll("_", " ")}
                        </p>
                        {row.customer_note && (
                          <p className="mt-2 text-xs leading-5 text-neutral-600">
                            {row.customer_note}
                          </p>
                        )}
                      </div>
                      <div className="rounded-xs border border-black/10 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[.1em] text-neutral-500">
                          {ar ? "طريقة التسوية" : "Resolution"}
                        </p>
                        <p className="mt-2 text-sm font-semibold">
                          {row.resolution
                            ? returnResolutionLabel(row.resolution, locale)
                            : ar
                              ? "لم تُحدد بعد"
                              : "Not decided yet"}
                        </p>
                      </div>
                    </section>

                    {row.resolution === "refund" &&
                      row.refund_amount_minor > 0 && (
                        <section className="mt-5 rounded-xs border border-[#0e7468]/25 bg-[#f3f7f5] p-4">
                          <div className="flex gap-3">
                            <WalletCards
                              className="mt-0.5 size-5 shrink-0 text-[#0e7468]"
                              aria-hidden="true"
                            />
                            <div>
                              <h3 className="text-sm font-bold text-[#073b36]">
                                {row.refund_completed_at
                                  ? ar
                                    ? "تم إرسال مبلغ الاسترداد"
                                    : "Refund sent"
                                  : ar
                                    ? "تسوية الاسترداد"
                                    : "Refund settlement"}
                              </h3>
                              <p className="mt-1 text-lg font-semibold">
                                {formatMoney(row.refund_amount_minor, locale)}
                              </p>
                              {row.refund_method && (
                                <p className="mt-1 text-xs text-neutral-600">
                                  {returnRefundMethodLabel(
                                    row.refund_method,
                                    locale,
                                  )}
                                  {row.refund_reference
                                    ? ` · ${row.refund_reference}`
                                    : ""}
                                </p>
                              )}
                            </div>
                          </div>
                        </section>
                      )}
                  </div>

                  <section
                    aria-label={ar ? "سجل حالة الطلب" : "Return status history"}
                  >
                    <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.1em] text-neutral-700">
                      <Clock3 className="size-4" aria-hidden="true" />
                      {ar ? "سجل الحالة" : "Status timeline"}
                    </h3>
                    <ol className="mt-4 space-y-0">
                      {history.map((entry, index) => {
                        const last = index === history.length - 1;
                        return (
                          <li
                            key={entry.id}
                            className="relative grid grid-cols-[1.75rem_1fr] gap-3 pb-5 last:pb-0"
                          >
                            {!last && (
                              <span className="absolute start-[.84rem] top-6 h-[calc(100%-1rem)] w-px bg-[#b8cec8]" />
                            )}
                            <span className="relative z-10 grid size-7 place-items-center rounded-full bg-[#073b36] text-white">
                              <Check className="size-3.5" aria-hidden="true" />
                            </span>
                            <div>
                              <strong className="text-sm">
                                {returnStatusLabel(entry.status, locale)}
                              </strong>
                              <p className="mt-1 text-[11px] text-neutral-500">
                                {formatDate(entry.created_at, locale)}
                              </p>
                              {entry.note &&
                                entry.note !== "Customer submitted request" && (
                                <p className="mt-2 rounded-xs bg-neutral-50 p-3 text-xs leading-5 text-neutral-600">
                                    {entry.note}
                                  </p>
                                )}
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                    {!terminalStatuses.has(row.status) && (
                      <p className="mt-5 flex gap-2 rounded-xs border border-black/10 bg-[#fafbf9] p-3 text-xs leading-5 text-neutral-600">
                        {row.status === "received" ? (
                          <PackageCheck
                            className="mt-0.5 size-4 shrink-0 text-[#0e7468]"
                            aria-hidden="true"
                          />
                        ) : (
                          <RotateCcw
                            className="mt-0.5 size-4 shrink-0 text-[#0e7468]"
                            aria-hidden="true"
                          />
                        )}
                        <span>
                          {ar
                            ? "سيظهر أي تحديث جديد هنا وسنرسله أيضاً إلى بريدك الإلكتروني."
                            : "New updates will appear here and will also be sent to your email."}
                        </span>
                      </p>
                    )}
                  </section>
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-xs border border-dashed border-black/20 bg-[#fafbf9] px-6 py-14 text-center">
            <RotateCcw
              className="mx-auto size-7 text-[#0e7468]"
              aria-hidden="true"
            />
            <h2 className="mt-3 font-serif text-2xl">
              {ar ? "لا توجد طلبات استرجاع بعد" : "No return requests yet"}
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              {ar
                ? "يمكنك فتح طلب من تفاصيل أي طلب تم توصيله."
                : "You can start one from the details of any delivered order."}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
