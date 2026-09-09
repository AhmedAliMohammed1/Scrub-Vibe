import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n";
import { requireRoles } from "@/server/auth/roles";
import {
  archiveBundleAction,
  removeRecommendationAction,
  saveBundleAction,
  saveRecommendationAction,
  updateReturnAction,
} from "@/features/commercial/admin-actions";

const field =
  "mt-1.5 h-11 w-full border border-black/15 bg-white px-3 text-sm";

export default async function CommercialPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const [{ locale }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const { supabase } = await requireRoles([
    "support",
    "warehouse",
    "content_editor",
    "product_manager",
    "analyst",
    "admin",
    "super_admin",
  ]);
  const [productsResult, bundlesResult, recommendationsResult] =
    await Promise.all([
      supabase
        .from("products")
        .select("id, slug, status, product_translations(locale, title)")
        .order("id"),
      supabase
        .from("product_bundles")
        .select(
          "id, slug, title_en, title_ar, description_en, description_ar, status, position, product_bundle_items(product_id)",
        )
        .order("position"),
      supabase
        .from("product_recommendations")
        .select("product_id, related_product_id, kind, is_active")
        .eq("is_active", true)
        .order("position"),
    ]);
  const products = productsResult.data ?? [];
  const bundles = bundlesResult.data ?? [];
  const recommendations = recommendationsResult.data ?? [];
  const ar = locale === "ar";
  const productName = (id: number) => {
    const product = products.find((row) => row.id === id);
    return (
      product?.product_translations.find(
        (translation) => translation.locale === locale,
      )?.title ??
      product?.slug ??
      `#${id}`
    );
  };

  return (
    <main className="mx-auto max-w-[1500px] px-4 py-10 md:px-8">
      <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#0e7468]">
        {locale === "ar" ? "النمو التجاري" : "COMMERCIAL GROWTH"}
      </p>
      <h1 className="mt-2 font-serif text-4xl">
        {locale === "ar"
          ? "المبيعات وخدمة ما بعد البيع"
          : "Merchandising & after-sales"}
      </h1>
      {(query.success || query.error) && (
        <p
          className={`mt-5 border p-3 text-sm ${
            query.error
              ? "border-red-300 bg-red-50 text-red-800"
              : "border-emerald-300 bg-emerald-50 text-emerald-800"
          }`}
        >
          {query.success ?? query.error}
        </p>
      )}
    </main>
  );
}
