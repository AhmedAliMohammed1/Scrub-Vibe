import { notFound } from "next/navigation";
import { Header } from "@/components/store/header";
import { ShopProvider } from "@/components/store/cart-provider";
import { PageTracker } from "@/components/analytics/page-tracker";
import { copy, isLocale } from "@/lib/i18n";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <div dir={copy[locale].dir} lang={locale}>
      <ShopProvider>
        <PageTracker />
        <Header locale={locale} />
        {children}
      </ShopProvider>
    </div>
  );
}
