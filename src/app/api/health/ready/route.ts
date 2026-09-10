import { NextResponse } from "next/server";
import {
  getOperationsConfig,
  hasValidBearer,
} from "@/features/operations/config";
import { getReadinessReport } from "@/features/operations/readiness";
import { operationsLogger, requestId } from "@/lib/operations/logger";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const started = Date.now();
  const id = requestId(request);
  const report = await getReadinessReport();
  const detailed = hasValidBearer(
    request,
    getOperationsConfig().operationsSecret,
  );
  operationsLogger.info({
    event: "readiness.checked",
    requestId: id,
    route: "/api/health/ready",
    durationMs: Date.now() - started,
    outcome: report.status,
  });
  return NextResponse.json(
    detailed ? report : { status: report.status, checkedAt: report.checkedAt },
    {
      status: report.status === "unavailable" ? 503 : 200,
      headers: { "Cache-Control": "no-store", "X-Request-Id": id },
    },
  );
}
