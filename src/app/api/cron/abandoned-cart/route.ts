import { NextResponse } from "next/server";
import { processAbandonedCarts } from "@/features/cart-recovery/engine";
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
      event: "cron.cart_recovery.rejected",
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
    const summary = await processAbandonedCarts();
    operationsLogger.info({
      event: "cron.cart_recovery.completed",
      requestId: id,
      durationMs: Date.now() - started,
      outcome: "success",
    });
    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        ...summary,
      },
      { headers: { "X-Request-Id": id } },
    );
  } catch {
    operationsLogger.error({
      event: "cron.cart_recovery.failed",
      requestId: id,
      durationMs: Date.now() - started,
      errorCode: "CART_RECOVERY_FAILED",
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
