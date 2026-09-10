import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const reviews = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260910195424_customer_product_reviews.sql",
  ),
  "utf8",
).toLowerCase();
const summaries = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260910200445_product_review_summary.sql",
  ),
  "utf8",
).toLowerCase();
const catalogueSummaries = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260910201201_product_review_catalog_summaries.sql",
  ),
  "utf8",
).toLowerCase();
const policyOptimization = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260910201532_optimize_product_review_policies.sql",
  ),
  "utf8",
).toLowerCase();

describe("product review database security", () => {
  it("enables RLS and exposes approved reviews without granting direct writes", () => {
    expect(reviews).toContain(
      "alter table public.product_reviews enable row level security",
    );
    expect(reviews).toContain(
      "alter table public.product_review_history enable row level security",
    );
    expect(reviews).toContain(
      "revoke all on public.product_reviews, public.product_review_history from anon, authenticated",
    );
    expect(reviews).toContain(
      "grant select on public.product_reviews to anon, authenticated",
    );
    expect(reviews).not.toMatch(
      /grant (insert|update|delete).*product_reviews.*authenticated/,
    );
    expect(reviews).toContain("product_reviews_public_approved_select");
    expect(reviews).not.toMatch(/auth\.role\s*\(/);
  });

  it("requires a delivered order owned by the caller and prevents duplicate reviews", () => {
    expect(reviews).toMatch(
      /create or replace function public\.submit_product_review[\s\S]*o\.user_id = v_user_id/,
    );
    expect(reviews).toContain(
      "o.status in ('delivered', 'partially_returned', 'returned')",
    );
    expect(reviews).toContain("unique (user_id, product_id)");
    expect(reviews).toContain("unique (order_item_id)");
    expect(reviews).toContain("review_purchase_required");
    expect(reviews).toContain("review_already_exists");
  });

  it("resets edited reviews to moderation and keeps private notes staff-only", () => {
    expect(reviews).toMatch(
      /create or replace function public\.update_product_review[\s\S]*status = 'pending'/,
    );
    expect(reviews).toContain("admin_response = null");
    expect(reviews).toContain("product_review_history_staff_select");
    expect(reviews).not.toContain("product_review_history_owner_select");
  });

  it("protects moderation with a role check and audit history", () => {
    expect(reviews).toMatch(
      /create or replace function public\.admin_moderate_product_review[\s\S]*private\.has_any_role/,
    );
    expect(reviews).toContain(
      "'content_editor','product_manager','admin','super_admin'",
    );
    expect(reviews).toContain("insert into public.product_review_history");
    expect(reviews).toContain("set search_path = ''");
  });

  it("uses invoker-safe public aggregates and role-protected admin metrics", () => {
    expect(summaries).toMatch(
      /create or replace function public\.get_product_review_summary[\s\S]*security invoker/,
    );
    expect(summaries).toContain(
      "where product_id = p_product_id and status = 'approved'",
    );
    expect(summaries).toMatch(
      /create or replace function public\.get_review_admin_summary[\s\S]*private\.has_any_role/,
    );
    expect(summaries).toContain(
      "revoke execute on function public.get_review_admin_summary() from public, anon",
    );
    expect(catalogueSummaries).toContain("with (security_invoker = true)");
    expect(catalogueSummaries).toContain("where status = 'approved'");
    expect(catalogueSummaries).toContain(
      "grant select on public.product_review_summaries to anon, authenticated",
    );
  });

  it("consolidates authenticated read policies and indexes moderation actors", () => {
    expect(policyOptimization).toContain("product_reviews_responded_by_idx");
    expect(policyOptimization).toContain(
      "drop policy if exists product_reviews_owner_select",
    );
    expect(policyOptimization).toContain(
      "create policy product_reviews_authenticated_select",
    );
    expect(policyOptimization).toContain("or (select auth.uid()) = user_id");
    expect(policyOptimization).toContain("to anon");
  });
});
