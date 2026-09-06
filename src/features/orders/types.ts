export type TrackedOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  phone: string;
  governorate: string;
  city: string;
  status: "awaiting_payment" | "payment_review" | "confirmed" | "processing" | "ready_to_ship" | "shipped" | "out_for_delivery" | "delivered" | "cancelled" | "returned";
  payment_status: "pending" | "proof_submitted" | "paid" | "rejected" | "failed" | "cod_due" | "cod_collected" | "refunded";
  payment_method: "cod" | "vodafone_cash" | "instapay" | "paymob";
  subtotal_minor: number;
  shipping_minor: number;
  discount_minor: number;
  total_minor: number;
  currency: "EGP";
  shipment_number: string | null;
  courier: string | null;
  tracking_url: string | null;
  created_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  order_items: {
    id: number; sku: string; title_en: string; title_ar: string; colour_en: string | null;
    colour_ar: string | null; size: string | null; image_url: string | null;
    unit_price_minor: number; quantity: number; line_total_minor: number;
  }[];
  order_status_history: {
    id: number; status: TrackedOrder["status"]; payment_status: TrackedOrder["payment_status"];
    note: string | null; created_at: string;
  }[];
};
