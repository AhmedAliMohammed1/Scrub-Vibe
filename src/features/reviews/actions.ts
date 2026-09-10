"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ReviewActionState } from "./types";
import {
  formatReviewError,
  reviewDeleteSchema,
  reviewModerationSchema,
  reviewSubmissionSchema,
  reviewValues,
} from "./validation";

const initialError = (
  locale: "en" | "ar",
  fieldErrors: Record<string, string[]>,
) => ({
  status: "error" as const,
  message:
    locale === "ar"
      ? "راجع الحقول المحددة وأكمل البيانات المطلوبة."
      : "Check the highlighted fields and complete the required details.",
  fieldErrors,
});

function refreshReviewPaths(locale: "en" | "ar", slug: string) {
  revalidatePath(`/${locale}/products/${slug}`);
  revalidatePath(`/${locale}/account/reviews`);
  revalidatePath(`/${locale}/admin/reviews`);
}

export async function saveReviewAction(
  _state: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const locale = formData.get("locale") === "ar" ? "ar" : "en";
  const parsed = reviewSubmissionSchema.safeParse(reviewValues(formData));
  if (!parsed.success)
    return initialError(locale, parsed.error.flatten().fieldErrors);

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) {
    return {
      status: "error",
      message: formatReviewError("REVIEW_AUTH_REQUIRED", locale),
    };
  }

  const values = {
    p_rating: parsed.data.rating,
    p_title: parsed.data.title ?? "",
    p_body: parsed.data.body,
    p_fit_feedback: parsed.data.fitFeedback ?? "",
    p_would_recommend: parsed.data.wouldRecommend,
    p_locale: parsed.data.locale,
  };
  const result = parsed.data.reviewId
    ? await supabase.rpc("update_product_review", {
        ...values,
        // Generated RPC argument types do not express nullable SQL parameters.
        p_fit_feedback: parsed.data.fitFeedback as string,
        p_review_id: parsed.data.reviewId,
      })
    : parsed.data.orderItemId
      ? await supabase.rpc("submit_product_review", {
          ...values,
          p_fit_feedback: parsed.data.fitFeedback as string,
          p_order_item_id: parsed.data.orderItemId,
        })
      : { error: new Error("REVIEW_PURCHASE_REQUIRED") };

  if (result.error) {
    return {
      status: "error",
      message: formatReviewError(result.error.message, locale),
    };
  }

  refreshReviewPaths(parsed.data.locale, parsed.data.productSlug);
  return {
    status: "success",
    message:
      parsed.data.locale === "ar"
        ? "تم حفظ تقييمك وإرساله للمراجعة. شكراً لمشاركتك."
        : "Your review was saved and sent for moderation. Thank you for sharing.",
  };
}

export async function deleteReviewAction(
  _state: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const locale = formData.get("locale") === "ar" ? "ar" : "en";
  const parsed = reviewDeleteSchema.safeParse({
    locale: formData.get("locale"),
    reviewId: formData.get("reviewId"),
    productSlug: formData.get("productSlug"),
  });
  if (!parsed.success)
    return initialError(locale, parsed.error.flatten().fieldErrors);

  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_product_review", {
    p_review_id: parsed.data.reviewId,
  });
  if (error)
    return {
      status: "error",
      message: formatReviewError(error.message, locale),
    };

  refreshReviewPaths(parsed.data.locale, parsed.data.productSlug);
  return {
    status: "success",
    message: locale === "ar" ? "تم حذف تقييمك." : "Your review was deleted.",
  };
}

export async function moderateReviewAction(
  _state: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const locale = formData.get("locale") === "ar" ? "ar" : "en";
  const parsed = reviewModerationSchema.safeParse({
    locale: formData.get("locale"),
    reviewId: formData.get("reviewId"),
    status: formData.get("status"),
    isFeatured: formData.get("isFeatured"),
    adminResponse: formData.get("adminResponse") ?? "",
    moderationNote: formData.get("moderationNote") ?? "",
  });
  if (!parsed.success)
    return initialError(locale, parsed.error.flatten().fieldErrors);

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_moderate_product_review", {
    p_review_id: parsed.data.reviewId,
    p_status: parsed.data.status,
    p_is_featured: parsed.data.status === "approved" && parsed.data.isFeatured,
    p_admin_response: parsed.data.adminResponse,
    p_moderation_note: parsed.data.moderationNote,
  });
  if (error)
    return {
      status: "error",
      message: formatReviewError(error.message, locale),
    };

  revalidatePath(`/${parsed.data.locale}/admin/reviews`);
  revalidatePath(`/${parsed.data.locale}/products`, "layout");
  return {
    status: "success",
    message: locale === "ar" ? "تم تحديث التقييم." : "Review updated.",
  };
}
