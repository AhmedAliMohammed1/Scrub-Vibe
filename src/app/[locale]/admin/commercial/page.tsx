import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { requireRoles } from "@/server/auth/roles";
import {
  archiveBundleAction,
  removeRecommendationAction,
  saveBundleAction,
  saveRecommendationAction,
  updateReturnAction,
} from "@/features/commercial/admin-actions";

const field =
  "mt-1.5 h-11 w-full border border-black/15 bg-white px-3 text-sm";

export default async function CommercialPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const { supabase } = await requireRoles([
    "support",
    "warehouse",
    "content_editor",
    "product_manager",
    "analyst",
    "admin",
    "super_admin",
  ]);
  const [productsResult, bundlesResult, recommendationsResult] =
    await Promise.all([
      supabase
        .from("products")
        .select("id, slug, status, product_translations(locale, title)")
        .order("id"),
      supabase
        .from("product_bundles")
        .select(
          "id, slug, title_en, title_ar, description_en, description_ar, status, position, product_bundle_items(product_id)",
        )
        .order("position"),
      supabase
        .from("product_recommendations")
        .select("product_id, related_product_id, kind, is_active")
        .eq("is_active", true)
        .order("position"),
    ]);
  const products = productsResult.data ?? [];
  const bundles = bundlesResult.data ?? [];
  const recommendations = recommendationsResult.data ?? [];
  const [subscriptionsResult, alertsResult, returnsResult] = await Promise.all([
    supabase
      .from("stock_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("inventory_alerts")
      .select("id, available_quantity, threshold, last_detected_at, product_variants(sku, products(slug))")
      .eq("status", "open")
      .order("last_detected_at", { ascending: false }),
    supabase
      .from("return_requests")
      .select("id, return_number, request_type, status, resolution, reason_code, customer_note, staff_note, evidence_paths, requested_at, orders(order_number, customer_name, email), return_request_items(quantity, requested_colour, requested_size, condition_note)")
      .order("requested_at", { ascending: false })
      .limit(50),
  ]);
  const alerts = alertsResult.data ?? [];
  const returns = returnsResult.data ?? [];
  const ar = locale === "ar";
  const productName = (id: number) => {
    const product = products.find((row) => row.id === id);
    return (
      product?.product_translations.find(
        (translation) => translation.locale === locale,
      )?.title ??
      product?.slug ??
      `#${id}`
    );
  };

  return (
    <main className="mx-auto max-w-[1500px] px-4 py-10 md:px-8">
      <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#0e7468]">
        {locale === "ar" ? "النمو التجاري" : "COMMERCIAL GROWTH"}
      </p>
      <h1 className="mt-2 font-serif text-4xl">
        {locale === "ar"
          ? "المبيعات وخدمة ما بعد البيع"
          : "Merchandising & after-sales"}
      </h1>
      {(query.success || query.error) && (
        <p
          className={`mt-5 border p-3 text-sm ${
            query.error
              ? "border-red-300 bg-red-50 text-red-800"
              : "border-emerald-300 bg-emerald-50 text-emerald-800"
          }`}
        >
          {query.success ?? query.error}
        </p>
      )}
      <section className="mt-7 grid gap-3 sm:grid-cols-3">
        {[
          ["Active stock alerts", subscriptionsResult.count ?? 0],
          ["Low-stock variants", alerts.length],
          ["Open return cases", returns.filter((item) => !["completed", "rejected", "cancelled"].includes(item.status)).length],
        ].map(([label, value]) => <article key={label} className="border border-black/10 bg-white p-5"><strong className="font-serif text-4xl text-[#073b36]">{value}</strong><p className="mt-2 text-[10px] font-bold uppercase tracking-[.12em] text-neutral-500">{label}</p></article>)}
      </section>
      <section className="mt-8 grid gap-6 xl:grid-cols-2">
        <div className="border border-black/10 bg-white p-5 shadow-sm md:p-7">
          <h2 className="font-serif text-2xl">{ar ? "المجموعات" : "Product bundles"}</h2>
          <p className="mt-2 text-xs text-neutral-500">{ar ? "اجمع منتجات متناسقة في قسم تسوق الإطلالة." : "Group complementary products into a shop-the-set module."}</p>
          <form action={saveBundleAction} className="mt-5 grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="locale" value={locale} /><input type="hidden" name="id" value="" />
            <label className="text-xs font-bold">Slug<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className={field} /></label>
            <label className="text-xs font-bold">{ar ? "الترتيب" : "Position"}<input name="position" type="number" min="0" defaultValue="100" className={field} /></label>
            <label className="text-xs font-bold">English title<input name="titleEn" required className={field} /></label>
            <label className="text-xs font-bold">العنوان العربي<input name="titleAr" required dir="rtl" className={field} /></label>
            <label className="text-xs font-bold sm:col-span-2">English description<textarea name="descriptionEn" maxLength={600} className={`${field} h-20 py-2`} /></label>
            <label className="text-xs font-bold sm:col-span-2">الوصف العربي<textarea name="descriptionAr" maxLength={600} dir="rtl" className={`${field} h-20 py-2`} /></label>
            <label className="text-xs font-bold">{ar ? "الحالة" : "Status"}<select name="status" className={field}><option value="draft">Draft</option><option value="active">Active</option><option value="archived">Archived</option></select></label>
            <fieldset className="sm:col-span-2"><legend className="text-xs font-bold">{ar ? "اختر منتجين على الأقل" : "Choose at least two products"}</legend><div className="mt-2 grid max-h-48 gap-2 overflow-auto border border-black/10 p-3 sm:grid-cols-2">{products.filter((product) => product.status === "active").map((product) => <label key={product.id} className="flex items-center gap-2 text-xs"><input type="checkbox" name="productId" value={product.id} />{productName(product.id)}</label>)}</div></fieldset>
            <button className="min-h-11 bg-[#073b36] px-5 text-xs font-bold uppercase tracking-[.1em] text-white sm:col-span-2">{ar ? "إنشاء مجموعة" : "Create bundle"}</button>
          </form>
        </div>
        <div className="border border-black/10 bg-white p-5 shadow-sm md:p-7">
          <h2 className="font-serif text-2xl">{ar ? "المجموعات الحالية" : "Current bundles"}</h2>
          <div className="mt-4 divide-y divide-black/10 border-y border-black/10">{bundles.length ? bundles.map((bundle) => <article key={bundle.id} className="py-4"><div className="flex justify-between gap-3"><div><strong className="text-sm">{ar ? bundle.title_ar : bundle.title_en}</strong><p className="mt-1 text-xs text-neutral-500">{bundle.status} · {bundle.product_bundle_items.length} products · /{bundle.slug}</p></div><form action={archiveBundleAction}><input type="hidden" name="locale" value={locale} /><input type="hidden" name="id" value={bundle.id} /><button className="text-[10px] font-bold uppercase text-[#a5472f]">{ar ? "أرشفة" : "Archive"}</button></form></div></article>) : <p className="py-6 text-sm text-neutral-500">{ar ? "لا توجد مجموعات." : "No bundles yet."}</p>}</div>
        </div>
      </section>
      <section className="mt-6 border border-black/10 bg-white p-5 shadow-sm md:p-7">
        <h2 className="font-serif text-2xl">{ar ? "اقتراحات المنتجات" : "Complete-the-look recommendations"}</h2>
        <form action={saveRecommendationAction} className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_220px_auto]"><input type="hidden" name="locale" value={locale} /><select name="productId" required className={field}><option value="">{ar ? "المنتج الأساسي" : "Source product"}</option>{products.map((product) => <option key={product.id} value={product.id}>{productName(product.id)}</option>)}</select><select name="relatedProductId" required className={field}><option value="">{ar ? "المنتج المقترح" : "Recommended product"}</option>{products.map((product) => <option key={product.id} value={product.id}>{productName(product.id)}</option>)}</select><select name="kind" className={field}><option value="complete_the_look">Complete the look</option><option value="cross_sell">Cross-sell</option></select><button className="mt-1.5 min-h-11 bg-[#073b36] px-5 text-xs font-bold uppercase text-white">{ar ? "إضافة" : "Add"}</button></form>
        <div className="mt-5 divide-y divide-black/10">{recommendations.map((row) => <div key={`${row.product_id}-${row.related_product_id}-${row.kind}`} className="flex items-center justify-between gap-4 py-3 text-sm"><span>{productName(row.product_id)} <b>→</b> {productName(row.related_product_id)} <small className="text-neutral-500">({row.kind.replaceAll("_", " ")})</small></span><form action={removeRecommendationAction}><input type="hidden" name="locale" value={locale} /><input type="hidden" name="productId" value={row.product_id} /><input type="hidden" name="relatedProductId" value={row.related_product_id} /><input type="hidden" name="kind" value={row.kind} /><button className="text-[10px] font-bold uppercase text-[#a5472f]">{ar ? "حذف" : "Remove"}</button></form></div>)}</div>
      </section>
      <section className="mt-6 grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
        <div className="border border-black/10 bg-white p-5 shadow-sm md:p-7">
          <h2 className="font-serif text-2xl">{ar ? "تنبيهات المخزون" : "Low-stock alerts"}</h2>
          <p className="mt-2 text-xs text-neutral-500">{ar ? "يتم تحديثها يومياً وإرسال ملخص للفريق." : "Refreshed daily with a staff digest."}</p>
          <div className="mt-4 divide-y divide-black/10 border-y border-black/10">{alerts.length ? alerts.map((alert) => <article key={alert.id} className="py-4"><strong className="text-sm">{alert.product_variants?.products?.slug ?? alert.product_variants?.sku}</strong><p className="mt-1 text-xs text-neutral-500">SKU {alert.product_variants?.sku} · {alert.available_quantity} available / threshold {alert.threshold}</p></article>) : <p className="py-7 text-sm text-neutral-500">{ar ? "لا توجد تنبيهات مفتوحة." : "No open alerts."}</p>}</div>
        </div>
        <div className="border border-black/10 bg-white p-5 shadow-sm md:p-7">
          <h2 className="font-serif text-2xl">{ar ? "الاسترجاع والاستبدال" : "Returns & exchanges"}</h2>
          <div className="mt-4 space-y-4">{returns.length ? returns.map((item) => <article key={item.id} className="border border-black/10 p-4"><div className="flex flex-wrap justify-between gap-3"><div><strong>{item.return_number}</strong><p className="mt-1 text-xs text-neutral-500">{item.orders?.order_number} · {item.orders?.customer_name} · {item.request_type} · {item.reason_code.replaceAll("_", " ")}</p></div><span className="bg-[#e7f2ef] px-3 py-1 text-[10px] font-bold uppercase text-[#073b36]">{item.status}</span></div>{item.customer_note && <p className="mt-3 bg-neutral-50 p-3 text-xs">{item.customer_note}</p>}{item.evidence_paths.length > 0 && <div className="mt-3 flex flex-wrap gap-3">{item.evidence_paths.map((path, index) => <a key={path} href={`/api/admin/returns/evidence?path=${encodeURIComponent(path)}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#0e7468] underline">{ar ? `صورة ${index + 1}` : `Evidence ${index + 1}`}</a>)}</div>}<form action={updateReturnAction} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_2fr_auto]"><input type="hidden" name="locale" value={locale} /><input type="hidden" name="id" value={item.id} /><select name="status" defaultValue={item.status} className={field}>{["requested", "reviewing", "approved", "rejected", "received", "completed", "cancelled"].map((status) => <option key={status}>{status}</option>)}</select><select name="resolution" defaultValue={item.resolution ?? ""} className={field}><option value="">No resolution</option><option value="refund">Refund</option><option value="exchange">Exchange</option><option value="store_credit">Store credit</option></select><input name="note" maxLength={1000} defaultValue={item.staff_note ?? ""} placeholder={ar ? "ملاحظة للعميل" : "Customer-facing note"} className={field} /><button className="mt-1.5 min-h-11 bg-[#073b36] px-4 text-xs font-bold uppercase text-white">{ar ? "تحديث" : "Update"}</button></form></article>) : <p className="py-7 text-sm text-neutral-500">{ar ? "لا توجد طلبات استرجاع." : "No return cases."}</p>}</div>
        </div>
      </section>
      <section className="mt-6 border border-black/10 bg-[#073b36] p-5 text-white md:p-7"><h2 className="font-serif text-2xl">{ar ? "التقارير والتكاملات" : "Reports & integrations"}</h2><div className="mt-5 flex flex-wrap gap-2">{["orders", "customers", "products", "inventory", "returns", "campaigns"].map((report) => <a key={report} href={`/api/admin/exports/${report}`} className="border border-white/25 px-4 py-2 text-[10px] font-bold uppercase tracking-[.1em] hover:bg-white hover:text-[#073b36]">{ar ? "تصدير" : "Export"} {report} CSV</a>)}</div><div className="mt-6 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">{[["GA4", Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID)], ["Meta Pixel", Boolean(process.env.NEXT_PUBLIC_META_PIXEL_ID)], ["Meta CAPI", Boolean(process.env.META_CONVERSIONS_API_TOKEN)], ["Google Merchant", true]].map(([name, ready]) => <p key={String(name)} className="border border-white/15 p-3"><strong>{name}</strong><span className={`float-end ${ready ? "text-[#81c5b8]" : "text-amber-300"}`}>{ready ? "Ready" : "Needs env key"}</span></p>)}</div><a href="/api/google/merchant-feed" target="_blank" className="mt-5 inline-block text-xs font-bold underline underline-offset-4">Google Merchant XML feed ↗</a></section>
    </main>
  );
}
