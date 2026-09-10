import { timingSafeEqual } from "node:crypto";

type Environment = Record<string, string | undefined>;

function positiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function getOperationsConfig(environment: Environment = process.env) {
  return {
    proofReviewHours: positiveInteger(
      environment.OPERATIONS_PROOF_REVIEW_HOURS,
      12,
    ),
    paymentReviewHours: positiveInteger(
      environment.OPERATIONS_PAYMENT_REVIEW_HOURS,
      24,
    ),
    webhookLookbackHours: positiveInteger(
      environment.OPERATIONS_WEBHOOK_LOOKBACK_HOURS,
      24,
    ),
    operationsSecret: environment.OPERATIONS_SECRET?.trim() ?? "",
    cronSecret: environment.CRON_SECRET?.trim() ?? "",
  };
}

export function hasValidBearer(request: Request, secret: string) {
  if (!secret) return false;
  const supplied = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const suppliedBuffer = Buffer.from(supplied);
  const expectedBuffer = Buffer.from(expected);
  return (
    suppliedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(suppliedBuffer, expectedBuffer)
  );
}

export function coreReadiness(environment: Environment = process.env) {
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  ];
  const hasServerKey = Boolean(
    environment.SUPABASE_SECRET_KEY || environment.SUPABASE_SERVICE_ROLE_KEY,
  );
  const missing = required.filter((key) => !environment[key]);
  if (!hasServerKey) missing.push("SUPABASE_SERVER_KEY");
  return { configured: missing.length === 0, missing };
}
