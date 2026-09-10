import type { Metadata, Route } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  MessageSquareText,
  Star,
} from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { ReviewStars } from "@/features/reviews/review-stars";
import { getCustomerReviewDashboard } from "@/features/reviews/repository";
import { isLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Your reviews | Scrub Vibe",
  robots: { index: false, follow: false },
};

function statusStyle(status: "pending" | "approved" | "rejected") {
  if (status === "approved") return "bg-[#e1f2ea] text-[#096b56]";
  if (status === "rejected") return "bg-[#f8e5df] text-[#953a25]";
  return "bg-[#fff1d6] text-[#8b5b06]";
}

export default async function CustomerReviewsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ar = locale === "ar";
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) redirect(`/${locale}/account`);

  const dashboard = await getCustomerReviewDashboard(userId);

  return (
    <main className="mx-auto min-h-[70vh] max-w-[1100px] px-5 py-12 sm:px-6 md:px-10 md:py-20">
      <Link
        href={`/${locale}/account` as Route}
        className="inline-flex min-h-11 items-center text-xs font-bold uppercase tracking-[.1em] text-[#0e7468] hover:underline"
      >
        <ArrowRight
          size={15}
          className="me-2 rotate-180 rtl:rotate-0"
          aria-hidden="true"
        />
        {ar ? "العودة إلى الحساب" : "Back to account"}
      </Link>
      <div className="mt-5 max-w-2xl">
        <p className="eyebrow text-[#0e7468]">
          {ar ? "تجربتك تهمنا" : "YOUR EXPERIENCE"}
        </p>
        <h1 className="mt-3 font-serif text-4xl text-[var(--text-strong)] sm:text-5xl">
          {ar ? "تقييماتك" : "Your product reviews"}
        </h1>
        <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
          {ar
            ? "قيّم المنتجات التي استلمتها، وتابع حالة نشر تقييماتك أو عدّلها في أي وقت."
            : "Review delivered products, follow moderation status, or update your feedback anytime."}
        </p>
      </div>

      {dashboard.awaitingReview.length > 0 && (
        <section className="mt-12">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-[#e8f3ef] text-[#0e7468]">
              <Star size={19} aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-serif text-2xl text-[var(--text-strong)]">
                {ar ? "بانتظار تقييمك" : "Waiting for your review"}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {ar
                  ? "منتجات تم استلامها ولم تُقيّم بعد"
                  : "Delivered products you have not reviewed yet"}
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dashboard.awaitingReview.map((product) => (
              <article
                key={product.productId}
                className="flex min-w-0 gap-4 rounded-xs border border-[var(--border-subtle)] bg-white p-4 shadow-subtle"
              >
                <div className="relative size-20 shrink-0 overflow-hidden rounded-xs bg-[#eef2ef]">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.title[locale]}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <MessageSquareText
                      className="absolute inset-0 m-auto text-[#8aa49d]"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 text-sm font-bold text-[var(--text-strong)]">
                    {product.title[locale]}
                  </h3>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {[product.colour[locale], product.size]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <Link
                    href={
                      `/${locale}/products/${product.slug}#reviews` as Route
                    }
                    className="mt-3 inline-flex min-h-9 items-center text-xs font-bold text-[#0e7468] underline underline-offset-4"
                  >
                    {ar ? "اكتب تقييمك" : "Write a review"}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="mt-14">
        <h2 className="font-serif text-2xl text-[var(--text-strong)]">
          {ar ? "التقييمات السابقة" : "Submitted reviews"}
        </h2>
        {dashboard.reviews.length ? (
          <div className="mt-5 space-y-4">
            {dashboard.reviews.map(({ review, product }) => (
              <article
                key={review.id}
                className="rounded-xs border border-[var(--border-subtle)] bg-white p-5 shadow-subtle sm:p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="relative size-24 shrink-0 overflow-hidden rounded-xs bg-[#eef2ef]">
                    {product.imageUrl && (
                      <Image
                        src={product.imageUrl}
                        alt={product.title[locale]}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-[var(--text-strong)]">
                          {product.title[locale]}
                        </h3>
                        <ReviewStars
                          rating={review.rating}
                          label={
                            ar
                              ? `${review.rating} من 5`
                              : `${review.rating} out of 5`
                          }
                          className="mt-2"
                        />
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[.08em] ${statusStyle(review.status)}`}
                      >
                        {review.status === "approved"
                          ? ar
                            ? "منشور"
                            : "Published"
                          : review.status === "rejected"
                            ? ar
                              ? "يحتاج تعديلاً"
                              : "Needs changes"
                            : ar
                              ? "قيد المراجعة"
                              : "In moderation"}
                      </span>
                    </div>
                    {review.title && (
                      <strong className="mt-3 block text-sm">
                        {review.title}
                      </strong>
                    )}
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--text-muted)]">
                      {review.body}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--text-muted)]">
                      <span className="inline-flex items-center gap-1.5 text-[#0e7468]">
                        <BadgeCheck size={15} aria-hidden="true" />
                        {ar ? "شراء موثّق" : "Verified purchase"}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock3 size={14} aria-hidden="true" />
                        {new Intl.DateTimeFormat(locale, {
                          dateStyle: "medium",
                        }).format(new Date(review.updated_at))}
                      </span>
                    </div>
                    <Link
                      href={
                        `/${locale}/products/${product.slug}#reviews` as Route
                      }
                      className="mt-4 inline-flex min-h-10 items-center text-xs font-bold text-[#0e7468] underline underline-offset-4"
                    >
                      {ar ? "عرض أو تعديل التقييم" : "View or edit review"}
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-xs border border-dashed border-[var(--border-subtle)] bg-[#f7faf8] p-8 text-center">
            <MessageSquareText
              className="mx-auto text-[#7b9f96]"
              aria-hidden="true"
            />
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              {ar
                ? "لم ترسل أي تقييمات بعد."
                : "You have not submitted any reviews yet."}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
