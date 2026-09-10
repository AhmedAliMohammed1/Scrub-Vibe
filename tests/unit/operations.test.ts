import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  coreReadiness,
  getOperationsConfig,
  hasValidBearer,
} from "@/features/operations/config";
import { GET as liveness } from "@/app/api/health/live/route";

describe("production operations", () => {
  it("uses safe escalation thresholds and accepts valid overrides", () => {
    expect(getOperationsConfig({})).toMatchObject({
      proofReviewHours: 12,
      paymentReviewHours: 24,
      webhookLookbackHours: 24,
    });
    expect(
      getOperationsConfig({
        OPERATIONS_PROOF_REVIEW_HOURS: "6",
        OPERATIONS_PAYMENT_REVIEW_HOURS: "bad",
      }),
    ).toMatchObject({ proofReviewHours: 6, paymentReviewHours: 24 });
  });

  it("fails bearer authentication closed when the secret is absent", () => {
    const request = new Request("https://example.com", {
      headers: { authorization: "Bearer anything" },
    });
    expect(hasValidBearer(request, "")).toBe(false);
    expect(hasValidBearer(request, "correct")).toBe(false);
    expect(
      hasValidBearer(
        new Request("https://example.com", {
          headers: { authorization: "Bearer correct" },
        }),
        "correct",
      ),
    ).toBe(true);
  });

  it("requires both public Supabase settings and a server key", () => {
    expect(coreReadiness({}).configured).toBe(false);
    expect(
      coreReadiness({
        NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable",
        SUPABASE_SECRET_KEY: "secret",
      }),
    ).toEqual({ configured: true, missing: [] });
  });

  it("exposes a dependency-free no-store liveness response", async () => {
    const response = liveness();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toMatchObject({ status: "alive" });
  });

  it("keeps every scheduled route behind the fail-closed bearer helper", () => {
    for (const route of ["commercial", "abandoned-cart"]) {
      const source = readFileSync(
        resolve(`src/app/api/cron/${route}/route.ts`),
        "utf8",
      );
      expect(source).toContain("hasValidBearer");
      expect(source).toContain("cronSecret");
      expect(source).not.toMatch(/if\s*\(\s*(cronSecret|secret)\s*\)/);
      expect(source).toContain('error: "internal_error"');
      expect(source).not.toContain("error instanceof Error");
      expect(source).toContain('"X-Request-Id": id');
    }
  });

  it("prevents restore drills from targeting the production project", () => {
    const source = readFileSync(
      resolve("scripts/operations/restore-drill.ps1"),
      "utf8",
    );
    expect(source).toContain('productionProjectRef = "iqufqtjotgpmhhtvlxwf"');
    expect(source).toContain(
      "Restore drills are forbidden against the production project",
    );
  });

  it("hardens trigger execution, foreign keys, and owner RLS policies", () => {
    const migration = readFileSync(
      resolve(
        "supabase/migrations/20260910215258_production_operations_hardening.sql",
      ),
      "utf8",
    );
    expect(migration).toContain(
      "revoke execute on function public.handle_cms_banner_updated_at() from public, anon, authenticated",
    );
    expect(migration.match(/create index if not exists/g)).toHaveLength(3);
    expect(migration).toContain("using ((select auth.uid()) = user_id)");
    expect(migration).not.toMatch(/using \(auth\.uid\(\) = user_id\)/);
  });

  it("verifies backup files and detects tampering", async () => {
    const directory = await mkdtemp(resolve(tmpdir(), "scrub-vibe-backup-"));
    try {
      const manifestFiles = [];
      for (const file of ["roles.sql", "schema.sql", "data.sql"]) {
        const contents = Buffer.from(`-- ${file}\n`);
        await writeFile(resolve(directory, file), contents);
        manifestFiles.push({
          path: file,
          bytes: contents.length,
          sha256: createHash("sha256").update(contents).digest("hex"),
        });
      }
      await writeFile(
        resolve(directory, "manifest.json"),
        JSON.stringify({ projectRef: "test", files: manifestFiles }),
      );
      const verifier = resolve("scripts/operations/verify-backup.mjs");
      expect(() =>
        execFileSync(process.execPath, [verifier, directory]),
      ).not.toThrow();

      await writeFile(resolve(directory, "data.sql"), "tampered");
      expect(
        spawnSync(process.execPath, [verifier, directory], {
          encoding: "utf8",
        }).status,
      ).not.toBe(0);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
