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
});
