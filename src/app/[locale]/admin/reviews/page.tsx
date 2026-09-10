import type { Metadata, Route } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  MessageSquareText,
  Sparkles,
  Star,
  ThumbsUp,
} from "lucide-react";
import { notFound } from "next/navigation";
import { PaginationNav } from "@/components/ui/pagination-nav";
import { ReviewModerationForm } from "@/features/reviews/review-moderation-form";
import { ReviewStars } from "@/features/reviews/review-stars";
import type { ProductReview, ReviewStatus } from "@/features/reviews/types";
import { isLocale } from "@/lib/i18n";
import { getPagination, parsePage } from "@/lib/pagination";
import { requireRoles } from "@/server/auth/roles";

export const metadata: Metadata = {
  title: "Customer reviews | Scrub Vibe Admin",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 10;
const reviewStatuses: ReviewStatus[] = ["pending", "approved", "rejected"];

type ProductRow = {
  id: number;
  slug: string;
  product_translations: { locale: string; title: string }[];
};

function statusClasses(status: ReviewStatus) {
  if (status === "approved") return "bg-[#e1f2ea] text-[#096b56]";
  if (status === "rejected") return "bg-[#f8e5df] text-[#953a25]";
  return "bg-[#fff1d6] text-[#8b5b06]";
}

function fitText(value: string | null, ar: boolean) {
  if (value === "runs_small") return ar ? "أصغر من المتوقع" : "Runs small";
  if (value === "runs_large") return ar ? "أكبر من المتوقع" : "Runs large";
  if (value === "true_to_size") return ar ? "مظبوط على المقاس" : "True to size";
  return ar ? "لم يُحدد" : "Not provided";
}

export default async function AdminReviewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    status?: string;
    rating?: string;
    product?: string;
    page?: string;
  }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const ar = locale === "ar";
  const { supabase } = await requireRoles([
    "content_editor",
    "product_manager",
    "admin",
    "super_admin",
  ]);

  const selectedStatus = reviewStatuses.includes(query.status as ReviewStatus)
    ? (query.status as ReviewStatus)
    : null;
  const selectedRating = [1, 2, 3, 4, 5].includes(Number(query.rating))
    ? Number(query.rating)
    : null;
  const selectedProduct =
    Number.isInteger(Number(query.product)) && Number(query.product) > 0
      ? Number(query.product)
      : null;

  let countRequest = supabase
    .from("product_reviews")
    .select("id", { count: "exact", head: true });
  if (selectedStatus) countRequest = countRequest.eq("status", selectedStatus);
  if (selectedRating) countRequest = countRequest.eq("rating", selectedRating);
  if (selectedProduct)
    countRequest = countRequest.eq("product_id", selectedProduct);

  const [countResult, summaryResult, productsResult] = await Promise.all([
    countRequest,
    supabase.rpc("get_review_admin_summary"),
    supabase
      .from("products")
      .select("id, slug, product_translations(locale, title)")
      .order("created_at", { ascending: false }),
  ]);
  if (countResult.error || summaryResult.error || productsResult.error) {
    throw new Error("Review moderation data could not be loaded.");
  }

  const pagination = getPagination(
    countResult.count ?? 0,
    parsePage(query.page),
    PAGE_SIZE,
  );
  let reviewRequest = supabase
    .from("product_reviews")
    .select("*")
    .order("created_at", { ascending: false });
  if (selectedStatus)
    reviewRequest = reviewRequest.eq("status", selectedStatus);
  if (selectedRating)
    reviewRequest = reviewRequest.eq("rating", selectedRating);
  if (selectedProduct)
    reviewRequest = reviewRequest.eq("product_id", selectedProduct);
  const { data: reviewRows, error: reviewError } = await reviewRequest.range(
    pagination.from,
    pagination.to,
  );
  if (reviewError) throw new Error("Reviews could not be loaded.");

  const products = (productsResult.data ?? []) as ProductRow[];
  const productMap = new Map(products.map((product) => [product.id, product]));
  const summary = summaryResult.data?.[0];
  const statusLabel = (status: ReviewStatus) =>
    status === "approved"
      ? ar
        ? "منشور"
        : "Published"
      : status === "rejected"
        ? ar
          ? "مرفوض"
          : "Rejected"
        : ar
          ? "قيد المراجعة"
          : "Pending";

  return (
    <main className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 md:px-8 lg:py-12">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#0e7468]">
            {ar ? "الثقة وصوت العميل" : "TRUST & CUSTOMER VOICE"}
          </p>
          <h1 className="mt-2 font-serif text-3xl text-[#092f2b] sm:text-4xl">
            {ar ? "تقييمات المنتجات" : "Product reviews"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
            {ar
              ? "راجع الآراء الموثّقة، انشر المحتوى المفيد، واستخدم مؤشرات المقاس والتوصية لتحسين المنتجات والتسويق."
              : "Moderate verified feedback and use fit, rating and recommendation signals to improve products and campaigns."}
          </p>
        </div>
        <Link
          href={`/${locale}/admin` as Route}
          className="inline-flex min-h-11 w-fit items-center rounded-xs border border-[#0e7468]/30 px-5 text-[10px] font-bold uppercase tracking-[.1em] text-[#0e7468] hover:bg-white"
        >
          {ar ? "العودة للرئيسية" : "Back to overview"}
        </Link>
      </div>

      <section
        className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-6"
        aria-label={ar ? "ملخص التقييمات" : "Review summary"}
      >
        {[
          [
            MessageSquareText,
            ar ? "الإجمالي" : "Total",
            Number(summary?.total_count ?? 0),
          ],
          [
            Sparkles,
            ar ? "بانتظار المراجعة" : "Pending",
            Number(summary?.pending_count ?? 0),
          ],
          [
            BadgeCheck,
            ar ? "منشور" : "Published",
            Number(summary?.approved_count ?? 0),
          ],
          [
            Star,
            ar ? "متوسط النجوم" : "Avg. rating",
            Number(summary?.average_rating ?? 0).toFixed(1),
          ],
          [
            ThumbsUp,
            ar ? "نسبة التوصية" : "Recommend",
            `${Number(summary?.recommend_percentage ?? 0)}%`,
          ],
          [
            MessageSquareText,
            ar ? "آخر 30 يوماً" : "Last 30 days",
            Number(summary?.recent_count ?? 0),
          ],
        ].map(([Icon, label, value]) => {
          const StatIcon = Icon as typeof Star;
          return (
            <div
              key={String(label)}
              className="rounded-xs border border-black/6 bg-white p-4 shadow-sm"
            >
              <StatIcon
                size={17}
                className="text-[#0e7468]"
                aria-hidden="true"
              />
              <strong className="mt-3 block text-2xl text-[#092f2b]">
                {value as string | number}
              </strong>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-[.08em] text-neutral-500">
                {label as string}
              </span>
            </div>
          );
        })}
      </section>

      <form
        method="get"
        className="mt-6 grid gap-3 rounded-xs border border-black/6 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.4fr_auto_auto]"
      >
        <label className="text-[10px] font-bold uppercase tracking-[.08em] text-neutral-600">
          {ar ? "الحالة" : "Status"}
          <select
            name="status"
            defaultValue={selectedStatus ?? ""}
            className="mt-1 h-11 w-full rounded-xs border border-neutral-300 bg-white px-3 text-sm font-normal normal-case"
          >
            <option value="">{ar ? "كل الحالات" : "All statuses"}</option>
            {reviewStatuses.map((status) => (
              <option key={status} value={status}>
                {statusLabel(status)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[10px] font-bold uppercase tracking-[.08em] text-neutral-600">
          {ar ? "النجوم" : "Rating"}
          <select
            name="rating"
            defaultValue={selectedRating ?? ""}
            className="mt-1 h-11 w-full rounded-xs border border-neutral-300 bg-white px-3 text-sm font-normal normal-case"
          >
            <option value="">{ar ? "كل التقييمات" : "All ratings"}</option>
            {[5, 4, 3, 2, 1].map((rating) => (
              <option key={rating} value={rating}>
                {ar ? `${rating} نجوم` : `${rating} stars`}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[10px] font-bold uppercase tracking-[.08em] text-neutral-600 sm:col-span-2 lg:col-span-1">
          {ar ? "المنتج" : "Product"}
          <select
            name="product"
            defaultValue={selectedProduct ?? ""}
            className="mt-1 h-11 w-full rounded-xs border border-neutral-300 bg-white px-3 text-sm font-normal normal-case"
          >
            <option value="">{ar ? "كل المنتجات" : "All products"}</option>
            {products.map((product) => {
              const title =
                product.product_translations.find(
                  (item) => item.locale === locale,
                )?.title ?? product.slug;
              return (
                <option key={product.id} value={product.id}>
                  {title}
                </option>
              );
            })}
          </select>
        </label>
        <button className="min-h-11 self-end rounded-xs bg-[#073b36] px-5 text-[10px] font-bold uppercase tracking-[.1em] text-white hover:bg-[#0e7468]">
          {ar ? "تطبيق" : "Apply"}
        </button>
        <Link
          href={`/${locale}/admin/reviews` as Route}
          className="inline-flex min-h-11 items-center justify-center self-end px-4 text-[10px] font-bold uppercase tracking-[.1em] text-neutral-600 underline underline-offset-4"
        >
          {ar ? "مسح" : "Clear"}
        </Link>
      </form>

      <PaginationNav
        locale={locale}
        pathname={`/${locale}/admin/reviews`}
        currentPage={pagination.currentPage}
        totalItems={pagination.totalItems}
        pageSize={PAGE_SIZE}
        itemLabel={{ en: "reviews", ar: "تقييم" }}
        searchParams={{
          ...(selectedStatus ? { status: selectedStatus } : {}),
          ...(selectedRating ? { rating: String(selectedRating) } : {}),
          ...(selectedProduct ? { product: String(selectedProduct) } : {}),
        }}
        className="mt-6"
      />

      <section className="mt-4 space-y-4">
        {(reviewRows as ProductReview[]).map((review) => {
          const product = productMap.get(review.product_id);
          const productTitle =
            product?.product_translations.find((item) => item.locale === locale)
              ?.title ??
            product?.slug ??
            `#${review.product_id}`;
          return (
            <article
              key={review.id}
              className="rounded-xs border border-black/7 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <ReviewStars
                      rating={review.rating}
                      label={
                        ar
                          ? `${review.rating} من 5`
                          : `${review.rating} out of 5`
                      }
                    />
                    <span
                      className={`rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-[.09em] ${statusClasses(review.status)}`}
                    >
                      {statusLabel(review.status)}
                    </span>
                    {review.is_featured && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#efe5f7] px-3 py-1 text-[9px] font-bold uppercase tracking-[.09em] text-[#68417f]">
                        <Sparkles size={12} aria-hidden="true" />
                        {ar ? "مميّز" : "Featured"}
                      </span>
                    )}
                  </div>
                  <h2 className="mt-3 text-lg font-bold text-[#092f2b]">
                    {review.title ??
                      (ar ? "تقييم بدون عنوان" : "Untitled review")}
                  </h2>
                  <p className="mt-2 whitespace-pre-line text-sm leading-7 text-neutral-600">
                    {review.body}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-neutral-500">
                    <strong className="text-neutral-800">
                      {review.reviewer_name}
                    </strong>
                    <span className="inline-flex items-center gap-1 text-[#0e7468]">
                      <BadgeCheck size={14} aria-hidden="true" />
                      {ar ? "شراء موثّق" : "Verified purchase"}
                    </span>
                    <span>{fitText(review.fit_feedback, ar)}</span>
                    {review.purchased_colour && (
                      <span>{review.purchased_colour}</span>
                    )}
                    {review.purchased_size && (
                      <span>
                        {ar
                          ? `مقاس ${review.purchased_size}`
                          : `Size ${review.purchased_size}`}
                      </span>
                    )}
                    <span>
                      {review.would_recommend
                        ? ar
                          ? "ينصح به"
                          : "Recommends"
                        : ar
                          ? "لا ينصح به"
                          : "Does not recommend"}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-start lg:w-56 lg:text-end">
                  {product && (
                    <Link
                      href={
                        `/${locale}/products/${product.slug}#reviews` as Route
                      }
                      className="text-sm font-bold text-[#0e7468] underline underline-offset-4"
                    >
                      {productTitle}
                    </Link>
                  )}
                  <time
                    dateTime={review.created_at}
                    className="mt-2 block text-xs text-neutral-500"
                  >
                    {new Intl.DateTimeFormat(locale, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(review.created_at))}
                  </time>
                </div>
              </div>
              <ReviewModerationForm review={review} locale={locale} />
            </article>
          );
        })}
        {!reviewRows?.length && (
          <div className="rounded-xs border border-dashed border-neutral-300 bg-white p-12 text-center">
            <MessageSquareText
              className="mx-auto text-neutral-400"
              aria-hidden="true"
            />
            <p className="mt-3 text-sm text-neutral-600">
              {ar
                ? "لا توجد تقييمات تطابق هذه الفلاتر."
                : "No reviews match these filters."}
            </p>
          </div>
        )}
      </section>

      <PaginationNav
        locale={locale}
        pathname={`/${locale}/admin/reviews`}
        currentPage={pagination.currentPage}
        totalItems={pagination.totalItems}
        pageSize={PAGE_SIZE}
        itemLabel={{ en: "reviews", ar: "تقييم" }}
        searchParams={{
          ...(selectedStatus ? { status: selectedStatus } : {}),
          ...(selectedRating ? { rating: String(selectedRating) } : {}),
          ...(selectedProduct ? { product: String(selectedProduct) } : {}),
        }}
        hideWhenSinglePage
        className="mt-5"
      />
    </main>
  );
}
