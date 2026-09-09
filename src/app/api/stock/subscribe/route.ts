import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendEmail, renderBackInStockSubscription } from "@/features/notifications/email";
import { getSiteOrigin } from "@/features/auth/site-url";

const schema = z.object({
  productId: z.coerce.number().int().positive(),
  variantId: z.coerce.number().int().positive().optional(),
  email: z.string().trim().toLowerCase().email().max(254),
  locale: z.enum(["en", "ar"]),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Enter a valid email and product selection." }, { status: 400 });
  }
  const { productId, variantId, email, locale } = parsed.data;
  const admin = createAdminClient();
  const { data: product } = await admin.from("products").select("id, slug, status").eq("id", productId).eq("status", "active").maybeSingle();
  if (!product) return NextResponse.json({ message: "This product is no longer available." }, { status: 404 });
  if (variantId) {
    const { data: variant } = await admin.from("product_variants").select("id").eq("id", variantId).eq("product_id", productId).eq("is_active", true).maybeSingle();
    if (!variant) return NextResponse.json({ message: "That colour or size is no longer available." }, { status: 400 });
  }

  const server = await createClient();
  const { data: claims } = await server.auth.getClaims();
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const variantFilter = variantId ? admin.from("stock_subscriptions").select("id").eq("product_id", productId).eq("variant_id", variantId).ilike("email", email).eq("status", "active") : admin.from("stock_subscriptions").select("id").eq("product_id", productId).is("variant_id", null).ilike("email", email).eq("status", "active");
  const { data: existing } = await variantFilter.maybeSingle();
  const row = {
    user_id: claims?.claims?.sub ?? null,
    product_id: productId,
    variant_id: variantId ?? null,
    email,
    locale,
    status: "active" as const,
    unsubscribe_token_hash: tokenHash,
    notified_at: null,
  };
  const { error } = existing
    ? await admin.from("stock_subscriptions").update(row).eq("id", existing.id)
    : await admin.from("stock_subscriptions").insert(row);
  if (error) {
    console.error("[stock/subscribe] Save failed", error);
    return NextResponse.json({ message: locale === "ar" ? "تعذر حفظ التنبيه. حاول مرة أخرى." : "We could not save your alert. Please try again." }, { status: 500 });
  }

  await sendEmail(renderBackInStockSubscription({
    email,
    locale,
    productUrl: `${getSiteOrigin()}/${locale}/products/${product.slug}`,
    unsubscribeUrl: `${getSiteOrigin()}/api/stock/unsubscribe?token=${encodeURIComponent(rawToken)}`,
  }));
  return NextResponse.json({ message: locale === "ar" ? "تم حفظ التنبيه. سنراسلك عند توفر المنتج." : "Alert saved. We’ll email you when it is available." });
}
