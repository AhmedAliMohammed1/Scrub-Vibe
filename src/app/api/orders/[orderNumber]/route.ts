import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { hashToken } from "@/features/checkout/security";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function equalHash(left: string, right: string) {
  const a = Buffer.from(left, "hex");
  const b = Buffer.from(right, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request, context: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await context.params;
  const admin = createAdminClient();
  const { data: order, error } = await admin
    .from("orders")
    .select(`
      id, order_number, user_id, tracking_token_hash, customer_name, phone,
      governorate, city, status, payment_status, payment_method, subtotal_minor,
      shipping_minor, discount_minor, total_minor, currency, shipment_number,
      courier, tracking_url, created_at, paid_at, shipped_at, delivered_at,
      order_items(id, sku, title_en, title_ar, colour_en, colour_ar, size, image_url, unit_price_minor, quantity, line_total_minor),
      order_status_history(id, status, payment_status, note, created_at)
    `)
    .eq("order_number", orderNumber.toUpperCase())
    .maybeSingle();
  if (error || !order) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const ownsOrder = Boolean(claims?.claims?.sub && claims.claims.sub === order.user_id);
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const validToken = token.length >= 32 && equalHash(hashToken(token), order.tracking_token_hash);
  if (!ownsOrder && !validToken) return NextResponse.json({ error: "tracking_token_required" }, { status: 401 });

  return NextResponse.json({
    ...order,
    tracking_token_hash: undefined,
    user_id: undefined,
    order_status_history: order.order_status_history.toSorted(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    ),
  }, { headers: { "Cache-Control": "private, no-store" } });
}
