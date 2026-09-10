"use client";

import { useActionState, useState } from "react";
import { Check, LoaderCircle, Star, Trash2 } from "lucide-react";
import { deleteReviewAction, saveReviewAction } from "./actions";
import type { ProductReview, ReviewActionState } from "./types";

const initialState: ReviewActionState = { status: "idle" };

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <span className="mt-1 block text-xs font-medium text-[#9a3f29]">
      {errors[0]}
    </span>
  );
}

export function ReviewForm({
  locale,
  productId,
  productSlug,
  orderItemId,
  review,
}: {
  locale: "en" | "ar";
  productId: number;
  productSlug: string;
  orderItemId?: number;
  review?: ProductReview | null;
}) {
  const ar = locale === "ar";
  const [state, action, pending] = useActionState(
    saveReviewAction,
    initialState,
  );
  const [deleteState, deleteAction, deleting] = useActionState(
    deleteReviewAction,
    initialState,
  );
  const [rating, setRating] = useState(review?.rating ?? 0);
  const [bodyLength, setBodyLength] = useState(review?.body.length ?? 0);

  return (
    <div className="rounded-xs border border-[var(--border-subtle)] bg-white p-5 shadow-subtle sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-serif text-2xl text-[var(--text-strong)]">
            {review
              ? ar
                ? "تعديل تقييمك"
                : "Edit your review"
              : ar
                ? "شاركنا تجربتك"
                : "Share your experience"}
          </h3>
          <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
            {ar
              ? "تقييمك يساعد زملاءك على اختيار المقاس والمنتج المناسبين."
              : "Your feedback helps fellow professionals choose the right fit."}
          </p>
        </div>
        {review && (
          <span
            className={`w-fit rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[.1em] ${
              review.status === "approved"
                ? "bg-[#e1f2ea] text-[#096b56]"
                : review.status === "rejected"
                  ? "bg-[#f8e5df] text-[#953a25]"
                  : "bg-[#fff1d6] text-[#8b5b06]"
            }`}
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
        )}
      </div>

      {review?.status === "approved" && (
        <p className="mt-4 border-s-2 border-[#bd6b2c] ps-3 text-xs leading-5 text-[var(--text-muted)]">
          {ar
            ? "أي تعديل سيعيد التقييم للمراجعة قبل نشره مرة أخرى."
            : "Any edit will return this review to moderation before it is published again."}
        </p>
      )}

      {review?.admin_response && (
        <div className="mt-4 border-s-2 border-[#81c5b8] bg-[#f3f8f6] px-4 py-3">
          <strong className="text-xs font-bold uppercase tracking-[.1em] text-[#0e7468]">
            {ar ? "رسالة من سكراب فايب" : "Message from Scrub Vibe"}
          </strong>
          <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
            {review.admin_response}
          </p>
        </div>
      )}

      <form action={action} className="mt-6 space-y-5">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="productId" value={productId} />
        <input type="hidden" name="productSlug" value={productSlug} />
        {orderItemId && (
          <input type="hidden" name="orderItemId" value={orderItemId} />
        )}
        {review && <input type="hidden" name="reviewId" value={review.id} />}

        <fieldset>
          <legend className="text-xs font-bold uppercase tracking-[.12em] text-[var(--text-strong)]">
            {ar ? "تقييمك العام" : "Your overall rating"}{" "}
            <span className="text-[#a5472f]">*</span>
          </legend>
          <div className="mt-2 flex w-fit gap-0.5" dir="ltr">
            {[1, 2, 3, 4, 5].map((value) => (
              <label
                key={value}
                className="grid size-11 cursor-pointer place-items-center rounded-full transition-colors hover:bg-[#fff5e9] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#0e7468]"
              >
                <input
                  className="sr-only"
                  type="radio"
                  name="rating"
                  value={value}
                  required
                  defaultChecked={value === review?.rating}
                  onChange={() => setRating(value)}
                  aria-label={
                    ar ? `${value} من 5 نجوم` : `${value} out of 5 stars`
                  }
                />
                <Star
                  size={27}
                  fill={value <= rating ? "currentColor" : "transparent"}
                  className={
                    value <= rating ? "text-[#bd6b2c]" : "text-[#aeb7b1]"
                  }
                  aria-hidden="true"
                />
              </label>
            ))}
          </div>
          <FieldError errors={state.fieldErrors?.rating} />
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-xs font-bold uppercase tracking-[.1em] text-[var(--text-strong)]">
            {ar ? "كيف كان المقاس؟" : "How was the fit?"}
            <select
              name="fitFeedback"
              defaultValue={review?.fit_feedback ?? ""}
              className="mt-2 h-12 w-full rounded-xs border border-[var(--border-subtle)] bg-white px-3 text-sm font-normal normal-case outline-none focus:border-[#0e7468] focus:ring-2 focus:ring-[#0e7468]/15"
            >
              <option value="">
                {ar ? "اختر (اختياري)" : "Choose (optional)"}
              </option>
              <option value="runs_small">
                {ar ? "أصغر من المتوقع" : "Runs small"}
              </option>
              <option value="true_to_size">
                {ar ? "مظبوط على المقاس" : "True to size"}
              </option>
              <option value="runs_large">
                {ar ? "أكبر من المتوقع" : "Runs large"}
              </option>
            </select>
          </label>
          <label className="flex min-h-12 items-center gap-3 self-end rounded-xs border border-[var(--border-subtle)] bg-[#f7faf8] px-4 py-3 text-sm font-semibold text-[var(--text-strong)]">
            <input
              type="checkbox"
              name="wouldRecommend"
              defaultChecked={review?.would_recommend ?? true}
              className="size-5 accent-[#0e7468]"
            />
            {ar ? "أنصح زملائي بهذا المنتج" : "I would recommend this product"}
          </label>
        </div>

        <label className="block text-xs font-bold uppercase tracking-[.1em] text-[var(--text-strong)]">
          {ar ? "عنوان مختصر" : "Short headline"}
          <input
            name="title"
            maxLength={100}
            defaultValue={review?.title ?? ""}
            placeholder={
              ar ? "مثال: مريح طوال النوبة" : "Example: Comfortable all shift"
            }
            className="mt-2 h-12 w-full rounded-xs border border-[var(--border-subtle)] bg-white px-4 text-sm font-normal normal-case outline-none placeholder:text-black/35 focus:border-[#0e7468] focus:ring-2 focus:ring-[#0e7468]/15"
          />
          <FieldError errors={state.fieldErrors?.title} />
        </label>

        <label className="block text-xs font-bold uppercase tracking-[.1em] text-[var(--text-strong)]">
          {ar ? "تجربتك" : "Your review"}{" "}
          <span className="text-[#a5472f]">*</span>
          <textarea
            name="body"
            required
            minLength={20}
            maxLength={1500}
            defaultValue={review?.body ?? ""}
            onChange={(event) => setBodyLength(event.target.value.length)}
            placeholder={
              ar
                ? "اخبرنا عن الخامة والراحة والمقاس بعد الاستخدام..."
                : "Tell us about the fabric, comfort and fit after wearing it..."
            }
            className="mt-2 min-h-32 w-full resize-y rounded-xs border border-[var(--border-subtle)] bg-white px-4 py-3 text-sm font-normal leading-6 normal-case outline-none placeholder:text-black/35 focus:border-[#0e7468] focus:ring-2 focus:ring-[#0e7468]/15"
          />
          <span className="mt-1 flex justify-between text-[11px] font-normal normal-case text-[var(--text-muted)]">
            <span>{ar ? "20 حرفاً على الأقل" : "20 characters minimum"}</span>
            <span>{bodyLength}/1500</span>
          </span>
          <FieldError errors={state.fieldErrors?.body} />
        </label>

        {state.message && (
          <p
            role="status"
            className={`flex items-start gap-2 rounded-xs border px-4 py-3 text-sm ${
              state.status === "success"
                ? "border-[#0e7468]/25 bg-[#edf7f3] text-[#07594f]"
                : "border-[#a5472f]/25 bg-[#fff3ef] text-[#8d3824]"
            }`}
          >
            {state.status === "success" && (
              <Check size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
            )}
            {state.message}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-[var(--text-muted)]">
            {ar
              ? "ننشر التقييمات بعد مراجعتها لحماية مجتمعنا."
              : "Reviews are moderated before publishing to protect our community."}
          </p>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xs bg-[#073b36] px-6 text-xs font-bold uppercase tracking-[.12em] text-white transition-colors hover:bg-[#0e7468] disabled:cursor-wait disabled:opacity-65"
          >
            {pending && (
              <LoaderCircle
                size={16}
                className="animate-spin"
                aria-hidden="true"
              />
            )}
            {pending
              ? ar
                ? "جارٍ الحفظ..."
                : "Saving..."
              : review
                ? ar
                  ? "حفظ التعديلات"
                  : "Save changes"
                : ar
                  ? "إرسال التقييم"
                  : "Submit review"}
          </button>
        </div>
      </form>

      {review && (
        <form
          action={deleteAction}
          onSubmit={(event) => {
            if (
              !window.confirm(
                ar
                  ? "هل تريد حذف تقييمك نهائياً؟"
                  : "Delete your review permanently?",
              )
            ) {
              event.preventDefault();
            }
          }}
          className="mt-4 border-t border-[var(--border-subtle)] pt-4"
        >
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="reviewId" value={review.id} />
          <input type="hidden" name="productSlug" value={productSlug} />
          <button
            type="submit"
            disabled={deleting}
            className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-[#9a3f29] underline decoration-transparent underline-offset-4 hover:decoration-current disabled:opacity-60"
          >
            <Trash2 size={15} aria-hidden="true" />
            {deleting
              ? ar
                ? "جارٍ الحذف..."
                : "Deleting..."
              : ar
                ? "حذف تقييمي"
                : "Delete my review"}
          </button>
          {deleteState.message && (
            <p className="mt-2 text-xs text-[#8d3824]" role="status">
              {deleteState.message}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
