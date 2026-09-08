export interface CartRecoveryConfig {
  enabled: boolean;
  firstDelayHours: number;
  secondDelayHours: number;
  discountDelayHours: number;
  discountPercent: number;
  discountExpiryHours: number;
  batchSize: number;
  siteUrl: string;
}

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (["false", "0", "off", "no"].includes(normalized)) return false;
  if (["true", "1", "on", "yes"].includes(normalized)) return true;
  return defaultValue;
}

function parsePositiveNumber(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const num = Number(value.trim());
  return Number.isFinite(num) && num > 0 ? num : defaultValue;
}

export function getCartRecoveryConfig(): CartRecoveryConfig {
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    "https://scrubvibe.com"
  ).replace(/\/$/, "");

  const fullSiteUrl = siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`;

  return {
    enabled: parseBoolean(process.env.CART_RECOVERY_ENABLED, true),
    firstDelayHours: parsePositiveNumber(process.env.CART_RECOVERY_FIRST_DELAY_HOURS, 2),
    secondDelayHours: parsePositiveNumber(process.env.CART_RECOVERY_SECOND_DELAY_HOURS, 24),
    discountDelayHours: parsePositiveNumber(process.env.CART_RECOVERY_DISCOUNT_DELAY_HOURS, 48),
    discountPercent: parsePositiveNumber(process.env.CART_RECOVERY_DISCOUNT_PERCENT, 10),
    discountExpiryHours: parsePositiveNumber(process.env.CART_RECOVERY_DISCOUNT_EXPIRY_HOURS, 72),
    batchSize: parsePositiveNumber(process.env.CART_RECOVERY_BATCH_SIZE, 20),
    siteUrl: fullSiteUrl,
  };
}
