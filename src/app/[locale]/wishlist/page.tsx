import { notFound } from "next/navigation";
import { WishlistView } from "@/components/store/wishlist-view";
import { catalog } from "@/lib/catalog";
import { isLocale } from "@/lib/i18n";
import { parsePage } from "@/lib/pagination";

export default async function WishlistPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();

  const products = await catalog.featured();

  return (
    <WishlistView
      products={products}
      locale={locale}
      initialPage={parsePage(query.page)}
    />
  );
}
