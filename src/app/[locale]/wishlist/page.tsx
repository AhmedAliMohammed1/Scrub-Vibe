import { notFound } from "next/navigation";
import { WishlistView } from "@/components/store/wishlist-view";
import { catalog } from "@/lib/catalog";
import { isLocale } from "@/lib/i18n";

export default async function WishlistPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const products = await catalog.featured();

  return <WishlistView products={products} locale={locale} />;
}
