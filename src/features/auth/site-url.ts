import type { Locale } from "@/lib/i18n";

type SiteEnvironment = Record<string, string | undefined> & {
  NEXT_PUBLIC_APP_URL?: string;
  NEXT_PUBLIC_SITE_URL?: string;
  VERCEL_PROJECT_PRODUCTION_URL?: string;
  VERCEL_URL?: string;
};

export function getSiteOrigin(environment: SiteEnvironment = process.env) {
  const configured =
    environment.NEXT_PUBLIC_APP_URL ?? environment.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");

  const vercelHost =
    environment.VERCEL_PROJECT_PRODUCTION_URL ?? environment.VERCEL_URL;
  if (vercelHost) return `https://${vercelHost}`;

  return "http://localhost:3000";
}

export function getAuthCallbackUrl(locale: Locale, next: string) {
  const callback = new URL(`/${locale}/auth/confirm`, getSiteOrigin());
  callback.searchParams.set("next", next);
  return callback.toString();
}
