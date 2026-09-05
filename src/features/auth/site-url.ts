import type { Locale } from "@/lib/i18n";

export function getSiteOrigin() {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");

  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercelHost) return `https://${vercelHost}`;

  return "http://localhost:3000";
}

export function getAuthCallbackUrl(locale: Locale, next: string) {
  const callback = new URL(`/${locale}/auth/confirm`, getSiteOrigin());
  callback.searchParams.set("next", next);
  return callback.toString();
}
