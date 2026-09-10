import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ReviewStars } from "@/features/reviews/review-stars";
import {
  formatReviewError,
  reviewModerationSchema,
  reviewSubmissionSchema,
} from "@/features/reviews/validation";

afterEach(cleanup);

describe("customer product reviews", () => {
  it("validates a complete verified-purchase review payload", () => {
    const result = reviewSubmissionSchema.safeParse({
      locale: "en",
      orderItemId: "42",
      productId: "9",
      productSlug: "design-9-scrub-set",
      rating: "5",
      title: "Perfect for long shifts",
      body: "The fabric stays comfortable and the fit remained excellent all day.",
      fitFeedback: "true_to_size",
      wouldRecommend: "on",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.orderItemId).toBe(42);
      expect(result.data.rating).toBe(5);
      expect(result.data.wouldRecommend).toBe(true);
    }
  });

  it("rejects invalid ratings, short reviews and unknown fit values", () => {
    const result = reviewSubmissionSchema.safeParse({
      locale: "en",
      orderItemId: "42",
      productId: "9",
      productSlug: "design-9-scrub-set",
      rating: "6",
      title: "Ok",
      body: "Too short",
      fitFeedback: "oversized",
      wouldRecommend: "on",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors).toMatchObject({
        rating: expect.any(Array),
        title: expect.any(Array),
        body: expect.any(Array),
        fitFeedback: expect.any(Array),
      });
    }
  });

  it("prevents featuring a review from bypassing the moderation schema", () => {
    const result = reviewModerationSchema.safeParse({
      locale: "en",
      reviewId: "not-a-uuid",
      status: "published",
      isFeatured: "on",
      adminResponse: "Thanks!",
      moderationNote: "",
    });
    expect(result.success).toBe(false);
  });

  it("localizes actionable database errors", () => {
    expect(formatReviewError("REVIEW_PURCHASE_REQUIRED", "en")).toContain(
      "delivered",
    );
    expect(formatReviewError("REVIEW_ALREADY_EXISTS", "ar")).toContain(
      "بالفعل",
    );
  });

  it("renders an accessible five-star summary", () => {
    render(<ReviewStars rating={4} label="4 out of 5" />);
    expect(screen.getByRole("img", { name: "4 out of 5" })).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "4 out of 5" }).querySelectorAll("svg"),
    ).toHaveLength(5);
  });

  it("keeps customer and admin review pages responsive and paginated", () => {
    const root = resolve(__dirname, "../..");
    const customer = readFileSync(
      resolve(root, "src/features/reviews/product-reviews-section.tsx"),
      "utf8",
    );
    const admin = readFileSync(
      resolve(root, "src/app/[locale]/admin/reviews/page.tsx"),
      "utf8",
    );
    const card = readFileSync(
      resolve(root, "src/components/store/product-card.tsx"),
      "utf8",
    );

    expect(customer).toContain("lg:grid-cols-[.72fr_1.28fr]");
    expect(customer).toContain('pageParam="reviewPage"');
    expect(customer).toContain('anchor="reviews"');
    expect(admin).toContain("const PAGE_SIZE = 10");
    expect(admin).toContain("<PaginationNav");
    expect(admin).toContain("sm:grid-cols-2");
    expect(card).toContain("product.rating.average.toFixed(1)");
    expect(card).toContain("#reviews");
  });
});
