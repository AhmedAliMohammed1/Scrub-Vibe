import type { Route } from "next";
import Link from "next/link";
import { BadgeCheck, MessageSquareText, ThumbsUp } from "lucide-react";
import { PaginationNav } from "@/components/ui/pagination-nav";
import type { ProductReviewSnapshot } from "./types";
import { ReviewForm } from "./review-form";
import { ReviewStars } from "./review-stars";

function fitLabel(value: string, ar: boolean) {
  if (value === "runs_small") return ar ? "أصغر من المتوقع" : "Runs small";
  if (value === "runs_large") return ar ? "أكبر من المتوقع" : "Runs large";
  return ar ? "مظبوط على المقاس" : "True to size";
}

export function ProductReviewsSection({
  locale,
  productId,
  productSlug,
  snapshot,
}: {
  locale: "en" | "ar";
  productId: number;
  productSlug: string;
  snapshot: ProductReviewSnapshot;
}) {
  const ar = locale === "ar";
  const { summary } = snapshot;
  const maxFit = Math.max(...Object.values(summary.fit));
  const dominantFit = maxFit
    ? (Object.entries(summary.fit).find(([, count]) => count === maxFit)?.[0] ??
      null)
    : null;

  return (
    <section
      id="reviews"
      className="mt-20 scroll-mt-28 border-t border-[var(--border-subtle)] pt-12"
    >
      <div className="max-w-2xl">
        <p className="eyebrow text-[#0e7468]">
          {ar ? "آراء موثّقة" : "VERIFIED FEEDBACK"}
        </p>
        <h2 className="mt-3 font-serif text-3xl text-[var(--text-strong)] sm:text-4xl">
          {ar
            ? "تقييمات مجتمع سكراب فايب"
            : "Reviews from the Scrub Vibe community"}
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
          {ar
            ? "كل تقييم موثّق مرتبط بطلب تم استلامه فعلياً."
            : "Every verified review is linked to an order that was actually delivered."}
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[.72fr_1.28fr] lg:items-start">
        <aside className="rounded-xs bg-[#073b36] p-6 text-white sm:p-8 lg:sticky lg:top-28">
          {summary.count ? (
            <>
              <div className="flex items-end gap-3">
                <strong className="font-serif text-6xl leading-none">
                  {summary.average.toFixed(1)}
                </strong>
                <span className="pb-1 text-sm text-white/65">/ 5</span>
              </div>
              <ReviewStars
                rating={summary.average}
                label={
                  ar ? `${summary.average} من 5` : `${summary.average} out of 5`
                }
                size={19}
                className="mt-3 text-[#efb467]"
              />
              <p className="mt-2 text-xs text-white/65">
                {ar
                  ? `بناءً على ${summary.count} تقييم`
                  : `Based on ${summary.count} review${summary.count === 1 ? "" : "s"}`}
              </p>
              <div
                className="mt-7 space-y-2.5"
                aria-label={ar ? "توزيع التقييمات" : "Rating distribution"}
              >
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count =
                    summary.distribution[rating as 1 | 2 | 3 | 4 | 5];
                  const percent = summary.count
                    ? (count / summary.count) * 100
                    : 0;
                  return (
                    <div
                      key={rating}
                      className="grid grid-cols-[1.5rem_1fr_2rem] items-center gap-2 text-xs"
                    >
                      <span>{rating}</span>
                      <span className="h-1.5 overflow-hidden rounded-full bg-white/15">
                        <span
                          className="block h-full rounded-full bg-[#efb467]"
                          style={{ width: `${percent}%` }}
                        />
                      </span>
                      <span className="text-end text-white/60">{count}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-7 grid grid-cols-2 gap-3 border-t border-white/15 pt-6">
                <div>
                  <strong className="block text-2xl">
                    {summary.recommendPercentage}%
                  </strong>
                  <span className="mt-1 block text-xs leading-5 text-white/65">
                    {ar ? "ينصحون بالمنتج" : "would recommend"}
                  </span>
                </div>
                <div>
                  <strong className="block text-base leading-7">
                    {dominantFit ? fitLabel(dominantFit, ar) : "—"}
                  </strong>
                  <span className="mt-1 block text-xs leading-5 text-white/65">
                    {ar ? "رأي الأغلبية في المقاس" : "most common fit"}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="py-5">
              <MessageSquareText
                size={30}
                className="text-[#81c5b8]"
                aria-hidden="true"
              />
              <h3 className="mt-5 font-serif text-2xl">
                {ar ? "كن أول من يقيّم" : "Be the first to review"}
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/65">
                {ar
                  ? "بعد استلام طلبك، شاركنا تجربتك بكل صراحة."
                  : "After your order arrives, share your honest experience."}
              </p>
            </div>
          )}
        </aside>

        <div>
          {snapshot.viewer.ownReview ? (
            <ReviewForm
              locale={locale}
              productId={productId}
              productSlug={productSlug}
              review={snapshot.viewer.ownReview}
            />
          ) : snapshot.viewer.eligiblePurchase ? (
            <ReviewForm
              locale={locale}
              productId={productId}
              productSlug={productSlug}
              orderItemId={snapshot.viewer.eligiblePurchase.orderItemId}
            />
          ) : (
            <div className="rounded-xs border border-[var(--border-subtle)] bg-[#f7faf8] p-5 sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-6">
              <div>
                <h3 className="font-serif text-xl text-[var(--text-strong)]">
                  {snapshot.viewer.authenticated
                    ? ar
                      ? "التقييم متاح بعد الاستلام"
                      : "Reviews unlock after delivery"
                    : ar
                      ? "هل اشتريت هذا المنتج؟"
                      : "Purchased this product?"}
                </h3>
                <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
                  {snapshot.viewer.authenticated
                    ? ar
                      ? "سنفعّل نموذج التقييم تلقائياً عندما تصبح حالة طلبك تم التسليم."
                      : "The review form appears automatically when your order is marked delivered."
                    : ar
                      ? "سجّل الدخول لكتابة تقييم موثّق بعد استلام طلبك."
                      : "Sign in to write a verified review after your order is delivered."}
                </p>
              </div>
              {!snapshot.viewer.authenticated && (
                <Link
                  href={`/${locale}/account` as Route}
                  className="mt-4 inline-flex min-h-11 shrink-0 items-center justify-center rounded-xs border border-[#0e7468] px-5 text-xs font-bold uppercase tracking-[.1em] text-[#0e7468] hover:bg-[#0e7468] hover:text-white sm:mt-0"
                >
                  {ar ? "تسجيل الدخول" : "Sign in"}
                </Link>
              )}
            </div>
          )}

          <div className="mt-8">
            <div className="flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
              <h3 className="font-serif text-2xl text-[var(--text-strong)]">
                {ar ? "كل التقييمات" : "All reviews"}
              </h3>
              <span className="text-xs font-semibold text-[var(--text-muted)]">
                {summary.count}
              </span>
            </div>

            {snapshot.reviews.length ? (
              <div className="divide-y divide-[var(--border-subtle)]">
                {snapshot.reviews.map((review) => (
                  <article key={review.id} className="py-7">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <ReviewStars
                          rating={review.rating}
                          label={
                            ar
                              ? `${review.rating} من 5`
                              : `${review.rating} out of 5`
                          }
                        />
                        {review.title && (
                          <h4 className="mt-3 text-base font-bold text-[var(--text-strong)]">
                            {review.title}
                          </h4>
                        )}
                      </div>
                      <time
                        className="text-xs text-[var(--text-muted)]"
                        dateTime={review.published_at ?? review.created_at}
                      >
                        {new Intl.DateTimeFormat(locale, {
                          dateStyle: "medium",
                        }).format(
                          new Date(review.published_at ?? review.created_at),
                        )}
                      </time>
                    </div>
                    <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[var(--text-muted)]">
                      {review.body}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--text-muted)]">
                      <strong className="text-[var(--text-strong)]">
                        {review.reviewer_name}
                      </strong>
                      {review.is_verified_purchase && (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-[#0e7468]">
                          <BadgeCheck size={15} aria-hidden="true" />
                          {ar ? "شراء موثّق" : "Verified purchase"}
                        </span>
                      )}
                      {review.fit_feedback && (
                        <span>{fitLabel(review.fit_feedback, ar)}</span>
                      )}
                      {review.purchased_size && (
                        <span>
                          {ar
                            ? `المقاس ${review.purchased_size}`
                            : `Size ${review.purchased_size}`}
                        </span>
                      )}
                      {review.would_recommend && (
                        <span className="inline-flex items-center gap-1.5">
                          <ThumbsUp size={14} aria-hidden="true" />
                          {ar ? "ينصح به" : "Recommends"}
                        </span>
                      )}
                    </div>
                    {review.admin_response && (
                      <div className="mt-5 border-s-2 border-[#81c5b8] bg-[#f3f8f6] px-4 py-3">
                        <strong className="text-xs font-bold uppercase tracking-[.1em] text-[#0e7468]">
                          {ar ? "رد سكراب فايب" : "Scrub Vibe response"}
                        </strong>
                        <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
                          {review.admin_response}
                        </p>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-[var(--text-muted)]">
                {ar
                  ? "لا توجد تقييمات منشورة بعد."
                  : "No published reviews yet."}
              </p>
            )}

            <PaginationNav
              locale={locale}
              pathname={`/${locale}/products/${productSlug}`}
              currentPage={snapshot.currentPage}
              totalItems={snapshot.totalReviews}
              pageSize={snapshot.pageSize}
              pageParam="reviewPage"
              anchor="reviews"
              itemLabel={{ en: "reviews", ar: "تقييم" }}
              hideWhenSinglePage
              className="mt-4"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
