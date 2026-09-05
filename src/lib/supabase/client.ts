"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getSupabaseEnvironment } from "./config";

export function createClient() {
  const { url, publishableKey } = getSupabaseEnvironment();
  return createBrowserClient<Database>(url, publishableKey);
}
