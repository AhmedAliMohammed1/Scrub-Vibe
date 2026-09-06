import "server-only";

import { createHash, randomBytes } from "node:crypto";

export function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function issuePrivateToken() {
  return randomBytes(32).toString("base64url");
}

export function requestIpHash(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ?? "unknown";
  return hashToken(`${ip}:${process.env.OTP_RATE_LIMIT_SALT ?? process.env.SUPABASE_SECRET_KEY ?? "scrub-vibe"}`);
}
