import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import type { CheckoutOrderInput } from "./validation";

type PaymobOrder = {
  orderNumber: string;
  totalMinor: number;
  items: { name: string; amountMinor: number; quantity: number }[];
  checkout: CheckoutOrderInput;
};

export function hasPaymobConfiguration() {
  return Boolean(
    process.env.PAYMOB_SECRET_KEY &&
    process.env.PAYMOB_PUBLIC_KEY &&
    process.env.PAYMOB_INTEGRATION_ID,
  );
}

export async function createPaymobIntention(input: PaymobOrder) {
  const secretKey = process.env.PAYMOB_SECRET_KEY;
  const publicKey = process.env.PAYMOB_PUBLIC_KEY;
  const integrationIds = (process.env.PAYMOB_INTEGRATION_ID ?? "")
    .split(",")
    .map((value) => Number(value.trim()))
    .filter(Number.isInteger);
  if (!secretKey || !publicKey || !integrationIds.length) throw new Error("PAYMOB_NOT_CONFIGURED");

  const names = input.checkout.customerName.trim().split(/\s+/);
  const firstName = names[0] ?? "Customer";
  const lastName = names.slice(1).join(" ") || firstName;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!appUrl) throw new Error("APP_URL_NOT_CONFIGURED");

  const response = await fetch("https://accept.paymob.com/v1/intention/", {
    method: "POST",
    headers: {
      Authorization: `Token ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: input.totalMinor,
      currency: "EGP",
      payment_methods: integrationIds,
      items: input.items.map((item) => ({
        name: item.name,
        amount: item.amountMinor,
        description: `Scrub Vibe ${input.orderNumber}`,
        quantity: item.quantity,
      })),
      billing_data: {
        apartment: input.checkout.apartment || "NA",
        first_name: firstName,
        last_name: lastName,
        street: input.checkout.streetAddress,
        building: input.checkout.building || "NA",
        phone_number: input.checkout.phone,
        country: "EG",
        email: input.checkout.email || "orders@scrubvibe.store",
        floor: input.checkout.floor || "NA",
        state: input.checkout.governorate,
      },
      special_reference: input.orderNumber,
      notification_url: `${appUrl}/api/payments/paymob/webhook`,
      redirection_url: `${appUrl}/${input.checkout.locale}/track/${input.orderNumber}?payment=returned`,
    }),
    cache: "no-store",
  });
  const data = await response.json() as {
    id?: string;
    intention_order_id?: string | number;
    client_secret?: string;
    detail?: string;
  };
  if (!response.ok || !data.client_secret) throw new Error(data.detail ?? "PAYMOB_INTENTION_FAILED");
  return {
    intentionId: String(data.id ?? ""),
    orderId: data.intention_order_id ? String(data.intention_order_id) : null,
    checkoutUrl: `https://accept.paymob.com/unifiedcheckout/?publicKey=${encodeURIComponent(publicKey)}&clientSecret=${encodeURIComponent(data.client_secret)}`,
  };
}

const hmacKeys = [
  "amount_cents", "created_at", "currency", "error_occured",
  "has_parent_transaction", "id", "integration_id", "is_3d_secure",
  "is_auth", "is_capture", "is_refunded", "is_standalone_payment",
  "is_voided", "order.id", "owner", "pending", "source_data.pan",
  "source_data.sub_type", "source_data.type", "success",
] as const;

function nestedValue(value: Record<string, unknown>, path: string) {
  return path.split(".").reduce<unknown>((current, key) =>
    current && typeof current === "object" ? (current as Record<string, unknown>)[key] : "", value);
}

export function verifyPaymobHmac(payload: Record<string, unknown>, received: string) {
  const secret = process.env.PAYMOB_HMAC_SECRET;
  if (!secret || !/^[a-f0-9]{128}$/i.test(received)) return false;
  const value = hmacKeys.map((key) => String(nestedValue(payload, key) ?? "")).join("");
  const expected = createHmac("sha512", secret).update(value).digest("hex");
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(received, "hex"));
}
