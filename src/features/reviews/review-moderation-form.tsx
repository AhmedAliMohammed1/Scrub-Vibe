"use client";

import { useActionState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { moderateReviewAction } from "./actions";
import type { ProductReview, ReviewActionState } from "./types";

const initialState: ReviewActionState = { status: "idle" };

export function ReviewModerationForm({
  review,
  locale,
}: {
  review: ProductReview;
  locale: "en" | "ar";
}) {
  const ar = locale === "ar";
  const [state, action, pending] = useActionState(
    moderateReviewAction,
    initialState,
  );

  return (
    <form
      action={action}
      className="mt-5 rounded-xs border border-[#d9e2dd] bg-[#f6f9f7] p-4 sm:p-5"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="reviewId" value={review.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-[10px] font-bold uppercase tracking-[.1em] text-neutral-700">
          {ar ? "قرار المراجعة" : "Moderation decision"}
          <select
            name="status"
            defaultValue={review.status}
            className="mt-2 h-11 w-full rounded-xs border border-neutral-300 bg-white px-3 text-sm font-normal normal-case outline-none focus:border-[#0e7468] focus:ring-2 focus:ring-[#0e7468]/15"
          >
            <option value="pending">{ar ? "قيد المراجعة" : "Pending"}</option>
            <option value="approved">
              {ar ? "موافقة ونشر" : "Approve & publish"}
            </option>
            <option value="rejected">
              {ar ? "رفض وإخفاء" : "Reject & hide"}
            </option>
          </select>
        </label>
        <label className="flex min-h-11 items-center gap-3 self-end rounded-xs border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800">
          <input
            type="checkbox"
            name="isFeatured"
            defaultChecked={review.is_featured}
            className="size-5 accent-[#0e7468]"
          />
          {ar ? "تقييم مميّز" : "Feature this review"}
        </label>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <label className="text-[10px] font-bold uppercase tracking-[.1em] text-neutral-700">
          {ar ? "رد عام للعميل" : "Public customer response"}
          <textarea
            name="adminResponse"
            maxLength={1000}
            defaultValue={review.admin_response ?? ""}
            placeholder={
              ar
                ? "يظهر أسفل التقييم المنشور..."
                : "Shown below the published review..."
            }
            className="mt-2 min-h-24 w-full rounded-xs border border-neutral-300 bg-white px-3 py-2.5 text-sm font-normal leading-6 normal-case outline-none focus:border-[#0e7468] focus:ring-2 focus:ring-[#0e7468]/15"
          />
        </label>
        <label className="text-[10px] font-bold uppercase tracking-[.1em] text-neutral-700">
          {ar ? "ملاحظة داخلية" : "Private moderation note"}
          <textarea
            name="moderationNote"
            maxLength={1000}
            placeholder={
              ar
                ? "للفريق فقط، لا تظهر للعميل..."
                : "Staff only, never shown to customers..."
            }
            className="mt-2 min-h-24 w-full rounded-xs border border-neutral-300 bg-white px-3 py-2.5 text-sm font-normal leading-6 normal-case outline-none focus:border-[#0e7468] focus:ring-2 focus:ring-[#0e7468]/15"
          />
        </label>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-h-5">
          {state.message && (
            <p
              role="status"
              className={`flex items-center gap-2 text-xs font-semibold ${state.status === "success" ? "text-[#08705d]" : "text-[#963b26]"}`}
            >
              {state.status === "success" && (
                <Check size={15} aria-hidden="true" />
              )}
              {state.message}
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xs bg-[#073b36] px-5 text-[10px] font-bold uppercase tracking-[.12em] text-white hover:bg-[#0e7468] disabled:cursor-wait disabled:opacity-60"
        >
          {pending && (
            <LoaderCircle
              size={15}
              className="animate-spin"
              aria-hidden="true"
            />
          )}
          {pending
            ? ar
              ? "جارٍ الحفظ..."
              : "Saving..."
            : ar
              ? "حفظ القرار"
              : "Save decision"}
        </button>
      </div>
    </form>
  );
}
