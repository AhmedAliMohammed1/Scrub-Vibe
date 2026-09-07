import { createHmac, timingSafeEqual } from "node:crypto";

const hmacKeys = [
  "amount_cents", "created_at", "currency", "error_occured",
  "has_parent_transaction", "id", "integration_id", "is_3d_secure",
  "is_auth", "is_capture", "is_refunded", "is_standalone_payment",
  "is_voided", "order.id", "owner", "pending", "source_data.pan",
  "source_data.sub_type", "source_data.type", "success",
] as const;

function nestedValue(value: Record<string, unknown>, path: string) {
  return path.split(".").reduce<unknown>(
    (current, key) =>
      current && typeof current === "object"
        ? (current as Record<string, unknown>)[key]
        : "",
    value,
  );
}

export function verifyPaymobHmac(
  payload: Record<string, unknown>,
  received: string,
  secret = process.env.PAYMOB_HMAC_SECRET,
) {
  if (!secret || !/^[a-f0-9]{128}$/i.test(received)) return false;
  const value = hmacKeys
    .map((key) => String(nestedValue(payload, key) ?? ""))
    .join("");
  const expected = createHmac("sha512", secret).update(value).digest("hex");
  return timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(received, "hex"),
  );
}
