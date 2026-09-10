import { z } from "zod";

const fitFeedback = z
  .enum(["runs_small", "true_to_size", "runs_large"])
  .nullable();

const optionalTitle = z.preprocess((value) => {
  const title = String(value ?? "").trim();
  return title || null;
}, z.string().min(3).max(100).nullable());

const recommendation = z.preprocess(
  (value) => value === "on" || value === "true" || value === true,
  z.boolean(),
);

const nullableFit = z.preprocess((value) => {
  const fit = String(value ?? "").trim();
  return fit || null;
}, fitFeedback);

export const reviewSubmissionSchema = z.object({
  locale: z.enum(["en", "ar"]),
  orderItemId: z.coerce.number().int().positive().optional(),
  reviewId: z.string().uuid().optional(),
  productId: z.coerce.number().int().positive(),
  productSlug: z.string().trim().min(1).max(180),
  rating: z.coerce.number().int().min(1).max(5),
  title: optionalTitle,
  body: z.string().trim().min(20).max(1500),
  fitFeedback: nullableFit,
  wouldRecommend: recommendation,
});

export const reviewDeleteSchema = z.object({
  locale: z.enum(["en", "ar"]),
  reviewId: z.string().uuid(),
  productSlug: z.string().trim().min(1).max(180),
});

export const reviewModerationSchema = z.object({
  locale: z.enum(["en", "ar"]),
  reviewId: z.string().uuid(),
  status: z.enum(["pending", "approved", "rejected"]),
  isFeatured: recommendation,
  adminResponse: z.string().trim().max(1000),
  moderationNote: z.string().trim().max(1000),
});

export function reviewValues(formData: FormData) {
  return {
    locale: formData.get("locale"),
    orderItemId: formData.get("orderItemId") || undefined,
    reviewId: formData.get("reviewId") || undefined,
    productId: formData.get("productId"),
    productSlug: formData.get("productSlug"),
    rating: formData.get("rating"),
    title: formData.get("title"),
    body: formData.get("body"),
    fitFeedback: formData.get("fitFeedback"),
    wouldRecommend: formData.get("wouldRecommend"),
  };
}

export function formatReviewError(message: string, locale: "en" | "ar") {
  const ar = locale === "ar";
  const code = [
    "REVIEW_AUTH_REQUIRED",
    "REVIEW_PURCHASE_REQUIRED",
    "REVIEW_ALREADY_EXISTS",
    "REVIEW_NOT_FOUND",
    "REVIEW_MODERATION_FORBIDDEN",
  ] as const;
  const matchedCode = code.find((candidate) => message.includes(candidate));

  const messages = {
    REVIEW_AUTH_REQUIRED: ar
      ? "سجّل الدخول لإدارة تقييمك."
      : "Sign in to manage your review.",
    REVIEW_PURCHASE_REQUIRED: ar
      ? "يمكن تقييم المنتجات بعد استلام طلب موثّق فقط."
      : "You can review this product after a verified order is delivered.",
    REVIEW_ALREADY_EXISTS: ar
      ? "لقد قيّمت هذا المنتج بالفعل. يمكنك تعديل تقييمك الحالي."
      : "You already reviewed this product. You can edit your existing review.",
    REVIEW_NOT_FOUND: ar
      ? "لم نتمكن من العثور على هذا التقييم. حدّث الصفحة وحاول مرة أخرى."
      : "We could not find that review. Refresh the page and try again.",
    REVIEW_MODERATION_FORBIDDEN: ar
      ? "ليست لديك صلاحية مراجعة التقييمات."
      : "You do not have permission to moderate reviews.",
  } as const;

  return matchedCode
    ? messages[matchedCode]
    : ar
      ? "تعذر حفظ التقييم الآن. حاول مرة أخرى."
      : "We could not save the review. Please try again.";
}
