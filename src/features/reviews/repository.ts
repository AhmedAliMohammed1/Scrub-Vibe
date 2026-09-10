import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getPagination } from "@/lib/pagination";
import type {
  CustomerReviewDashboard,
  ProductReview,
  ProductReviewSnapshot,
  ReviewSummary,
  ReviewablePurchase,
} from "./types";

const emptySummary: ReviewSummary = {
  count: 0,
  average: 0,
  recommendPercentage: 0,
  distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  fit: { runs_small: 0, true_to_size: 0, runs_large: 0 },
};

type EligibleRow = {
  id: number;
  product_id: number | null;
  title_en: string;
  title_ar: string;
  image_url: string | null;
  size: string | null;
  colour_en: string | null;
  colour_ar: string | null;
  orders: { delivered_at: string | null } | { delivered_at: string | null }[];
};

function mapSummary(
  row:
    | {
        review_count: number;
        average_rating: number;
        recommend_percentage: number;
        five_star_count: number;
        four_star_count: number;
        three_star_count: number;
        two_star_count: number;
        one_star_count: number;
        runs_small_count: number;
        true_to_size_count: number;
        runs_large_count: number;
      }
    | undefined,
): ReviewSummary {
  if (!row) return emptySummary;
  return {
    count: Number(row.review_count),
    average: Number(row.average_rating),
    recommendPercentage: Number(row.recommend_percentage),
    distribution: {
      5: Number(row.five_star_count),
      4: Number(row.four_star_count),
      3: Number(row.three_star_count),
      2: Number(row.two_star_count),
      1: Number(row.one_star_count),
    },
    fit: {
      runs_small: Number(row.runs_small_count),
      true_to_size: Number(row.true_to_size_count),
      runs_large: Number(row.runs_large_count),
    },
  };
}

export async function getProductReviewSnapshot(
  productId: number,
  requestedPage: number,
  pageSize = 5,
): Promise<ProductReviewSnapshot> {
  const supabase = await createClient();
  const [
    { data: summaryRows, error: summaryError },
    countResult,
    claimsResult,
  ] = await Promise.all([
    supabase.rpc("get_product_review_summary", { p_product_id: productId }),
    supabase
      .from("product_reviews")
      .select("id", { count: "exact", head: true })
      .eq("product_id", productId)
      .eq("status", "approved"),
    supabase.auth.getClaims(),
  ]);
  if (summaryError || countResult.error)
    throw new Error("Reviews could not be loaded.");

  const pagination = getPagination(
    countResult.count ?? 0,
    requestedPage,
    pageSize,
  );
  const { data: reviewRows, error: reviewsError } = await supabase
    .from("product_reviews")
    .select("*")
    .eq("product_id", productId)
    .eq("status", "approved")
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false })
    .range(pagination.from, pagination.to);
  if (reviewsError) throw new Error("Reviews could not be loaded.");

  const userId = claimsResult.data?.claims?.sub;
  let ownReview: ProductReview | null = null;
  let eligiblePurchase: ReviewablePurchase | null = null;
  if (userId) {
    const [{ data: own }, { data: purchases, error: purchaseError }] =
      await Promise.all([
        supabase
          .from("product_reviews")
          .select("*")
          .eq("product_id", productId)
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("order_items")
          .select(
            "id, product_id, title_en, title_ar, image_url, size, colour_en, colour_ar, orders!inner(delivered_at, user_id, status)",
          )
          .eq("product_id", productId)
          .eq("orders.user_id", userId)
          .in("orders.status", ["delivered", "partially_returned", "returned"])
          .order("created_at", { ascending: false })
          .limit(1),
      ]);
    if (purchaseError)
      throw new Error("Review eligibility could not be checked.");
    ownReview = own ?? null;
    const purchase = (purchases?.[0] ?? null) as EligibleRow | null;
    if (purchase && purchase.product_id) {
      const order = Array.isArray(purchase.orders)
        ? purchase.orders[0]
        : purchase.orders;
      eligiblePurchase = {
        orderItemId: purchase.id,
        productId: purchase.product_id,
        title: { en: purchase.title_en, ar: purchase.title_ar },
        imageUrl: purchase.image_url,
        size: purchase.size,
        colour: { en: purchase.colour_en, ar: purchase.colour_ar },
        deliveredAt: order?.delivered_at ?? null,
      };
    }
  }

  return {
    reviews: reviewRows ?? [],
    summary: mapSummary(summaryRows?.[0]),
    totalReviews: pagination.totalItems,
    currentPage: pagination.currentPage,
    pageSize,
    viewer: {
      authenticated: Boolean(userId),
      ownReview,
      eligiblePurchase: ownReview ? null : eligiblePurchase,
    },
  };
}

export async function getCustomerReviewDashboard(
  userId: string,
): Promise<CustomerReviewDashboard> {
  const supabase = await createClient();
  const [reviewResult, purchaseResult] = await Promise.all([
    supabase
      .from("product_reviews")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false }),
    supabase
      .from("order_items")
      .select(
        "id, product_id, title_en, title_ar, image_url, size, colour_en, colour_ar, orders!inner(delivered_at, user_id, status)",
      )
      .eq("orders.user_id", userId)
      .in("orders.status", ["delivered", "partially_returned", "returned"])
      .not("product_id", "is", null)
      .order("created_at", { ascending: false }),
  ]);
  if (reviewResult.error || purchaseResult.error) {
    throw new Error("Your reviews could not be loaded.");
  }

  const purchases = (purchaseResult.data ?? []) as EligibleRow[];
  const productIds = [
    ...new Set(
      purchases
        .map((item) => item.product_id)
        .filter((id): id is number => id !== null),
    ),
  ];
  const productResult = productIds.length
    ? await supabase.from("products").select("id, slug").in("id", productIds)
    : { data: [], error: null };
  if (productResult.error)
    throw new Error("Review products could not be loaded.");

  const slugByProduct = new Map(
    (productResult.data ?? []).map((product) => [product.id, product.slug]),
  );
  const purchaseByOrderItem = new Map(purchases.map((item) => [item.id, item]));
  const reviewedProducts = new Set(
    (reviewResult.data ?? []).map((review) => review.product_id),
  );

  function mapPurchase(purchase: EligibleRow) {
    if (!purchase.product_id) return null;
    const slug = slugByProduct.get(purchase.product_id);
    if (!slug) return null;
    const order = Array.isArray(purchase.orders)
      ? purchase.orders[0]
      : purchase.orders;
    return {
      orderItemId: purchase.id,
      productId: purchase.product_id,
      slug,
      title: { en: purchase.title_en, ar: purchase.title_ar },
      imageUrl: purchase.image_url,
      size: purchase.size,
      colour: { en: purchase.colour_en, ar: purchase.colour_ar },
      deliveredAt: order?.delivered_at ?? null,
    };
  }

  const reviews = (reviewResult.data ?? []).flatMap((review) => {
    const purchase = purchaseByOrderItem.get(review.order_item_id);
    const product = purchase ? mapPurchase(purchase) : null;
    return product ? [{ review, product }] : [];
  });

  const seenAwaiting = new Set<number>();
  const awaitingReview = purchases.flatMap((purchase) => {
    if (
      !purchase.product_id ||
      reviewedProducts.has(purchase.product_id) ||
      seenAwaiting.has(purchase.product_id)
    ) {
      return [];
    }
    const product = mapPurchase(purchase);
    if (!product) return [];
    seenAwaiting.add(purchase.product_id);
    return [product];
  });

  return { reviews, awaitingReview };
}
