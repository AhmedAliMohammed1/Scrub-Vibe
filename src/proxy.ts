import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { isLocale } from "@/lib/i18n";

export async function proxy(request: NextRequest) {
  const pathLocale = request.nextUrl.pathname.split("/")[1];
  request.headers.set(
    "x-scrub-vibe-locale",
    isLocale(pathLocale) ? pathLocale : "en",
  );
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
