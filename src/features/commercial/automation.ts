import "server-only";

import { getSiteOrigin } from "@/features/auth/site-url";
import { renderBackInStock, sendEmail, sendStaffEmail } from "@/features/notifications/email";
import { catalog } from "@/lib/catalog";
import { createAdminClient } from "@/lib/supabase/admin";

export async function processCommercialAutomation() {
  const admin = createAdminClient();
  const [{ data: inventoryRows, error: inventoryError }, { data: subscriptionRows, error: subscriptionError }, { data: openAlerts }] = await Promise.all([
    admin.from("inventory").select("variant_id, on_hand, reserved, low_stock_threshold, product_variants(product_id, sku)"),
    admin.from("stock_subscriptions").select("id, email, locale, product_id, variant_id").eq("status", "active").order("created_at").limit(500),
    admin.from("inventory_alerts").select("id, variant_id, last_notified_at").eq("status", "open"),
  ]);
  if (inventoryError) throw new Error(`Inventory scan failed: ${inventoryError.message}`);
  if (subscriptionError) throw new Error(`Subscription scan failed: ${subscriptionError.message}`);

  const inventory = (inventoryRows ?? []).map((row) => ({
    ...row,
    available: Math.max(0, row.on_hand - row.reserved),
    productId: row.product_variants?.product_id,
    sku: row.product_variants?.sku ?? `variant-${row.variant_id}`,
  }));
  const availableVariants = new Set(inventory.filter((row) => row.available > 0).map((row) => row.variant_id));
  const availableProducts = new Set(inventory.filter((row) => row.available > 0).map((row) => row.productId));
  const products = await catalog.featured();
  const byId = new Map(products.map((product) => [Number(product.id), product]));
  let notified = 0;
  for (const subscription of subscriptionRows ?? []) {
    const isAvailable = subscription.variant_id ? availableVariants.has(subscription.variant_id) : availableProducts.has(subscription.product_id);
    const product = byId.get(subscription.product_id);
    if (!isAvailable || !product) continue;
    const locale = subscription.locale === "ar" ? "ar" : "en";
    try {
      await sendEmail(renderBackInStock({ email: subscription.email, locale, productName: product.title[locale], productUrl: `${getSiteOrigin()}/${locale}/products/${product.slug}` }));
      await admin.from("stock_subscriptions").update({ status: "notified", notified_at: new Date().toISOString() }).eq("id", subscription.id).eq("status", "active");
      notified += 1;
    } catch (error) {
      console.error("[commercial/stock-notification] Email failed", subscription.id, error);
    }
  }

  const now = new Date().toISOString();
  const lowRows = inventory.filter((row) => row.available <= row.low_stock_threshold);
  const lowIds = new Set(lowRows.map((row) => row.variant_id));
  const openByVariant = new Map((openAlerts ?? []).map((alert) => [alert.variant_id, alert]));
  const newLowRows = lowRows.filter((row) => !openByVariant.has(row.variant_id));
  for (const row of lowRows) {
    const existing = openByVariant.get(row.variant_id);
    if (existing) {
      await admin.from("inventory_alerts").update({ available_quantity: row.available, threshold: row.low_stock_threshold, last_detected_at: now }).eq("id", existing.id);
    } else {
      await admin.from("inventory_alerts").insert({ variant_id: row.variant_id, available_quantity: row.available, threshold: row.low_stock_threshold, last_detected_at: now, last_notified_at: now });
    }
  }
  const resolvedIds = (openAlerts ?? []).filter((alert) => !lowIds.has(alert.variant_id)).map((alert) => alert.id);
  if (resolvedIds.length) await admin.from("inventory_alerts").update({ status: "resolved", resolved_at: now }).in("id", resolvedIds);
  if (newLowRows.length) {
    const lines = newLowRows.map((row) => `<li><strong>${row.sku}</strong>: ${row.available} available (threshold ${row.low_stock_threshold})</li>`).join("");
    await sendStaffEmail(`[Scrub Vibe] ${newLowRows.length} new low-stock alert${newLowRows.length === 1 ? "" : "s"}`, `<p>These variants need attention:</p><ul>${lines}</ul>`);
  }
  return { subscriptionsScanned: subscriptionRows?.length ?? 0, customersNotified: notified, lowStockVariants: lowRows.length, newLowStockAlerts: newLowRows.length, resolvedAlerts: resolvedIds.length };
}
