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
});
