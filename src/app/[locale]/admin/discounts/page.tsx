import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BarChart3,
  BadgePercent,
  CircleDollarSign,
  TicketCheck,
} from "lucide-react";
import {
  CampaignForm,
  DiscountCodeForm,
  type AdminCampaign,
  type AdminDiscountCode,
} from "@/features/promotions/admin-forms";
import { isLocale } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import { requireRoles } from "@/server/auth/roles";

export const metadata: Metadata = {
  title: "Discounts & campaigns | Scrub Vibe Admin",
  robots: { index: false, follow: false },
};

type Redemption = {
  id: number;
  discount_minor: number;
  subtotal_minor: number;
  redeemed_at: string;
  orders: { total_minor: number } | null;
};

type CodeWithStats = AdminDiscountCode & {
  discount_campaigns: { name_en: string; name_ar: string } | null;
  discount_redemptions: Redemption[];
};

export default async function AdminDiscountsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { supabase } = await requireRoles(["admin", "super_admin"]);
  const [campaignsResult, codesResult] = await Promise.all([
    supabase
      .from("discount_campaigns")
      .select("*")
      .order("starts_on", { ascending: false }),
    supabase
      .from("discount_codes")
      .select(
        `
      *, discount_campaigns(name_en, name_ar),
      discount_redemptions(id, discount_minor, subtotal_minor, redeemed_at, orders(total_minor))
    `,
      )
      .order("created_at", { ascending: false }),
  ]);
  if (campaignsResult.error || codesResult.error)
    throw new Error("Discount campaigns could not be loaded.");

  const campaigns = campaignsResult.data as AdminCampaign[];
  const codes = codesResult.data as unknown as CodeWithStats[];
  const redemptions = codes.flatMap((code) => code.discount_redemptions);
  const discountSpend = redemptions.reduce(
    (sum, item) => sum + item.discount_minor,
    0,
  );
  const attributedRevenue = redemptions.reduce(
    (sum, item) => sum + (item.orders?.total_minor ?? 0),
    0,
  );
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
  }).format(new Date());
  const activeCampaigns = campaigns.filter(
    (item) =>
      item.is_active && item.starts_on <= today && item.ends_on >= today,
  ).length;
  const activeCodes = codes.filter(
    (item) =>
      item.is_active &&
      (!item.starts_on || item.starts_on <= today) &&
      (!item.ends_on || item.ends_on >= today),
  ).length;
  const ar = locale === "ar";

  return (
    <main className="min-h-screen bg-[#eef2ef]">
      <header className="bg-[#062f2b] text-white">
        <div className="mx-auto max-w-7xl px-5 py-10 md:px-10 md:py-14">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="eyebrow text-[#81c5b8]">
                SCRUB VIBE · GROWTH CONTROL
              </p>
              <h1 className="mt-3 font-serif text-5xl md:text-7xl">
                {ar ? "الخصومات والحملات" : "Discounts & campaigns"}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/65">
                {ar
                  ? "أنشئ حملات قابلة للقياس وأكواد خصم آمنة بحدود وجدولة وميزانيات واضحة."
                  : "Create measurable campaigns and secure discount codes with schedules, limits and controlled budgets."}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/${locale}/admin` as Route}
                className="border border-white/25 px-4 py-3 text-[10px] font-bold uppercase tracking-[.14em]"
              >
                {ar ? "لوحة الإدارة" : "Dashboard"}
              </Link>
              <Link
                href={`/${locale}/admin/banners` as Route}
                className="border border-white/25 px-4 py-3 text-[10px] font-bold uppercase tracking-[.14em]"
              >
                {ar ? "البانرات" : "Banners"}
              </Link>
              <Link
                href={`/${locale}/checkout` as Route}
                className="bg-white px-4 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-[#062f2b]"
              >
                {ar ? "اختبار الكود" : "Test at checkout"}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 md:px-10 md:py-12">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Metric
            icon={BarChart3}
            label={ar ? "الحملات النشطة" : "Active campaigns"}
            value={String(activeCampaigns)}
          />
          <Metric
            icon={BadgePercent}
            label={ar ? "الأكواد المتاحة" : "Available codes"}
            value={String(activeCodes)}
          />
          <Metric
            icon={TicketCheck}
            label={ar ? "مرات الاستخدام" : "Redemptions"}
            value={redemptions.length.toLocaleString(locale)}
          />
          <Metric
            icon={CircleDollarSign}
            label={ar ? "تكلفة الخصومات" : "Discount spend"}
            value={formatMoney(discountSpend, locale)}
          />
          <Metric
            icon={CircleDollarSign}
            label={
              ar
                ? "قيمة الطلبات باستخدام الأكواد"
                : "Code-attributed order value"
            }
            value={formatMoney(attributedRevenue, locale)}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <div>
            <h2 className="mb-4 font-serif text-4xl">
              {ar ? "إنشاء حملة" : "Create a campaign"}
            </h2>
            <CampaignForm locale={locale} today={today} />
          </div>
          <div>
            <h2 className="mb-4 font-serif text-4xl">
              {ar ? "إنشاء كود خصم" : "Create a discount code"}
            </h2>
            <DiscountCodeForm locale={locale} campaigns={campaigns} />
          </div>
        </section>

        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="eyebrow text-[#0e7468]">
                {ar ? "الأداء" : "CAMPAIGN PERFORMANCE"}
              </p>
              <h2 className="mt-2 font-serif text-4xl md:text-5xl">
                {ar ? "الحملات الحالية" : "Current campaigns"}
              </h2>
            </div>
            <p className="text-xs text-neutral-500">
              {ar
                ? "قيمة الطلبات هي إجمالي الطلبات التي استخدمت كوداً، وليست الإيراد المحصل."
                : "Order value is the total of orders that redeemed a code, not collected revenue."}
            </p>
          </div>
          <div className="mt-5 grid gap-4">
            {campaigns.map((campaign) => {
              const campaignCodes = codes.filter(
                (code) => code.campaign_id === campaign.id,
              );
              const campaignRedemptions = campaignCodes.flatMap(
                (code) => code.discount_redemptions,
              );
              const spent = campaignRedemptions.reduce(
                (sum, item) => sum + item.discount_minor,
                0,
              );
              const revenue = campaignRedemptions.reduce(
                (sum, item) => sum + (item.orders?.total_minor ?? 0),
                0,
              );
              const status = !campaign.is_active
                ? ar
                  ? "متوقفة"
                  : "Paused"
                : campaign.starts_on > today
                  ? ar
                    ? "قادمة"
                    : "Upcoming"
                  : campaign.ends_on < today
                    ? ar
                      ? "منتهية"
                      : "Ended"
                    : ar
                      ? "نشطة"
                      : "Active";
              return (
                <article
                  key={campaign.id}
                  className="border border-black/10 bg-white p-5 md:p-7"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-serif text-3xl">
                          {ar ? campaign.name_ar : campaign.name_en}
                        </h3>
                        <Tag>{status}</Tag>
                        <Tag>{campaign.channel}</Tag>
                      </div>
                      <p className="mt-2 text-xs text-neutral-500">
                        {campaign.starts_on} → {campaign.ends_on}
                        {campaign.utm_campaign
                          ? ` · utm_campaign=${campaign.utm_campaign}`
                          : ""}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-5 text-end text-xs">
                      <Stat
                        label={ar ? "استخدام" : "Uses"}
                        value={String(campaignRedemptions.length)}
                      />
                      <Stat
                        label={ar ? "خصم" : "Spend"}
                        value={formatMoney(spent, locale)}
                      />
                      <Stat
                      label={ar ? "قيمة الطلبات" : "Order value"}
                        value={formatMoney(revenue, locale)}
                      />
                    </div>
                  </div>
                  {campaign.budget_minor && (
                    <div className="mt-5">
                      <div className="flex justify-between text-[10px]">
                        <span>{ar ? "استهلاك الميزانية" : "Budget used"}</span>
                        <strong>
                          {Math.min(
                            100,
                            Math.round((spent / campaign.budget_minor) * 100),
                          )}
                          % ·{" "}
                          {formatMoney(
                            campaign.budget_minor -
                              Math.min(spent, campaign.budget_minor),
                            locale,
                          )}{" "}
                          {ar ? "متبقي" : "remaining"}
                        </strong>
                      </div>
                      <div className="mt-2 h-2 bg-black/5">
                        <div
                          className="h-full bg-[#0e7468]"
                          style={{
                            width: `${Math.min(100, (spent / campaign.budget_minor) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                  <details className="mt-5 border-t border-black/10 pt-4">
                    <summary className="cursor-pointer text-xs font-bold uppercase tracking-[.12em]">
                      {ar ? "تعديل الحملة" : "Edit campaign"}
                    </summary>
                    <div className="mt-4">
                      <CampaignForm
                        locale={locale}
                        campaign={campaign}
                        today={today}
                      />
                    </div>
                  </details>
                </article>
              );
            })}
          </div>
          {!campaigns.length && (
            <Empty>
              {ar
                ? "أنشئ أول حملة لربط الأكواد بقناة وميزانية."
                : "Create the first campaign to connect codes to a channel and budget."}
            </Empty>
          )}
        </section>

        <section>
          <p className="eyebrow text-[#0e7468]">
            {ar ? "الأكواد" : "DISCOUNT CODES"}
          </p>
          <h2 className="mt-2 font-serif text-4xl md:text-5xl">
            {ar ? "الاستخدام والحدود" : "Usage & limits"}
          </h2>
          <div className="mt-5 grid gap-4">
            {codes.map((code) => {
              const used = code.discount_redemptions.length;
              const spent = code.discount_redemptions.reduce(
                (sum, item) => sum + item.discount_minor,
                0,
              );
              return (
                <article
                  key={code.id}
                  className="border border-black/10 bg-white p-5 md:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-mono text-2xl font-bold">
                          {code.code}
                        </h3>
                        <Tag>
                          {code.is_active
                            ? ar
                              ? "نشط"
                              : "Active"
                            : ar
                              ? "متوقف"
                              : "Paused"}
                        </Tag>
                      </div>
                      <p className="mt-2 text-xs text-neutral-500">
                        {code.discount_campaigns
                          ? ar
                            ? code.discount_campaigns.name_ar
                            : code.discount_campaigns.name_en
                          : ar
                            ? "بدون حملة"
                            : "Standalone code"}{" "}
                        ·{" "}
                        {code.discount_type === "percentage"
                          ? `${code.value / 100}%`
                          : formatMoney(code.value, locale)}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-5 text-end text-xs">
                      <Stat
                        label={ar ? "استخدام" : "Uses"}
                        value={`${used}${code.usage_limit ? ` / ${code.usage_limit}` : ""}`}
                      />
                      <Stat
                        label={ar ? "لكل عميل" : "Per customer"}
                        value={String(code.per_customer_limit)}
                      />
                      <Stat
                        label={ar ? "إجمالي الخصم" : "Discount given"}
                        value={formatMoney(spent, locale)}
                      />
                    </div>
                  </div>
                  <p className="mt-4 text-[11px] text-neutral-500">
                    {ar ? "حد الطلب" : "Minimum order"}:{" "}
                    {formatMoney(code.minimum_subtotal_minor, locale)}
                    {code.maximum_discount_minor
                      ? ` · ${ar ? "أقصى خصم" : "Maximum discount"}: ${formatMoney(code.maximum_discount_minor, locale)}`
                      : ""}
                    {code.starts_on || code.ends_on
                      ? ` · ${code.starts_on ?? "…"} → ${code.ends_on ?? "…"}`
                      : ""}
                  </p>
                  <details className="mt-4 border-t border-black/10 pt-4">
                    <summary className="cursor-pointer text-xs font-bold uppercase tracking-[.12em]">
                      {ar ? "تعديل الكود" : "Edit code"}
                    </summary>
                    <div className="mt-4">
                      <DiscountCodeForm
                        locale={locale}
                        campaigns={campaigns}
                        discountCode={code}
                      />
                    </div>
                  </details>
                </article>
              );
            })}
          </div>
          {!codes.length && (
            <Empty>
              {ar ? "لا توجد أكواد خصم بعد." : "No discount codes yet."}
            </Empty>
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BarChart3;
  label: string;
  value: string;
}) {
  return (
    <article className="border border-black/10 bg-white p-5">
      <Icon size={19} className="text-[#0e7468]" />
      <p className="mt-5 text-[9px] font-bold uppercase tracking-[.12em] text-neutral-500">
        {label}
      </p>
      <strong className="mt-2 block font-serif text-3xl font-normal">
        {value}
      </strong>
    </article>
  );
}
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-[9px] font-bold uppercase tracking-wide text-neutral-500">
        {label}
      </span>
      <strong className="mt-1 block">{value}</strong>
    </div>
  );
}
function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-[#dce9e5] px-2 py-1 text-[9px] font-bold uppercase text-[#073b36]">
      {children}
    </span>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-5 border border-dashed border-black/15 bg-white p-10 text-center text-sm text-neutral-500">
      {children}
    </div>
  );
}
