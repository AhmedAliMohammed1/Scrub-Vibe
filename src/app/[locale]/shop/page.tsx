import { notFound } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { ProductCard } from "@/components/store/product-card";
import { catalog } from "@/lib/catalog";
import { isLocale } from "@/lib/i18n";

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { category } = await searchParams;
  const all = await catalog.featured();
  const products =
    category && ["men", "women"].includes(category)
      ? all.filter((p) => p.category === category)
      : all;
  return (
    <main className="mx-auto max-w-[1600px] px-5 py-14 md:px-10">
      <p className="eyebrow text-[#a6432b]">NOVA COLLECTION</p>
      <div className="mt-3 flex items-end justify-between border-b border-black/15 pb-8">
        <div>
          <h1 className="font-serif text-5xl capitalize md:text-7xl">
            {category ?? (locale === "ar" ? "تسوق الكل" : "Shop all")}
          </h1>
          <p className="mt-4 text-xs text-neutral-500">
            {products.length} {locale === "ar" ? "قطع" : "pieces"}
          </p>
        </div>
        <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.15em]">
          <SlidersHorizontal size={15} />
          {locale === "ar" ? "تصفية وترتيب" : "Filter & sort"}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-12 py-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} locale={locale} />
        ))}
      </div>
    </main>
  );
}
