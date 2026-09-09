import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { requireUser } from "@/server/auth/roles";

export default async function ReturnsPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ created?: string; expired?: string }> }) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const { supabase, userId } = await requireUser();
  const { data: rows } = await supabase.from("return_requests").select("id, return_number, request_type, status, reason_code, requested_at, orders(order_number), return_request_items(quantity)").eq("user_id", userId).order("requested_at", { ascending: false });
  const ar = locale === "ar";
  return <main className="mx-auto min-h-[70vh] max-w-4xl px-5 py-14 md:px-10 md:py-20"><Link href={`/${locale}/account`} className="text-xs underline underline-offset-4">← {ar ? "الحساب" : "Account"}</Link><p className="eyebrow mt-8 text-[#0e7468]">{ar ? "خدمة ما بعد البيع" : "AFTER-SALES CARE"}</p><h1 className="mt-3 font-serif text-5xl">{ar ? "الاسترجاع والاستبدال" : "Returns & exchanges"}</h1>{query.created && <p className="mt-5 border border-[#18794e]/30 bg-[#18794e]/8 p-4 text-sm text-[#12643f]">{ar ? "تم إرسال طلبك وسنراجعه قريباً." : "Your request was submitted and will be reviewed shortly."}</p>}{query.expired && <p className="mt-5 border border-[#a5472f]/30 bg-[#a5472f]/8 p-4 text-sm text-[#8f3825]">{ar ? "انتهت مهلة الاسترجاع لهذا الطلب." : "The return window for that order has ended."}</p>}<div className="mt-8 divide-y divide-black/10 border-y border-black/10">{rows?.length ? rows.map((row) => <article key={row.id} className="grid gap-3 py-5 sm:grid-cols-[1fr_auto]"><div><strong>{row.return_number}</strong><p className="mt-1 text-xs text-neutral-500">{row.orders?.order_number} · {row.request_type.replaceAll("_", " ")} · {row.reason_code.replaceAll("_", " ")}</p></div><div className="sm:text-end"><span className="inline-block bg-[#e7f2ef] px-3 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-[#073b36]">{row.status.replaceAll("_", " ")}</span><p className="mt-2 text-xs text-neutral-500">{row.return_request_items.reduce((sum, item) => sum + item.quantity, 0)} {ar ? "قطع" : "items"}</p></div></article>) : <p className="py-8 text-sm text-neutral-500">{ar ? "لا توجد طلبات استرجاع بعد." : "No return requests yet."}</p>}</div></main>;
}
