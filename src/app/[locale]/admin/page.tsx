import type { Metadata } from "next";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Eye,
  Heart,
  Lightbulb,
  Mail,
  MousePointerClick,
  Package,
  ShoppingBag,
  Sparkles,
  TriangleAlert,
  Users,
} from "lucide-react";
import { notFound } from "next/navigation";
import { ProductForm } from "@/features/admin/product-form";
import {
  adjustInventoryAction,
  setProductStatusAction,
} from "@/features/admin/actions";
import { formatMoney } from "@/lib/money";
import { isLocale, type Locale } from "@/lib/i18n";
import { requireRoles } from "@/server/auth/roles";

export const metadata: Metadata = {
  title: "Admin dashboard | Scrub Vibe",
  robots: { index: false, follow: false },
};

type AnalyticsSummary = {
  rangeDays: number;
  metrics: {
    pageViews: number;
    visitors: number;
    sessions: number;
    productViews: number;
    addToCarts: number;
    checkouts: number;
    wishlistAdds: number;
    newsletterSignups: number;
    instagramClicks: number;
    cartRate: number;
    checkoutRate: number;
  };
  previous: { pageViews: number; visitors: number; sessions: number };
  daily: { date: string; pageViews: number; visitors: number }[];
  topProducts: {
    id: number;
    title: string;
    product_views: number;
    add_to_carts: number;
    wishlist_adds: number;
  }[];
  topPages: { path: string; views: number; visitors: number }[];
  channels: { channel: string; visitors: number }[];
  devices: { device: string; visitors: number }[];
  locales: { locale: string; visitors: number }[];
};

type AdminProduct = {
  id: number;
  slug: string;
  status: "draft" | "active" | "scheduled" | "archived";
  gender: string | null;
  base_price_minor: number;
  compare_at_price_minor: number | null;
  cost_minor: number | null;
  updated_at: string;
  product_translations: { locale: string; title: string }[];
  product_images: { storage_path: string; alt_en: string; position: number }[];
  product_variants: {
    id: number;
    sku: string;
    is_active: boolean;
    inventory: {
      on_hand: number;
      reserved: number;
      low_stock_threshold: number;
    } | null;
  }[];
};

const emptyAnalytics: AnalyticsSummary = {
  rangeDays: 30,
  metrics: {
    pageViews: 0,
    visitors: 0,
    sessions: 0,
    productViews: 0,
    addToCarts: 0,
    checkouts: 0,
    wishlistAdds: 0,
    newsletterSignups: 0,
    instagramClicks: 0,
    cartRate: 0,
    checkoutRate: 0,
  },
  previous: { pageViews: 0, visitors: 0, sessions: 0 },
  daily: [],
  topProducts: [],
  topPages: [],
  channels: [],
  devices: [],
  locales: [],
};

const productSelect = `
  id,
  slug,
  status,
  gender,
  base_price_minor,
  compare_at_price_minor,
  cost_minor,
  updated_at,
  product_translations(locale, title),
  product_images(storage_path, alt_en, position),
  product_variants(
    id,
    sku,
    is_active,
    inventory(on_hand, reserved, low_stock_threshold)
  )
`;

export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const period =
    query.period === "7" || query.period === "90" ? Number(query.period) : 30;
  const { supabase } = await requireRoles(["admin", "super_admin"]);

  const [
    productsResult,
    categoriesResult,
    analyticsResult,
    customerResult,
    subscriberResult,
  ] = await Promise.all([
    supabase
      .from("products")
      .select(productSelect)
      .order("updated_at", { ascending: false }),
    supabase
      .from("categories")
      .select("id, slug, category_translations(locale, name)")
      .order("position"),
    supabase.rpc("admin_analytics_summary", { p_days: period }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("newsletter_subscribers")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
  ]);

  if (productsResult.error || categoriesResult.error) {
    throw new Error("The admin catalogue could not be loaded.");
  }

  const products = productsResult.data as unknown as AdminProduct[];
  const analytics = analyticsResult.error
    ? { ...emptyAnalytics, rangeDays: period }
    : (analyticsResult.data as unknown as AnalyticsSummary);
  const categories = categoriesResult.data.map((category) => ({
    id: category.id,
    slug: category.slug,
    name:
      category.category_translations.find((item) => item.locale === locale)
        ?.name ??
      category.category_translations.find((item) => item.locale === "en")
        ?.name ??
      category.slug,
  }));

  const catalogue = catalogueMetrics(products);
  const insights = marketingInsights(
    locale,
    analytics,
    catalogue.lowStockVariants,
  );
  const ar = locale === "ar";

  return (
    <main className="min-h-screen bg-[#eef2ef]">
      <section className="border-b border-white/10 bg-[#062f2b] text-white">
        <div className="mx-auto max-w-[1600px] px-5 py-10 md:px-10 md:py-14">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow text-[#81c5b8]">
                SCRUB VIBE · CONTROL ROOM
              </p>
              <h1 className="mt-3 font-serif text-5xl md:text-7xl">
                {ar ? "لوحة الإدارة" : "Admin intelligence"}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60">
                {ar
                  ? "إدارة المنتجات والمخزون وقراءة إشارات التسويق الحقيقية من مكان واحد."
                  : "Manage the catalogue and inventory while turning real shopper behaviour into marketing decisions."}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/${locale}/shop`}
                className="border border-white/25 px-4 py-3 text-[10px] font-bold uppercase tracking-[.14em]"
              >
                {ar ? "عرض المتجر" : "View store"}
              </Link>
              <a
                href="#new-product"
                className="bg-white px-4 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-[#062f2b]"
              >
                {ar ? "منتج جديد" : "New product"}
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-[1600px] gap-8 px-5 py-8 md:px-10 md:py-12">
        <section aria-labelledby="overview-heading">
          <SectionHeading
            eyebrow={ar ? "نظرة عامة" : "PERFORMANCE OVERVIEW"}
            title={
              ar ? "ما الذي يحدث في المتجر؟" : "What’s happening in the store?"
            }
            action={
              <div className="flex border border-black/10 bg-white p-1">
                {[7, 30, 90].map((days) => (
                  <Link
                    key={days}
                    href={`/${locale}/admin?period=${days}` as Route}
                    className={`px-3 py-2 text-[10px] font-bold ${period === days ? "bg-[#073b36] text-white" : "text-neutral-500"}`}
                  >
                    {days}D
                  </Link>
                ))}
              </div>
            }
          />

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={Users}
              label={ar ? "الزوار" : "Visitors"}
              value={analytics.metrics.visitors}
              change={trend(
                analytics.metrics.visitors,
                analytics.previous.visitors,
              )}
            />
            <MetricCard
              icon={Eye}
              label={ar ? "مشاهدات الصفحات" : "Page views"}
              value={analytics.metrics.pageViews}
              change={trend(
                analytics.metrics.pageViews,
                analytics.previous.pageViews,
              )}
            />
            <MetricCard
              icon={ShoppingBag}
              label={ar ? "الإضافة للسلة" : "Add to carts"}
              value={analytics.metrics.addToCarts}
              detail={`${analytics.metrics.cartRate}% ${ar ? "من مشاهدات المنتجات" : "of product views"}`}
            />
            <MetricCard
              icon={MousePointerClick}
              label={ar ? "نية الشراء" : "Checkout intent"}
              value={analytics.metrics.checkouts}
              detail={`${analytics.metrics.checkoutRate}% ${ar ? "من الجلسات" : "of sessions"}`}
            />
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_.5fr]">
            <div className="border border-black/10 bg-white p-5 md:p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif text-2xl">
                    {ar ? "اتجاه الزيارات" : "Traffic trend"}
                  </h3>
                  <p className="mt-1 text-xs text-neutral-500">
                    {ar
                      ? "المشاهدات اليومية خلال الفترة"
                      : `Daily page views · last ${period} days`}
                  </p>
                </div>
                <BarChart3 className="text-[#0e7468]" strokeWidth={1.4} />
              </div>
              <TrafficChart data={analytics.daily} locale={locale} />
            </div>
            <div className="border border-black/10 bg-[#dce9e5] p-5 md:p-7">
              <h3 className="font-serif text-2xl">
                {ar ? "إشارات الاهتمام" : "Intent signals"}
              </h3>
              <dl className="mt-5 divide-y divide-black/10">
                <Signal
                  label={ar ? "مشاهدات المنتجات" : "Product views"}
                  value={analytics.metrics.productViews}
                  icon={Eye}
                />
                <Signal
                  label={ar ? "إضافات المفضلة" : "Wishlist adds"}
                  value={analytics.metrics.wishlistAdds}
                  icon={Heart}
                />
                <Signal
                  label={ar ? "اشتراكات البريد" : "Email signups"}
                  value={analytics.metrics.newsletterSignups}
                  icon={Mail}
                />
                <Signal
                  label={ar ? "زيارات إنستجرام" : "Instagram clicks"}
                  value={analytics.metrics.instagramClicks}
                  icon={ArrowUpRight}
                />
              </dl>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
          <div className="border border-black/10 bg-[#fffaf0] p-5 md:p-7">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-[#f0cf8e]">
                <Lightbulb size={18} />
              </span>
              <div>
                <p className="eyebrow text-[#8d5f12]">
                  {ar ? "مستشار التسويق" : "MARKETING ADVISOR"}
                </p>
                <h2 className="mt-1 font-serif text-3xl">
                  {ar ? "الخطوات ذات الأولوية" : "Priority moves"}
                </h2>
              </div>
            </div>
            <div className="mt-6 grid gap-3">
              {insights.map((insight, index) => (
                <article
                  key={insight}
                  className="flex gap-4 border-t border-black/10 pt-4"
                >
                  <span className="font-serif text-2xl text-[#b47a1d]">
                    0{index + 1}
                  </span>
                  <p className="text-sm leading-6 text-neutral-700">
                    {insight}
                  </p>
                </article>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <Breakdown
              title={ar ? "مصادر الزيارة" : "Traffic sources"}
              items={analytics.channels.map((item) => ({
                label: item.channel,
                value: item.visitors,
              }))}
              empty={
                ar
                  ? "ستظهر المصادر بعد بدء الزيارات."
                  : "Sources appear as traffic arrives."
              }
            />
            <Breakdown
              title={ar ? "الأجهزة" : "Devices"}
              items={analytics.devices.map((item) => ({
                label: item.device,
                value: item.visitors,
              }))}
              empty={ar ? "لا توجد بيانات بعد." : "No device data yet."}
            />
            <Breakdown
              title={ar ? "اللغة" : "Language"}
              items={analytics.locales.map((item) => ({
                label: item.locale.toUpperCase(),
                value: item.visitors,
              }))}
              empty={ar ? "لا توجد بيانات بعد." : "No language data yet."}
            />
          </div>
        </section>

        <section>
          <SectionHeading
            eyebrow={ar ? "صحة الكتالوج" : "CATALOGUE HEALTH"}
            title={ar ? "المنتجات والمخزون" : "Products and inventory"}
          />
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <MiniMetric
              label={ar ? "كل المنتجات" : "Products"}
              value={products.length}
            />
            <MiniMetric
              label={ar ? "منشور" : "Published"}
              value={catalogue.active}
              tone="green"
            />
            <MiniMetric
              label={ar ? "مسودة" : "Drafts"}
              value={catalogue.drafts}
            />
            <MiniMetric
              label={ar ? "مخزون منخفض" : "Low-stock SKUs"}
              value={catalogue.lowStockVariants}
              tone={catalogue.lowStockVariants ? "amber" : "green"}
            />
            <MiniMetric
              label={ar ? "قيمة البيع للمخزون" : "Retail stock value"}
              value={formatMoney(catalogue.retailValue, locale)}
            />
          </div>

          <div className="mt-4 overflow-hidden border border-black/10 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-start text-sm">
                <thead className="bg-[#073b36] text-[10px] uppercase tracking-[.13em] text-white/70">
                  <tr>
                    <th className="px-4 py-4 text-start">
                      {ar ? "المنتج" : "Product"}
                    </th>
                    <th className="px-4 py-4 text-start">
                      {ar ? "الحالة" : "Status"}
                    </th>
                    <th className="px-4 py-4 text-start">
                      {ar ? "السعر" : "Price"}
                    </th>
                    <th className="px-4 py-4 text-start">
                      {ar ? "المخزون" : "Stock"}
                    </th>
                    <th className="px-4 py-4 text-start">
                      {ar ? "التنبيهات" : "Alerts"}
                    </th>
                    <th className="px-4 py-4 text-start">
                      {ar ? "إجراءات" : "Actions"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10">
                  {products.map((product) => (
                    <ProductRow
                      key={product.id}
                      product={product}
                      locale={locale}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            {!products.length && (
              <p className="p-10 text-center text-sm text-neutral-500">
                {ar ? "لا توجد منتجات بعد." : "No products yet."}
              </p>
            )}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <RankedList
            title={ar ? "أكثر المنتجات اهتماماً" : "Most engaging products"}
            items={analytics.topProducts.map((item) => ({
              label: item.title,
              value: item.product_views,
              detail: `${item.add_to_carts} ${ar ? "إضافة للسلة" : "cart adds"}`,
            }))}
            empty={
              ar
                ? "ستظهر المنتجات بعد جمع مشاهدات."
                : "Products will rank after views are collected."
            }
          />
          <RankedList
            title={ar ? "أكثر الصفحات زيارة" : "Top landing pages"}
            items={analytics.topPages.map((item) => ({
              label: item.path,
              value: item.views,
              detail: `${item.visitors} ${ar ? "زائر" : "visitors"}`,
            }))}
            empty={
              ar
                ? "ستظهر الصفحات بعد بدء الزيارات."
                : "Pages will rank as visits arrive."
            }
          />
        </section>

        <section id="new-product" className="scroll-mt-6">
          <ProductForm locale={locale} categories={categories} />
        </section>

        <section className="border border-[#0e7468]/20 bg-[#dce9e5] p-5 text-xs leading-6 text-neutral-700 md:p-7">
          <div className="flex gap-3">
            <Sparkles className="mt-1 shrink-0 text-[#0e7468]" size={18} />
            <p>
              {ar
                ? `يوجد ${customerResult.count ?? 0} حساب عميل و${subscriberResult.count ?? 0} مشترك نشط في القائمة البريدية. التحليلات لا تجمع عناوين IP أو بيانات شخصية حساسة، وتبدأ من تاريخ إطلاق هذا النظام.`
                : `There are ${customerResult.count ?? 0} customer accounts and ${subscriberResult.count ?? 0} active email subscribers. Analytics avoids IP addresses and sensitive personal data, and begins accumulating from this system’s launch date.`}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function ProductRow({
  product,
  locale,
}: {
  product: AdminProduct;
  locale: Locale;
}) {
  const ar = locale === "ar";
  const title =
    product.product_translations.find((item) => item.locale === locale)
      ?.title ??
    product.product_translations.find((item) => item.locale === "en")?.title ??
    product.slug;
  const image = product.product_images.toSorted(
    (a, b) => a.position - b.position,
  )[0];
  const stock = product.product_variants.reduce(
    (sum, variant) =>
      sum +
      Math.max(
        0,
        (variant.inventory?.on_hand ?? 0) - (variant.inventory?.reserved ?? 0),
      ),
    0,
  );
  const low = product.product_variants.filter((variant) => {
    const inventory = variant.inventory;
    return (
      inventory &&
      inventory.on_hand - inventory.reserved <= inventory.low_stock_threshold
    );
  });

  return (
    <tr className="align-top hover:bg-[#f7faf8]">
      <td className="px-4 py-4">
        <div className="flex min-w-[250px] gap-3">
          <div className="relative size-14 shrink-0 overflow-hidden bg-neutral-100">
            {image ? (
              <Image
                src={image.storage_path}
                alt={image.alt_en}
                fill
                sizes="56px"
                className="object-cover"
              />
            ) : (
              <Package className="absolute inset-0 m-auto text-neutral-300" />
            )}
          </div>
          <div>
            <strong className="block max-w-[260px]">{title}</strong>
            <span className="mt-1 block text-[11px] text-neutral-500">
              {product.slug} · {product.product_variants.length} SKUs
            </span>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <StatusBadge status={product.status} />
      </td>
      <td className="px-4 py-4 whitespace-nowrap">
        <strong>{formatMoney(product.base_price_minor, locale)}</strong>
        {product.cost_minor !== null && (
          <span className="mt-1 block text-[11px] text-neutral-500">
            {ar ? "التكلفة" : "Cost"}: {formatMoney(product.cost_minor, locale)}
          </span>
        )}
      </td>
      <td className="px-4 py-4">
        <strong>{stock}</strong>
        <span className="mt-1 block text-[11px] text-neutral-500">
          {product.product_variants.length} {ar ? "متغير" : "variants"}
        </span>
      </td>
      <td className="px-4 py-4">
        {low.length ? (
          <span className="inline-flex items-center gap-1 bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-900">
            <TriangleAlert size={12} /> {low.length} {ar ? "منخفض" : "low"}
          </span>
        ) : (
          <span className="text-xs text-emerald-700">
            {ar ? "جيد" : "Healthy"}
          </span>
        )}
      </td>
      <td className="px-4 py-4">
        <div className="flex flex-wrap gap-2">
          {product.status !== "active" && (
            <StatusButton
              productId={product.id}
              status="active"
              locale={locale}
              label={ar ? "نشر" : "Publish"}
            />
          )}
          {product.status === "active" && (
            <StatusButton
              productId={product.id}
              status="draft"
              locale={locale}
              label={ar ? "إخفاء" : "Unpublish"}
            />
          )}
          {product.status !== "archived" && (
            <StatusButton
              productId={product.id}
              status="archived"
              locale={locale}
              label={ar ? "أرشفة" : "Archive"}
              subtle
            />
          )}
          {product.status === "active" && (
            <Link
              href={`/${locale}/products/${product.slug}`}
              className="border border-black/15 px-3 py-2 text-[10px] font-bold uppercase"
            >
              {ar ? "عرض" : "View"}
            </Link>
          )}
        </div>
        <details className="mt-3">
          <summary className="cursor-pointer text-[11px] font-semibold text-[#0e7468]">
            {ar ? "تعديل المخزون" : "Adjust inventory"}
          </summary>
          <div className="mt-3 grid gap-2 border-s-2 border-[#0e7468]/20 ps-3">
            {product.product_variants.map((variant) => (
              <form
                key={variant.id}
                action={adjustInventoryAction}
                className="grid grid-cols-[1fr_70px_auto] items-end gap-2"
              >
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="variantId" value={variant.id} />
                <label className="text-[9px] uppercase tracking-wider text-neutral-500">
                  {variant.sku}
                  <input
                    name="reason"
                    required
                    minLength={3}
                    className="mt-1 h-8 w-full border border-black/15 px-2 text-[10px]"
                    placeholder={ar ? "سبب التعديل" : "Reason"}
                  />
                </label>
                <label className="text-[9px] uppercase tracking-wider text-neutral-500">
                  {ar ? "الكمية" : "Qty"}
                  <input
                    name="onHand"
                    type="number"
                    min="0"
                    required
                    defaultValue={variant.inventory?.on_hand ?? 0}
                    className="mt-1 h-8 w-full border border-black/15 px-2 text-xs"
                  />
                </label>
                <button className="h-8 bg-[#073b36] px-3 text-[9px] font-bold uppercase text-white">
                  {ar ? "حفظ" : "Save"}
                </button>
              </form>
            ))}
          </div>
        </details>
      </td>
    </tr>
  );
}

function StatusButton({
  productId,
  status,
  locale,
  label,
  subtle = false,
}: {
  productId: number;
  status: "draft" | "active" | "archived";
  locale: Locale;
  label: string;
  subtle?: boolean;
}) {
  return (
    <form action={setProductStatusAction}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="status" value={status} />
      <button
        className={
          subtle
            ? "px-3 py-2 text-[10px] font-bold uppercase text-neutral-500"
            : "bg-[#0e7468] px-3 py-2 text-[10px] font-bold uppercase text-white"
        }
      >
        {label}
      </button>
    </form>
  );
}

function StatusBadge({ status }: { status: AdminProduct["status"] }) {
  const styles = {
    active: "bg-emerald-100 text-emerald-800",
    draft: "bg-neutral-100 text-neutral-700",
    scheduled: "bg-blue-100 text-blue-800",
    archived: "bg-stone-200 text-stone-600",
  };
  return (
    <span
      className={`inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function catalogueMetrics(products: AdminProduct[]) {
  let retailValue = 0;
  let lowStockVariants = 0;
  for (const product of products) {
    for (const variant of product.product_variants) {
      const inventory = variant.inventory;
      if (!inventory) continue;
      const available = Math.max(0, inventory.on_hand - inventory.reserved);
      retailValue += available * product.base_price_minor;
      if (available <= inventory.low_stock_threshold) lowStockVariants += 1;
    }
  }
  return {
    active: products.filter((product) => product.status === "active").length,
    drafts: products.filter((product) => product.status === "draft").length,
    lowStockVariants,
    retailValue,
  };
}

function marketingInsights(
  locale: Locale,
  data: AnalyticsSummary,
  lowStock: number,
) {
  const ar = locale === "ar";
  const results: string[] = [];
  if (data.metrics.visitors < 10)
    results.push(
      ar
        ? "ابدأ حملات إنستجرام بروابط UTM واضحة؛ لوحة التحكم ستفصل كل مصدر تلقائياً."
        : "Launch Instagram campaigns with clear UTM links; this dashboard will automatically separate each traffic source.",
    );
  else if (trend(data.metrics.visitors, data.previous.visitors) < 0)
    results.push(
      ar
        ? "الزوار أقل من الفترة السابقة. أعد تنشيط أفضل منشورات إنستجرام واختبر عرضاً محدوداً."
        : "Visitors are down versus the prior period. Reuse your strongest Instagram creative and test a time-limited offer.",
    );
  else
    results.push(
      ar
        ? "الزيارات تنمو. زد الميزانية تدريجياً على المصدر الأعلى أداءً بدلاً من توزيعها بالتساوي."
        : "Traffic is growing. Scale the leading source gradually instead of spreading budget evenly.",
    );

  if (data.metrics.productViews > 5 && data.metrics.cartRate < 8)
    results.push(
      ar
        ? "نسبة الإضافة للسلة منخفضة؛ اختبر صوراً أوضح، فيديو قصير، ومزايا الخامة والمقاس أعلى صفحة المنتج."
        : "Add-to-cart rate is soft; test clearer imagery, a short video, and stronger fabric/fit benefits above the fold.",
    );
  else
    results.push(
      ar
        ? "راقب نسبة الإضافة للسلة لكل منتج، وروّج للمنتجات التي تجمع بين المشاهدة العالية والنية الشرائية."
        : "Watch add-to-cart rate per product and promote designs that combine strong views with purchase intent.",
    );

  if (
    data.metrics.addToCarts > 3 &&
    data.metrics.checkouts / data.metrics.addToCarts < 0.35
  )
    results.push(
      ar
        ? "هناك تسرب بين السلة وواتساب؛ وضّح تكلفة الشحن ومدة التوصيل وأضف حافزاً لإتمام الطلب."
        : "Intent drops between cart and WhatsApp; make shipping cost/timing explicit and test a checkout incentive.",
    );
  else if (lowStock > 0)
    results.push(
      ar
        ? `أعد تزويد ${lowStock} من المقاسات منخفضة المخزون قبل توجيه إعلانات مدفوعة إليها.`
        : `Restock ${lowStock} low-stock SKUs before sending paid traffic to those products.`,
    );
  else
    results.push(
      ar
        ? "المخزون بحالة جيدة. استخدم المنتجات الأعلى مشاهدة لإنشاء مجموعات إعلانية منفصلة للرجال والنساء."
        : "Inventory is healthy. Turn the most-viewed designs into separate men’s and women’s ad sets.",
    );
  return results.slice(0, 3);
}

function trend(current: number, previous: number) {
  if (!previous) return current ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="eyebrow text-[#0e7468]">{eyebrow}</p>
        <h2 className="mt-2 font-serif text-4xl md:text-5xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  change,
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
  detail?: string;
  change?: number;
}) {
  return (
    <article className="border border-black/10 bg-white p-5">
      <div className="flex items-start justify-between">
        <Icon size={19} className="text-[#0e7468]" strokeWidth={1.5} />
        {change !== undefined && (
          <span
            className={`flex items-center text-[10px] font-bold ${change >= 0 ? "text-emerald-700" : "text-red-700"}`}
          >
            {change >= 0 ? (
              <ArrowUpRight size={12} />
            ) : (
              <ArrowDownRight size={12} />
            )}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <p className="mt-6 text-[10px] font-bold uppercase tracking-[.13em] text-neutral-500">
        {label}
      </p>
      <strong className="mt-2 block font-serif text-4xl font-normal">
        {typeof value === "number" ? value.toLocaleString() : value}
      </strong>
      {detail && <p className="mt-2 text-[11px] text-neutral-500">{detail}</p>}
    </article>
  );
}

function MiniMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: "green" | "amber";
}) {
  return (
    <article
      className={`border p-4 ${tone === "amber" ? "border-amber-300 bg-amber-50" : tone === "green" ? "border-emerald-200 bg-emerald-50" : "border-black/10 bg-white"}`}
    >
      <p className="text-[9px] font-bold uppercase tracking-[.12em] text-neutral-500">
        {label}
      </p>
      <strong className="mt-2 block font-serif text-2xl font-normal">
        {typeof value === "number" ? value.toLocaleString() : value}
      </strong>
    </article>
  );
}

function Signal({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Eye;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <dt className="flex items-center gap-2 text-xs">
        <Icon size={14} />
        {label}
      </dt>
      <dd className="font-serif text-xl">{value.toLocaleString()}</dd>
    </div>
  );
}

function TrafficChart({
  data,
  locale,
}: {
  data: AnalyticsSummary["daily"];
  locale: Locale;
}) {
  const max = Math.max(1, ...data.map((item) => item.pageViews));
  if (!data.some((item) => item.pageViews))
    return (
      <div className="mt-8 grid h-44 place-items-center border border-dashed border-black/15 text-center text-xs text-neutral-500">
        {locale === "ar"
          ? "يبدأ الرسم مع وصول أولى الزيارات."
          : "The chart begins with the first tracked visits."}
      </div>
    );
  return (
    <div
      className="mt-8 flex h-44 items-end gap-1"
      role="img"
      aria-label="Daily traffic bar chart"
    >
      {data.map((item) => (
        <div
          key={item.date}
          className="group relative flex h-full min-w-0 flex-1 items-end"
        >
          <div
            className="w-full bg-[#0e7468] transition hover:bg-[#073b36]"
            style={{ height: `${Math.max(3, (item.pageViews / max) * 100)}%` }}
          />
          <span className="pointer-events-none absolute bottom-full start-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap bg-neutral-950 px-2 py-1 text-[9px] text-white group-hover:block">
            {new Intl.DateTimeFormat(locale, {
              month: "short",
              day: "numeric",
            }).format(new Date(item.date))}
            : {item.pageViews}
          </span>
        </div>
      ))}
    </div>
  );
}

function Breakdown({
  title,
  items,
  empty,
}: {
  title: string;
  items: { label: string; value: number }[];
  empty: string;
}) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <article className="border border-black/10 bg-white p-5">
      <h3 className="font-serif text-xl">{title}</h3>
      {items.length ? (
        <div className="mt-4 grid gap-3">
          {items.slice(0, 5).map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-[10px]">
                <span className="max-w-[75%] truncate">{item.label}</span>
                <strong>{item.value}</strong>
              </div>
              <div className="mt-1 h-1 bg-black/5">
                <div
                  className="h-full bg-[#0e7468]"
                  style={{ width: `${(item.value / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-xs text-neutral-500">{empty}</p>
      )}
    </article>
  );
}

function RankedList({
  title,
  items,
  empty,
}: {
  title: string;
  items: { label: string; value: number; detail: string }[];
  empty: string;
}) {
  return (
    <article className="border border-black/10 bg-white p-5 md:p-7">
      <h3 className="font-serif text-2xl">{title}</h3>
      {items.length ? (
        <ol className="mt-5 divide-y divide-black/10">
          {items.slice(0, 6).map((item, index) => (
            <li key={item.label} className="flex items-center gap-4 py-3">
              <span className="grid size-7 place-items-center rounded-full bg-[#dce9e5] text-[10px] font-bold">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <strong className="block truncate text-xs">{item.label}</strong>
                <span className="text-[10px] text-neutral-500">
                  {item.detail}
                </span>
              </div>
              <strong className="font-serif text-xl">{item.value}</strong>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-5 text-xs text-neutral-500">{empty}</p>
      )}
    </article>
  );
}
