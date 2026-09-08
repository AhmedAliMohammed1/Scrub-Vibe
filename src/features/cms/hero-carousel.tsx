"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { CmsBanner } from "./types";
import {
  getBannerTitle,
  getBannerSubtitle,
  getBannerBody,
  getBannerCtaText,
  getBannerSecondaryCtaText,
  getBannerImageUrl,
} from "./types";

interface HeroCarouselProps {
  banners: CmsBanner[];
  locale: Locale;
}

export function HeroCarousel({ banners, locale }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = banners.length;

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (total > 1) {
      timerRef.current = setInterval(() => {
        setCurrent((prev) => (prev + 1) % total);
      }, 6000);
    }
  }, [total]);

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resetTimer]);

  const goTo = (index: number) => {
    setCurrent(index);
    resetTimer();
  };

  const banner = banners[current];
  if (!banner) return null;

  const title = getBannerTitle(banner, locale);
  const subtitle = getBannerSubtitle(banner, locale);
  const body = getBannerBody(banner, locale);
  const ctaText = getBannerCtaText(banner, locale);
  const secondaryCtaText = getBannerSecondaryCtaText(banner, locale);
  const imageUrl = getBannerImageUrl(banner.imagePath);

  return (
    <section
      className="relative min-h-[650px] overflow-hidden md:min-h-[780px]"
      style={{ backgroundColor: banner.bgColor }}
    >
      {/* Background image */}
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={title}
          fill
          priority
          sizes="100vw"
          className="object-cover object-[55%_58%] md:object-[60%_55%]"
        />
      )}

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-r rtl:bg-gradient-to-l"
        style={{
          backgroundImage: `linear-gradient(to right, ${banner.bgColor}${Math.round(banner.overlayOpacity * 2.55)
            .toString(16)
            .padStart(2, "0")}, ${banner.bgColor}88, transparent)`,
        }}
      />

      {/* Content */}
      <div className="relative mx-auto flex min-h-[650px] max-w-[1600px] items-center px-5 py-24 md:min-h-[780px] md:px-12">
        <div className="max-w-2xl" style={{ color: banner.textColor }}>
          {subtitle && (
            <p className="eyebrow mb-7" style={{ color: banner.textColor }}>
              {subtitle}
            </p>
          )}
          <h1 className="hero-title max-w-xl">{title}</h1>
          {body && (
            <p className="mt-7 max-w-md text-sm leading-6 md:text-base">
              {body}
            </p>
          )}
          {(ctaText || secondaryCtaText) && (
            <div className="mt-9 flex flex-wrap gap-3">
              {ctaText && banner.ctaUrl && (
                <Link
                  href={banner.ctaUrl as Route}
                  className="px-6 py-4 text-[11px] font-bold uppercase tracking-[.14em]"
                  style={{
                    backgroundColor: banner.textColor,
                    color: banner.bgColor,
                  }}
                >
                  {ctaText}
                </Link>
              )}
              {secondaryCtaText && banner.secondaryCtaUrl && (
                <Link
                  href={banner.secondaryCtaUrl as Route}
                  className="border px-6 py-4 text-[11px] font-bold uppercase tracking-[.14em]"
                  style={{ borderColor: banner.textColor }}
                >
                  {secondaryCtaText}
                </Link>
              )}
            </div>
          )}
        </div>

        <ArrowDown
          className="absolute bottom-7 start-1/2 animate-bounce"
          style={{ color: banner.textColor }}
          size={20}
        />
      </div>

      {/* Carousel dots */}
      {total > 1 && (
        <div className="absolute bottom-12 start-1/2 z-10 flex -translate-x-1/2 gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-2 rounded-full transition-all ${
                i === current
                  ? "w-8 bg-white"
                  : "w-2 bg-white/50 hover:bg-white/75"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
