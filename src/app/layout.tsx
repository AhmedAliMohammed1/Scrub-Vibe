import type { Metadata } from "next";
import { headers } from "next/headers";
import { getSiteOrigin } from "@/features/auth/site-url";
import { copy, isLocale } from "@/lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteOrigin()),
  title: {
    default: "Scrub Vibe Egypt — Premium medical scrubs",
    template: "%s — Scrub Vibe Egypt",
  },
  description:
    "Premium medical scrubs and lab coats made in Egypt for comfort, movement and a precise fit.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const requestedLocale = (await headers()).get("x-scrub-vibe-locale");
  const locale =
    requestedLocale && isLocale(requestedLocale) ? requestedLocale : "en";

  return (
    <html lang={locale} dir={copy[locale].dir} data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
