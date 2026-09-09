import { getSiteOrigin } from "@/features/auth/site-url";
import { catalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

function xml(value: string | number) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const origin = getSiteOrigin();
  const products = await catalog.featured();
  const items = products.flatMap((product) =>
    product.colors.flatMap((colour) =>
      Object.entries(colour.allVariants).map(([size, variantId]) => {
        const available = (colour.stockBySize[size] ?? 0) > 0;
        const regularPrice = product.compareAt ?? product.price;
        const salePrice = product.compareAt
          ? `<g:sale_price>${(product.price / 100).toFixed(2)} EGP</g:sale_price>`
          : "";
        const link = `${origin}/en/products/${product.slug}?colour=${encodeURIComponent(colour.code)}&size=${encodeURIComponent(size)}`;
        const image = new URL(product.image.src, origin).toString();
        const gender =
          product.category === "women"
            ? "female"
            : product.category === "men"
              ? "male"
              : "unisex";
        return [
          "<item>",
          `<g:id>${xml(variantId)}</g:id>`,
          `<g:item_group_id>${xml(product.id)}</g:item_group_id>`,
          `<title>${xml(`${product.title.en} - ${colour.name.en} ${size}`)}</title>`,
          `<description>${xml(product.description.en)}</description>`,
          `<link>${xml(link)}</link>`,
          `<g:image_link>${xml(image)}</g:image_link>`,
          `<g:availability>${available ? "in_stock" : "out_of_stock"}</g:availability>`,
          `<g:price>${(regularPrice / 100).toFixed(2)} EGP</g:price>`,
          salePrice,
          "<g:condition>new</g:condition>",
          "<g:brand>Scrub Vibe</g:brand>",
          `<g:color>${xml(colour.name.en)}</g:color>`,
          `<g:size>${xml(size)}</g:size>`,
          `<g:gender>${gender}</g:gender>`,
          "<g:age_group>adult</g:age_group>",
          "<g:identifier_exists>false</g:identifier_exists>",
          "</item>",
        ].join("");
      }),
    ),
  );
  const body = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><title>Scrub Vibe Egypt</title><link>${xml(origin)}</link><description>Premium medical scrubs and lab coats in Egypt</description>${items.join("")}</channel></rss>`;
  return new Response(body, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
