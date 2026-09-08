import type { Route } from "next";
import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";
import { hasSupabaseEnvironment } from "@/lib/supabase/config";
import { copy, type Locale } from "@/lib/i18n";
import { getActiveBanners } from "./repository";
import { getBannerTitle } from "./types";

export async function AnnouncementBar({ locale }: { locale: Locale }) {
  let announcements: Awaited<ReturnType<typeof getActiveBanners>> = [];

  if (hasSupabaseEnvironment()) {
    try {
      const supabase = createPublicClient();
      announcements = await getActiveBanners(supabase, "announcement");
    } catch {
      // Silently fall back to static text
    }
  }

  // Fallback: render the existing static announcement
  if (!announcements.length) {
    return (
      <div className="bg-neutral-950 px-4 py-2 text-center text-[10px] font-medium uppercase tracking-[.18em] text-white">
        {copy[locale].freeShipping}
      </div>
    );
  }

  // Single announcement
  if (announcements.length === 1) {
    const banner = announcements[0];
    const text = getBannerTitle(banner, locale);
    const content = (
      <span className="inline-block">{text}</span>
    );

    return (
      <div
        className="px-4 py-2 text-center text-[10px] font-medium uppercase tracking-[.18em]"
        style={{
          backgroundColor: banner.bgColor,
          color: banner.textColor,
        }}
      >
        {banner.ctaUrl ? (
          <Link href={banner.ctaUrl as Route} className="underline-offset-2 hover:underline">
            {content}
          </Link>
        ) : (
          content
        )}
      </div>
    );
  }

  // Multiple announcements — CSS-only rotating ticker
  const total = announcements.length;
  const durationPerSlide = 4; // seconds
  const totalDuration = total * durationPerSlide;

  return (
    <div
      className="relative overflow-hidden px-4 py-2 text-center text-[10px] font-medium uppercase tracking-[.18em]"
      style={{
        backgroundColor: announcements[0].bgColor,
        color: announcements[0].textColor,
      }}
    >
      <div
        className="flex"
        style={{
          animation: `announcementScroll ${totalDuration}s linear infinite`,
          width: `${total * 100}%`,
        }}
      >
        {announcements.map((banner) => {
          const text = getBannerTitle(banner, locale);
          return (
            <div
              key={banner.id}
              className="flex w-full shrink-0 items-center justify-center"
              style={{ width: `${100 / total}%` }}
            >
              {banner.ctaUrl ? (
                <Link
                  href={banner.ctaUrl as Route}
                  className="underline-offset-2 hover:underline"
                >
                  {text}
                </Link>
              ) : (
                <span>{text}</span>
              )}
            </div>
          );
        })}
      </div>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes announcementScroll {
              ${announcements
                .map((_, i) => {
                  const startPct = (i / total) * 100;
                  const holdPct = ((i + 0.85) / total) * 100;
                  const endPct = ((i + 1) / total) * 100;
                  return `${startPct}% { transform: translateX(-${i * (100 / total)}%); }
                  ${holdPct}% { transform: translateX(-${i * (100 / total)}%); }
                  ${endPct}% { transform: translateX(-${(i + 1) * (100 / total)}%); }`;
                })
                .join("\n")}
            }
          `,
        }}
      />
    </div>
  );
}
