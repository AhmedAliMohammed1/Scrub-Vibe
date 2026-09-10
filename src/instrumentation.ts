import type { Instrumentation } from "next";
import { operationsLogger } from "@/lib/operations/logger";

export function register() {
  operationsLogger.info({
    event: "runtime.started",
    metadata: { runtime: process.env.NEXT_RUNTIME ?? "unknown" },
  });
}

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  const digest =
    typeof error === "object" && error !== null && "digest" in error
      ? String(error.digest)
      : undefined;
  operationsLogger.error({
    event: "request.failed",
    route: context.routePath,
    errorCode: digest ?? "UNHANDLED_SERVER_ERROR",
    metadata: {
      method: request.method,
      path: request.path.split("?")[0],
      routeType: context.routeType,
    },
  });
};
