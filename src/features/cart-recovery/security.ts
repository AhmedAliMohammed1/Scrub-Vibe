import { createHmac, timingSafeEqual } from "node:crypto";

function getUnsubscribeSecret(): string {
  return (
    process.env.CRON_SECRET ??
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "scrub-vibe-cart-recovery-secret-salt"
  );
}

export function createUnsubscribeToken(userId: string): string {
  const secret = getUnsubscribeSecret();
  const signature = createHmac("sha256", secret)
    .update(`cart_recovery_opt_out:${userId}`)
    .digest("hex");
  const encodedId = Buffer.from(userId, "utf8").toString("base64url");
  return `${encodedId}.${signature}`;
}

export function verifyUnsubscribeToken(token: string): string | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [encodedId, signature] = parts;
  if (!encodedId || !signature) return null;

  let userId: string;
  try {
    userId = Buffer.from(encodedId, "base64url").toString("utf8");
    if (!userId || userId.length < 10) return null;
  } catch {
    return null;
  }

  const secret = getUnsubscribeSecret();
  const expectedSignature = createHmac("sha256", secret)
    .update(`cart_recovery_opt_out:${userId}`)
    .digest("hex");

  try {
    const signatureBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    if (signatureBuffer.length !== expectedBuffer.length) return null;
    if (!timingSafeEqual(signatureBuffer, expectedBuffer)) return null;
    return userId;
  } catch {
    return null;
  }
}
