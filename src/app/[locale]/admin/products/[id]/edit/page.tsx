import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ProductEditForm,
  type ProductEditDetails,
} from "@/features/admin/product-edit-form";
import { isLocale, type Locale } from "@/lib/i18n";
import { requireRoles } from "@/server/auth/roles";

export const metadata: Metadata = {
  title: "Edit Product | Scrub Vibe Admin",
  robots: { index: false, follow: false },
};

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();

  const productId = Number(id);
  if (!Number.isInteger(productId) || productId <= 0) notFound();

  const { supabase } = await requireRoles([
    "product_manager",
    "admin",
    "super_admin",
  ]);

  const [
    { data: product, error: productError },
    { data: categoriesData, error: catError },
  ] = await Promise.all([
    supabase
      .from("products")
      .select(
        `
          id,
          slug,
          status,
          gender,
          material,
          fit,
          base_price_minor,
          compare_at_price_minor,
          cost_minor,
          cod_deposit_minor,
          category_id,
          product_translations(locale, title, description),
          product_images(id, storage_path, alt_en, alt_ar, position),
          product_options(
            id, code, name_en, name_ar, position,
            product_option_values(id, code, label_en, label_ar, swatch_hex, position)
          ),
          product_variants(
            id, sku, is_active,
            inventory(on_hand, reserved, low_stock_threshold)
          )
        `,
      )
      .eq("id", productId)
      .maybeSingle(),
    supabase
      .from("categories")
      .select("id, slug, category_translations(locale, name)")
      .order("position"),
  ]);

  if (productError || !product || catError) {
    notFound();
  }

  const categories = (categoriesData ?? []).map((cat) => ({
    id: cat.id,
    slug: cat.slug,
    name:
      cat.category_translations.find((item) => item.locale === locale)?.name ??
      cat.category_translations.find((item) => item.locale === "en")?.name ??
      cat.slug,
  }));

  const typedProduct = product as unknown as ProductEditDetails;

  return (
    <main className="min-h-screen bg-[#eef2ef] py-10 md:py-14">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 md:px-8">
        <ProductEditForm
          product={typedProduct}
          categories={categories}
          locale={locale as Locale}
        />
      </div>
    </main>
  );
}
