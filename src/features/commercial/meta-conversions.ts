import "server-only";

import { createHash } from "node:crypto";

function hash(value: string) {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export async function sendMetaPurchase(input: {
  eventId: string;
  sourceUrl: string;
  email: string;
  phone: string;
  valueMinor: number;
  productIds: string[];
  clientIp?: string;
  userAgent?: string;
}) {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  const token = process.env.META_CONVERSIONS_API_TOKEN?.trim();
  if (!pixelId || !token)
    return { sent: false as const, reason: "not_configured" as const };
  const userData: Record<string, string | string[]> = {
    em: [hash(input.email)],
    ph: [hash(input.phone.replace(/\D/g, ""))],
  };
  if (input.clientIp) userData.client_ip_address = input.clientIp;
  if (input.userAgent) userData.client_user_agent = input.userAgent;
  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_source_url: input.sourceUrl,
        action_source: "website",
        event_id: input.eventId,
        user_data: userData,
        custom_data: {
          currency: "EGP",
          value: input.valueMinor / 100,
          content_type: "product",
          content_ids: input.productIds,
        },
      },
    ],
  };
  if (process.env.META_TEST_EVENT_CODE?.trim())
    payload.test_event_code = process.env.META_TEST_EVENT_CODE.trim();
  const version = process.env.META_GRAPH_API_VERSION?.trim() || "v24.0";
  const response = await fetch(
    `https://graph.facebook.com/${version}/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(token)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    },
  );
  if (!response.ok) {
    const detail = await response.text();
    console.error(
      "[meta-capi] Purchase event rejected",
      response.status,
      detail.slice(0, 500),
    );
    return { sent: false as const, reason: "rejected" as const };
  }
  return { sent: true as const };
}
