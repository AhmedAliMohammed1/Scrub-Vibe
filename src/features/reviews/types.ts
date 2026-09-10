import type { Tables } from "@/types/database";

export type ProductReview = Tables<"product_reviews">;
export type ReviewStatus = ProductReview["status"];
export type FitFeedback = "runs_small" | "true_to_size" | "runs_large";

export type ReviewSummary = {
  count: number;
  average: number;
  recommendPercentage: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  fit: Record<FitFeedback, number>;
};

export type ReviewablePurchase = {
  orderItemId: number;
  productId: number;
  title: { en: string; ar: string };
  imageUrl: string | null;
  size: string | null;
  colour: { en: string | null; ar: string | null };
  deliveredAt: string | null;
};

export type ProductReviewSnapshot = {
  reviews: ProductReview[];
  summary: ReviewSummary;
  totalReviews: number;
  currentPage: number;
  pageSize: number;
  viewer: {
    authenticated: boolean;
    ownReview: ProductReview | null;
    eligiblePurchase: ReviewablePurchase | null;
  };
};

export type CustomerReviewItem = {
  review: ProductReview;
  product: ReviewablePurchase & { slug: string };
};

export type CustomerReviewDashboard = {
  reviews: CustomerReviewItem[];
  awaitingReview: (ReviewablePurchase & { slug: string })[];
};

export type ReviewActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};
