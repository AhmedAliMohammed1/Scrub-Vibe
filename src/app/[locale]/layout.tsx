import { notFound } from "next/navigation";
import { Header } from "@/components/store/header";
import { ShopProvider } from "@/components/store/cart-provider";
import { PageTracker } from "@/components/analytics/page-tracker";
import { AnnouncementBar } from "@/features/cms/announcement-bar";
import { SiteFooter } from "@/components/store/site-footer";
import { copy, isLocale } from "@/lib/i18n";
import { getViewerAccess } from "@/server/auth/roles";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const viewer = await getViewerAccess();
  return (
    <div dir={copy[locale].dir} lang={locale}>
      <ShopProvider>
        <a className="skip-link" href="#main-content">
          {locale === "ar" ? "انتقل إلى المحتوى" : "Skip to content"}
        </a>
        <PageTracker />
        <AnnouncementBar locale={locale} />
        <Header locale={locale} viewer={viewer} />
        <div id="main-content">{children}</div>
        <SiteFooter locale={locale} viewer={viewer} />
      </ShopProvider>
    </div>
  );
}
