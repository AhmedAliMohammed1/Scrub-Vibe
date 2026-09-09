import { NextResponse } from "next/server";
import { requireRoles } from "@/server/auth/roles";

type ExportRow = Record<string, unknown>;

function csvCell(value: unknown) {
  let text = value === null || value === undefined ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function toCsv(rows: ExportRow[]) {
  if (!rows.length) return "No records\r\n";
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  return [headers.map(csvCell).join(","), ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(","))].join("\r\n");
}

export async function GET(_request: Request, { params }: { params: Promise<{ report: string }> }) {
  const { report } = await params;
  const allowed = ["orders", "customers", "products", "inventory", "returns", "campaigns"];
  if (!allowed.includes(report)) return NextResponse.json({ error: "unknown_report" }, { status: 404 });
  const { supabase } = await requireRoles(["analyst", "admin", "super_admin"]);
  let rows: ExportRow[] = [];
  let errorMessage: string | null = null;
  if (report === "orders") {
    const { data, error } = await supabase.from("orders").select("order_number, created_at, status, payment_status, payment_method, customer_name, email, phone, governorate, city, subtotal_minor, discount_minor, shipping_minor, total_minor, discount_code, courier, shipment_number").order("created_at", { ascending: false });
    rows = (data ?? []) as ExportRow[]; errorMessage = error?.message ?? null;
  } else if (report === "customers") {
    const { data, error } = await supabase.from("profiles").select("id, email, full_name, phone, preferred_locale, created_at, updated_at").order("created_at", { ascending: false });
    rows = (data ?? []) as ExportRow[]; errorMessage = error?.message ?? null;
  } else if (report === "products") {
    const { data, error } = await supabase.from("products").select("id, slug, brand, status, gender, base_price_minor, compare_at_price_minor, cod_deposit_minor, cost_minor, published_at, created_at").order("id");
    rows = (data ?? []) as ExportRow[]; errorMessage = error?.message ?? null;
  } else if (report === "inventory") {
    const { data, error } = await supabase.from("inventory").select("variant_id, on_hand, reserved, low_stock_threshold, updated_at, product_variants(sku, product_id)").order("variant_id");
    rows = (data ?? []).map((row) => ({ ...row, available: row.on_hand - row.reserved })) as ExportRow[]; errorMessage = error?.message ?? null;
  } else if (report === "returns") {
    const { data, error } = await supabase.from("return_requests").select("return_number, requested_at, request_type, status, resolution, reason_code, customer_note, staff_note, order_id, user_id").order("requested_at", { ascending: false });
    rows = (data ?? []) as ExportRow[]; errorMessage = error?.message ?? null;
  } else {
    const { data, error } = await supabase.from("discount_campaigns").select("id, name_en, name_ar, is_active, starts_on, ends_on, channel, budget_minor, created_at").order("created_at", { ascending: false });
    rows = (data ?? []) as ExportRow[]; errorMessage = error?.message ?? null;
  }
  if (errorMessage) return NextResponse.json({ error: errorMessage }, { status: 500 });
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(`\uFEFF${toCsv(rows)}`, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="scrub-vibe-${report}-${stamp}.csv"`, "cache-control": "private, no-store" } });
}
