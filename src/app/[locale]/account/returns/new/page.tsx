import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ReturnRequestForm } from "@/features/commercial/return-request-form";
import { isLocale } from "@/lib/i18n";
import { requireUser } from "@/server/auth/roles";

export default async function NewReturnPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ order?: string }> }) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  if (!query.order) redirect(`/${locale}/account`);
  const { supabase, userId } = await requireUser();
  const { data: order } = await supabase.from("orders").select("id, order_number, status, delivered_at, order_items(id, title_en, title_ar, colour_en, colour_ar, size, quantity)").eq("id", query.order).eq("user_id", userId).maybeSingle();
  if (!order || order.status !== "delivered") notFound();
  const ar = locale === "ar";
  const withinWindow = order.delivered_at && Date.now() <= new Date(order.delivered_at).getTime() + 14 * 86400000;
  if (!withinWindow) redirect(`/${locale}/account/returns?expired=1`);
  return <main className="mx-auto min-h-[70vh] max-w-3xl px-5 py-14 md:px-10 md:py-20"><Link href={`/${locale}/account`} className="text-xs underline underline-offset-4">← {ar ? "الحساب" : "Account"}</Link><p className="eyebrow mt-8 text-[#0e7468]">{ar ? "الاسترجاع والاستبدال" : "RETURNS & EXCHANGES"}</p><h1 className="mt-3 font-serif text-4xl sm:text-5xl">{ar ? `طلب جديد للطلب ${order.order_number}` : `New request for ${order.order_number}`}</h1><p className="mt-4 text-sm text-neutral-600">{ar ? "يمكنك طلب الاستبدال أو الاسترجاع خلال ١٤ يوماً من التسليم. يجب أن تكون المنتجات غير مستخدمة وبحالته الأصلية." : "You can request a return or exchange within 14 days of delivery. Items must be unused and in original condition."}</p><ReturnRequestForm orderId={order.id} items={order.order_items} locale={locale} /></main>;
}

