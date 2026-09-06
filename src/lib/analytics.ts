"use client";

import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/types/database";

export type StoreEventName =
  | "page_view"
  | "product_view"
  | "add_to_cart"
  | "wishlist_add"
  | "begin_checkout"
  | "newsletter_signup"
  | "instagram_click";

const ANONYMOUS_KEY = "scrub-vibe-anonymous-id";
const SESSION_KEY = "scrub-vibe-analytics-session";
const SESSION_TIMEOUT = 30 * 60 * 1000;

type SessionRecord = { id: string; lastSeen: number };

function readJson<T>(key: string): T | null {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

function anonymousId() {
  const existing = window.localStorage.getItem(ANONYMOUS_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  window.localStorage.setItem(ANONYMOUS_KEY, id);
  return id;
}

function sessionId() {
  const now = Date.now();
  const existing = readJson<SessionRecord>(SESSION_KEY);
  const id =
    existing && now - existing.lastSeen < SESSION_TIMEOUT
      ? existing.id
      : crypto.randomUUID();
  window.localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ id, lastSeen: now } satisfies SessionRecord),
  );
  return id;
}

function deviceType() {
  if (window.innerWidth < 768) return "mobile";
  if (window.innerWidth < 1100) return "tablet";
  return "desktop";
}

function referrerHost() {
  if (!document.referrer) return undefined;
  try {
    const host = new URL(document.referrer).hostname;
    return host === window.location.hostname ? undefined : host;
  } catch {
    return undefined;
  }
}

export function trackStoreEvent(
  eventName: StoreEventName,
  options: {
    productId?: string | number;
    path?: string;
    metadata?: Record<string, Json | undefined>;
  } = {},
) {
  if (typeof window === "undefined") return;

  const path =
    options.path ?? `${window.location.pathname}${window.location.search}`;
  const locale = window.location.pathname.split("/")[1];
  const params = new URLSearchParams(window.location.search);

  void createClient()
    .rpc("track_store_event", {
      p_event_name: eventName,
      p_session_id: sessionId(),
      p_anonymous_id: anonymousId(),
      p_path: path,
      p_locale: locale === "ar" || locale === "en" ? locale : undefined,
      p_product_id:
        options.productId === undefined ? undefined : Number(options.productId),
      p_referrer_host: referrerHost(),
      p_utm_source: params.get("utm_source") ?? undefined,
      p_utm_medium: params.get("utm_medium") ?? undefined,
      p_utm_campaign: params.get("utm_campaign") ?? undefined,
      p_device_type: deviceType(),
      p_metadata: options.metadata ?? {},
    })
    .then(({ error }) => {
      if (error && process.env.NODE_ENV === "development") {
        console.warn("Analytics event was not recorded", error.message);
      }
    });
}
