import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260829191320_foundation_identity_catalogue.sql",
  ),
  "utf8",
);

const inventoryPolicyOptimization = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260829194305_optimize_inventory_select_policy.sql",
  ),
  "utf8",
);

const catalogueSeed = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260905154310_seed_initial_catalogue.sql",
  ),
  "utf8",
);

const scrubVibeCatalogue = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260905230532_rebrand_scrub_vibe_catalogue.sql",
  ),
  "utf8",
);

const adminAnalytics = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260906043757_admin_catalogue_analytics.sql",
  ),
  "utf8",
);

const multiColourVariants = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260906092933_multi_colour_variants.sql",
  ),
  "utf8",
);

const checkoutOrders = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260906100228_checkout_orders.sql",
  ),
  "utf8",
);

const paymentHardening = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260907212403_harden_payment_processing.sql",
  ),
  "utf8",
);

const shippingZones = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260907220250_shipping_zone_pricing.sql",
  ),
  "utf8",
).toLowerCase();

const customerCartWishlist = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260908023000_customer_cart_wishlist.sql",
  ),
  "utf8",
);

const idempotentCartSync = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260908073000_idempotent_cart_sync.sql",
  ),
  "utf8",
);

const discountCampaigns = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260908022202_discount_campaigns.sql",
  ),
  "utf8",
).toLowerCase();

const discountIndexes = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260908024439_optimize_discount_foreign_keys.sql",
  ),
  "utf8",
).toLowerCase();

const customerAddresses = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260908064000_customer_addresses.sql",
  ),
  "utf8",
);

const cmsBanners = readFileSync(
  resolve(process.cwd(), "supabase/migrations/20260908104000_cms_banners.sql"),
  "utf8",
);

const abandonedCartRecovery = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260908200000_abandoned_cart_recovery.sql",
  ),
  "utf8",
);

const abandonedCartFunctions = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260908203000_cart_recovery_functions.sql",
  ),
  "utf8",
);

const commercialGrowth = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260909115338_commercial_growth_suite.sql",
  ),
  "utf8",
).toLowerCase();

const commercialReturnGuardrails = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260909121458_commercial_return_guardrails.sql",
  ),
  "utf8",
).toLowerCase();

const returnReviewPermissions = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260910011740_fix_return_review_permissions.sql",
  ),
  "utf8",
).toLowerCase();

const partialReturnStatuses = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260910021400_add_partial_return_statuses.sql",
  ),
  "utf8",
).toLowerCase();

const completeReturnWorkflow = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260910021429_complete_return_workflow.sql",
  ),
  "utf8",
).toLowerCase();

const hardenedReturnWorkflow = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260910052930_harden_return_workflow_rpc.sql",
  ),
  "utf8",
).toLowerCase();

describe("foundation migration security", () => {
  it("enables RLS on every public table it creates", () => {
    const tables = [
      ...migration.matchAll(/create table public\.([a-z_]+)/g),
    ].map(([, table]) => table);
    const secured = new Set(
      [
        ...migration.matchAll(
          /alter table public\.([a-z_]+) enable row level security/g,
        ),
      ].map(([, table]) => table),
    );
    expect(tables).not.toHaveLength(0);
    expect(tables.filter((table) => !secured.has(table))).toEqual([]);
  });

  it("revokes broad client grants and avoids deprecated role checks", () => {
    expect(migration).toContain(
      "revoke all on all tables in schema public from anon, authenticated",
    );
    expect(migration).not.toMatch(/auth\.role\s*\(/);
    expect(migration).not.toMatch(/raw_user_meta_data[^;]*(role|permission)/i);
  });

  it("keeps privileged helpers private and limits execution", () => {
    expect(migration).toContain("create schema if not exists private");
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = ''");
    expect(migration).toContain(
      "revoke execute on function private.has_any_role(public.app_role[]) from public, anon",
    );
  });

  it("keeps anonymous and authenticated inventory reads role-disjoint", () => {
    expect(inventoryPolicyOptimization).toContain(
      "drop policy inventory_public_read on public.inventory",
    );
    expect(inventoryPolicyOptimization).toContain(
      "drop policy inventory_staff_select on public.inventory",
    );
    expect(inventoryPolicyOptimization).toMatch(
      /create policy inventory_public_read[\s\S]*to anon/,
    );
    expect(inventoryPolicyOptimization).toMatch(
      /create policy inventory_authenticated_read[\s\S]*to authenticated/,
    );
  });

  it("seeds localized products without hardcoding generated identities", () => {
    expect(catalogueSeed).toContain('"slug": "linen-ease-shirt"');
    expect(catalogueSeed).toContain('"slug": "soft-structure-vest"');
    expect(catalogueSeed).toContain("public.product_translations");
    expect(catalogueSeed).toContain("public.product_variants");
    expect(catalogueSeed).toContain("public.inventory");
    expect(catalogueSeed).toMatch(
      /insert into public\.products \(\s*category_id,[\s\S]*?\) values \(\s*v_category_id,/,
    );
    expect(catalogueSeed).toMatch(
      /insert into public\.inventory \(\s*variant_id,[\s\S]*?\) values \(\s*v_variant_id,/,
    );
    expect(catalogueSeed).toMatch(/returning id into v_product_id/);
    expect(catalogueSeed).not.toMatch(/overriding system value/i);
  });

  it("replaces demo fashion with the localized Scrub Vibe catalogue", () => {
    expect(scrubVibeCatalogue).toContain('"slug": "female-design-2-scrub-set"');
    expect(scrubVibeCatalogue).toContain('"slug": "male-design-1-scrub-set"');
    expect(scrubVibeCatalogue).toContain('"slug": "classic-medical-lab-coat"');
    expect(scrubVibeCatalogue).toContain("public.product_images");
    expect(scrubVibeCatalogue).toMatch(/returning id into v_product_id/);
    expect(scrubVibeCatalogue).not.toMatch(/overriding system value/i);
  });

  it("protects analytics and subscriber data behind staff RLS", () => {
    expect(adminAnalytics).toContain(
      "alter table public.analytics_events enable row level security",
    );
    expect(adminAnalytics).toContain(
      "alter table public.newsletter_subscribers enable row level security",
    );
    expect(adminAnalytics).toContain(
      "revoke all on public.analytics_events from anon, authenticated",
    );
    expect(adminAnalytics).toContain(
      "revoke all on public.newsletter_subscribers from anon, authenticated",
    );
    expect(adminAnalytics).not.toMatch(/auth\.role\s*\(/);
  });

  it("limits privileged public functions and validates their callers", () => {
    expect(adminAnalytics).toMatch(
      /create or replace function public\.track_store_event[\s\S]*security definer[\s\S]*set search_path = ''/,
    );
    expect(adminAnalytics).toContain(
      "revoke execute on function public.track_store_event",
    );
    expect(adminAnalytics).toMatch(
      /create or replace function public\.admin_create_product[\s\S]*security invoker/,
    );
    expect(adminAnalytics).toContain(
      "private.has_any_role(array['product_manager','admin','super_admin']",
    );
  });

  it("keeps catalogue creation and stock adjustments transactional", () => {
    expect(adminAnalytics).toContain(
      "create or replace function public.admin_create_product",
    );
    expect(adminAnalytics).toContain(
      "create or replace function public.admin_adjust_inventory",
    );
    expect(adminAnalytics).toContain("for update;");
    expect(adminAnalytics).toContain("'Opening stock', auth.uid()");
  });

  it("creates colour-size variants through an authorized invoker function", () => {
    expect(multiColourVariants).toMatch(
      /create or replace function public\.admin_create_product_with_colours[\s\S]*security invoker/,
    );
    expect(multiColourVariants).toContain("jsonb_array_elements(p_colours)");
    expect(multiColourVariants).toContain(
      "private.has_any_role(array['product_manager','admin','super_admin']",
    );
    expect(multiColourVariants).toContain(
      "revoke execute on function public.admin_create_product_with_colours",
    );
  });

  it("protects checkout, order and payment-proof data with RLS", () => {
    const tables = [
      ...checkoutOrders.matchAll(/create table public\.([a-z_]+)/g),
    ].map(([, table]) => table);
    const secured = new Set(
      [
        ...checkoutOrders.matchAll(
          /alter table public\.([a-z_]+) enable row level security/g,
        ),
      ].map(([, table]) => table),
    );
    expect(tables.filter((table) => !secured.has(table))).toEqual([]);
    expect(checkoutOrders).toContain(
      "'payment-proofs', 'payment-proofs', false",
    );
    expect(checkoutOrders).toContain(
      "grant execute on function public.create_verified_order",
    );
    expect(checkoutOrders).toContain("to service_role");
    expect(checkoutOrders).not.toMatch(/auth\.role\s*\(/);
  });

  it("creates orders and reserves stock in one locked transaction", () => {
    expect(checkoutOrders).toMatch(
      /create or replace function public\.create_verified_order[\s\S]*for update/,
    );
    expect(checkoutOrders).toContain(
      "coalesce(pv.price_override_minor, p.base_price_minor)",
    );
    expect(checkoutOrders).toContain("reserved = reserved + v_quantity");
    expect(checkoutOrders).toContain("PHONE_VERIFICATION_INVALID");
  });

  it("deduplicates Paymob callbacks and keeps their audit data staff-only", () => {
    expect(paymentHardening).toContain(
      "alter table public.payment_webhook_events enable row level security",
    );
    expect(paymentHardening).toContain("unique (provider, provider_event_id)");
    expect(paymentHardening).toContain(
      "on conflict (provider, provider_event_id) do nothing",
    );
    expect(paymentHardening).toContain(
      "revoke execute on function public.process_paymob_callback",
    );
    expect(paymentHardening).toContain("to service_role");
    expect(paymentHardening).not.toMatch(/auth\.role\s*\(/);
  });

  it("makes manual proof decisions authoritative and role-restricted", () => {
    expect(paymentHardening).toContain("PROOF_REVIEW_FORBIDDEN");
    expect(paymentHardening).toContain("PROOF_APPROVAL_REQUIRED");
    expect(paymentHardening).toContain("PAYMOB_WEBHOOK_REQUIRED");
    expect(paymentHardening).toContain(
      "when v_previous.payment_method = 'cod' then 'cod_due'",
    );
  });

  it("protects delivery configuration and prices shipping in the order transaction", () => {
    for (const table of [
      "shipping_zones",
      "shipping_governorates",
      "shipping_cities",
    ]) {
      expect(shippingZones).toContain(
        `alter table public.${table} enable row level security`,
      );
    }
    expect(shippingZones).not.toMatch(/auth\.role\s*\(/);
    expect(shippingZones).toContain("shipping_zones_admin_update");
    expect(shippingZones).toContain("shipping_area_unavailable");
    expect(shippingZones).toContain("cod_unavailable_for_zone");
    expect(shippingZones).toContain(
      "v_shipping := v_shipping_base - v_shipping_discount + v_cod_surcharge",
    );
    expect(shippingZones).toContain("shipping_zone_name_en");
    expect(shippingZones).toContain("shipping_city_name_ar");
  });

  it("protects customer cart and wishlist tables with owner-restricted RLS", () => {
    for (const table of ["cart_items", "wishlist_items"]) {
      expect(customerCartWishlist).toContain(
        `alter table public.${table} enable row level security;`,
      );
    }
    expect(customerCartWishlist).not.toMatch(/auth\.role\s*\(/);
    expect(customerCartWishlist).toContain(
      "revoke all on public.cart_items, public.wishlist_items from anon, authenticated;",
    );
    expect(customerCartWishlist).toContain(
      "create policy cart_items_owner_select",
    );
    expect(customerCartWishlist).toContain(
      "create policy wishlist_items_owner_select",
    );
    expect(customerCartWishlist).toContain("auth.uid() = user_id");
    expect(customerCartWishlist).toMatch(
      /create or replace function public\.sync_customer_cart_and_wishlist[\s\S]*security invoker[\s\S]*set search_path = ''/,
    );
    expect(customerCartWishlist).toContain(
      "grant execute on function public.sync_customer_cart_and_wishlist",
    );
    expect(idempotentCartSync).toContain(
      "create or replace function public.sync_customer_cart_and_wishlist",
    );
    expect(idempotentCartSync).toContain("security invoker");
    expect(idempotentCartSync).toContain("set search_path = ''");
    expect(idempotentCartSync).toContain(
      "greatest(public.cart_items.quantity, excluded.quantity)",
    );
  });

  it("protects discount management and redeems codes transactionally", () => {
    for (const table of [
      "discount_campaigns",
      "discount_codes",
      "discount_redemptions",
    ]) {
      expect(discountCampaigns).toContain(
        `alter table public.${table} enable row level security`,
      );
    }
    expect(discountCampaigns).toContain("discount_campaigns_admin_all");
    expect(discountCampaigns).toContain("discount_codes_admin_all");
    expect(discountCampaigns).toContain("discount_redemptions_staff_select");
    expect(discountCampaigns).not.toMatch(/auth\.role\s*\(/);
    expect(discountCampaigns).toMatch(
      /create or replace function public\.create_promotional_order[\s\S]*for update/,
    );
    expect(discountCampaigns).toContain("discount_customer_limit_reached");
    expect(discountCampaigns).toContain("discount_campaign_budget_exhausted");
    expect(discountCampaigns).toContain(
      "grant execute on function public.create_promotional_order",
    );
    expect(discountCampaigns).toContain("to service_role");
    expect(discountIndexes).toContain("orders_discount_code_created_idx");
    expect(discountIndexes).toContain("orders_discount_campaign_created_idx");
  });

  it("secures customer delivery addresses with owner-scoped RLS and secure triggers", () => {
    expect(customerAddresses).toContain(
      "alter table public.customer_addresses enable row level security;",
    );
    expect(customerAddresses).toContain(
      "revoke all on public.customer_addresses from anon, authenticated;",
    );
    expect(customerAddresses).toContain(
      "grant select, insert, update, delete on public.customer_addresses to authenticated;",
    );
    expect(customerAddresses).toContain(
      "create policy customer_addresses_owner_select",
    );
    expect(customerAddresses).toContain(
      "create policy customer_addresses_owner_insert",
    );
    expect(customerAddresses).toContain(
      "create policy customer_addresses_owner_update",
    );
    expect(customerAddresses).toContain(
      "create policy customer_addresses_owner_delete",
    );
    expect(customerAddresses).toContain("auth.uid() = user_id");
    expect(customerAddresses).not.toMatch(/auth\.role\s*\(/);
    expect(customerAddresses).toMatch(
      /create or replace function public\.handle_customer_address_defaults[\s\S]*security definer[\s\S]*set search_path = ''/,
    );
    expect(customerAddresses).toMatch(
      /create or replace function public\.handle_customer_address_delete[\s\S]*security definer[\s\S]*set search_path = ''/,
    );
  });

  it("secures cms banners and storage assets with role-based policies", () => {
    expect(cmsBanners).toContain(
      "alter table public.cms_banners enable row level security;",
    );
    expect(cmsBanners).toContain(
      "revoke all on public.cms_banners from anon, authenticated;",
    );
    expect(cmsBanners).toContain(
      "grant select on public.cms_banners to anon, authenticated;",
    );
    expect(cmsBanners).toContain(
      "grant insert, update, delete on public.cms_banners to authenticated;",
    );
    expect(cmsBanners).toContain("create policy cms_banners_public_read");
    expect(cmsBanners).toContain("create policy cms_banners_admin_read_all");
    expect(cmsBanners).toContain("create policy cms_banners_admin_manage");
    expect(cmsBanners).toContain(
      "private.has_any_role(array['admin','super_admin']::public.app_role[])",
    );
    expect(cmsBanners).toContain("insert into storage.buckets");
    expect(cmsBanners).toContain("'banners'");
    expect(cmsBanners).toContain("create policy banners_public_read");
    expect(cmsBanners).toContain("create policy banners_admin_insert");
    expect(cmsBanners).not.toMatch(/auth\.role\s*\(/);
  });

  it("secures abandoned cart recovery table and RPC functions", () => {
    expect(abandonedCartRecovery).toContain("alter table public.profiles");
    expect(abandonedCartRecovery).toContain(
      "add column if not exists cart_recovery_opt_out boolean not null default false;",
    );
    expect(abandonedCartRecovery).toContain(
      "alter table public.abandoned_cart_notifications enable row level security;",
    );
    expect(abandonedCartRecovery).toContain(
      "revoke all on public.abandoned_cart_notifications from anon, authenticated;",
    );
    expect(abandonedCartRecovery).toContain(
      "grant select on public.abandoned_cart_notifications to authenticated;",
    );
    expect(abandonedCartRecovery).toContain(
      "create policy abandoned_cart_notifications_staff_select",
    );
    expect(abandonedCartRecovery).toContain(
      "private.has_any_role(array['analyst','support','admin','super_admin']::public.app_role[])",
    );
    expect(abandonedCartFunctions).toContain(
      "create or replace function public.find_abandoned_cart_candidates",
    );
    expect(abandonedCartFunctions).toMatch(
      /create or replace function public\.find_abandoned_cart_candidates[\s\S]*security definer[\s\S]*set search_path = ''/,
    );
    expect(abandonedCartFunctions).toContain(
      "grant execute on function public.find_abandoned_cart_candidates(text, integer, integer) to service_role;",
    );
    expect(abandonedCartFunctions).toContain(
      "revoke execute on function public.find_abandoned_cart_candidates(text, integer, integer) from public, anon, authenticated;",
    );
    expect(abandonedCartRecovery).not.toMatch(/auth\.role\s*\(/);
    expect(abandonedCartFunctions).not.toMatch(/auth\.role\s*\(/);
  });

  it("secures the commercial growth tables and private return evidence", () => {
    const tables = [
      "product_bundles",
      "product_bundle_items",
      "product_recommendations",
      "stock_subscriptions",
      "inventory_alerts",
      "return_requests",
      "return_request_items",
      "return_status_history",
    ];
    for (const table of tables) {
      expect(commercialGrowth).toContain(
        `alter table public.${table} enable row level security`,
      );
    }
    expect(commercialGrowth).toContain(
      "'return-evidence', 'return-evidence', false",
    );
    expect(commercialGrowth).not.toMatch(/auth\.role\s*\(/);
    expect(commercialGrowth).toContain("(select auth.uid()) = user_id");
  });

  it("indexes foreign keys and prevents duplicate return cases", () => {
    expect(commercialGrowth).toContain("product_bundle_items_product_idx");
    expect(commercialGrowth).toContain(
      "stock_subscriptions_active_variant_idx",
    );
    expect(commercialGrowth).toContain("return_request_items_order_item_idx");
    expect(commercialGrowth).toContain("return_status_history_actor_idx");
    expect(commercialReturnGuardrails).toContain(
      "create unique index return_requests_one_per_order_idx",
    );
  });

  it("allows staff return reviews without granting customers broad writes", () => {
    expect(returnReviewPermissions).toContain(
      "grant update (\n  status,\n  resolution,\n  staff_note,",
    );
    expect(returnReviewPermissions).toContain(
      ") on public.return_requests to authenticated;",
    );
    expect(returnReviewPermissions).not.toContain(
      "grant update on public.return_requests to authenticated",
    );
    expect(returnReviewPermissions).toContain(
      "create policy return_requests_staff_update",
    );
    expect(returnReviewPermissions).toMatch(
      /return_requests_staff_update[\s\S]*for update[\s\S]*using \([\s\S]*has_any_role[\s\S]*with check \([\s\S]*has_any_role/,
    );
    expect(returnReviewPermissions).toContain(
      "grant insert (\n  return_request_id,\n  status,\n  note,\n  actor_id\n) on public.return_status_history to authenticated;",
    );
    expect(returnReviewPermissions).toContain(
      "create policy return_status_history_staff_insert",
    );
    expect(returnReviewPermissions).toContain("actor_id = (select auth.uid())");
    expect(returnReviewPermissions).toContain(
      "array['support','warehouse','admin','super_admin']::public.app_role[]",
    );
  });

  it("models partial returns and refunds explicitly", () => {
    expect(partialReturnStatuses).toContain(
      "add value if not exists 'partially_returned'",
    );
    expect(partialReturnStatuses).toContain(
      "add value if not exists 'partially_refunded'",
    );
  });

  it("keeps return completion atomic, role-scoped, and auditable", () => {
    expect(completeReturnWorkflow).toContain(
      "create or replace function public.admin_update_return",
    );
    expect(completeReturnWorkflow).toContain("security invoker");
    expect(completeReturnWorkflow).not.toContain("security definer");
    expect(completeReturnWorkflow).toContain("invalid_return_transition");
    expect(completeReturnWorkflow).toContain("return_completion_forbidden");
    expect(completeReturnWorkflow).toContain("refund_reference_required");
    expect(completeReturnWorkflow).toContain("partially_refunded");
    expect(completeReturnWorkflow).toContain("partially_returned");
    expect(completeReturnWorkflow).toContain(
      "perform public.admin_update_order",
    );
    expect(completeReturnWorkflow).toContain(
      "insert into public.inventory_movements",
    );
    expect(completeReturnWorkflow).toContain(
      "revoke execute on function public.admin_update_return",
    );
  });

  it("stores private notes in a customer-inaccessible RLS table", () => {
    expect(completeReturnWorkflow).toContain(
      "alter table public.return_internal_notes enable row level security",
    );
    expect(completeReturnWorkflow).toContain(
      "revoke all on public.return_internal_notes from anon, authenticated",
    );
    expect(completeReturnWorkflow).toContain(
      "create policy return_internal_notes_staff_select",
    );
    expect(completeReturnWorkflow).not.toMatch(
      /return_internal_notes_customer_select/,
    );
  });

  it("moves privileged return writes behind a private implementation", () => {
    expect(hardenedReturnWorkflow).toContain(
      "set schema private",
    );
    expect(hardenedReturnWorkflow).toContain(
      "alter function private.admin_update_return",
    );
    expect(hardenedReturnWorkflow).toContain("security definer");
    expect(hardenedReturnWorkflow).toContain(
      "create function public.admin_update_return",
    );
    expect(hardenedReturnWorkflow).toContain("security invoker");
    expect(hardenedReturnWorkflow).toContain(
      "revoke update (",
    );
    expect(hardenedReturnWorkflow).toContain(
      "drop policy if exists return_internal_notes_staff_insert",
    );
    expect(hardenedReturnWorkflow).toContain(
      "return_requests_completed_refund_check",
    );
  });
});
