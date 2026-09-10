import { NextResponse } from "next/server";
import { processCommercialAutomation } from "@/features/commercial/automation";
import {
  getOperationsConfig,
  hasValidBearer,
} from "@/features/operations/config";
import { operationsLogger, requestId } from "@/lib/operations/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const started = Date.now();
  const id = requestId(request);
  if (!hasValidBearer(request, getOperationsConfig().cronSecret)) {
    operationsLogger.warn({
      event: "cron.commercial.rejected",
      requestId: id,
      durationMs: Date.now() - started,
      outcome: "unauthorized",
    });
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: { "X-Request-Id": id } },
    );
  }
  try {
    const result = await processCommercialAutomation();
    operationsLogger.info({
      event: "cron.commercial.completed",
      requestId: id,
      durationMs: Date.now() - started,
      outcome: "success",
    });
    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        ...result,
      },
      { headers: { "X-Request-Id": id } },
    );
  } catch {
    operationsLogger.error({
      event: "cron.commercial.failed",
      requestId: id,
      durationMs: Date.now() - started,
      errorCode: "COMMERCIAL_AUTOMATION_FAILED",
    });
    return NextResponse.json(
      {
        success: false,
        error: "internal_error",
        requestId: id,
      },
      { status: 500, headers: { "X-Request-Id": id } },
    );
  }
}
