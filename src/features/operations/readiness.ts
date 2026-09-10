import "server-only";

import { coreReadiness } from "@/features/operations/config";
import { createAdminClient } from "@/lib/supabase/admin";

export type ReadinessCheck = {
  status: "pass" | "fail" | "warn";
  latencyMs?: number;
  message?: string;
};

export type ReadinessReport = {
  status: "ready" | "degraded" | "unavailable";
  checkedAt: string;
  checks: Record<string, ReadinessCheck>;
};

export async function getReadinessReport(): Promise<ReadinessReport> {
  const configuration = coreReadiness();
  const checks: Record<string, ReadinessCheck> = {
    configuration: configuration.configured
      ? { status: "pass" }
      : { status: "fail", message: "Required server configuration is missing" },
  };

  if (!configuration.configured) {
    return {
      status: "unavailable",
      checkedAt: new Date().toISOString(),
      checks,
    };
  }

  const started = Date.now();
  try {
    const { error } = await createAdminClient()
      .from("products")
      .select("id", { count: "exact", head: true });
    if (error) throw error;
    checks.database = { status: "pass", latencyMs: Date.now() - started };
  } catch {
    checks.database = {
      status: "fail",
      latencyMs: Date.now() - started,
      message: "Database connectivity check failed",
    };
  }

  const optional = [
    ["email", Boolean(process.env.RESEND_API_KEY)],
    ["staffAlerts", Boolean(process.env.STAFF_EMAIL)],
    ["cron", Boolean(process.env.CRON_SECRET)],
  ] as const;
  for (const [name, configured] of optional) {
    checks[name] = configured
      ? { status: "pass" }
      : {
          status: "warn",
          message: "Optional production capability is not configured",
        };
  }

  const failed = Object.values(checks).some((check) => check.status === "fail");
  const warned = Object.values(checks).some((check) => check.status === "warn");
  return {
    status: failed ? "unavailable" : warned ? "degraded" : "ready",
    checkedAt: new Date().toISOString(),
    checks,
  };
}
