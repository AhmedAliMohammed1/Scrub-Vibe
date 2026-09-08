import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { CmsBanner } from "./types";
import {
  getBannerTitle,
  getBannerBody,
  getBannerCtaText,
  getBannerImageUrl,
  getBannerSubtitle,
} from "./types";

interface PromoSectionProps {
  banners: CmsBanner[];
  locale: Locale;
}

export function PromoSection({ banners, locale }: PromoSectionProps) {
  return (
    <>
      {banners.map((banner, index) => (
        <PromoBlock
          key={banner.id}
          banner={banner}
          locale={locale}
          imageRight={index % 2 === 1}
        />
      ))}
    </>
  );
}

function PromoBlock({
  banner,
  locale,
  imageRight,
}: {
  banner: CmsBanner;
  locale: Locale;
  imageRight: boolean;
}) {
  const title = getBannerTitle(banner, locale);
  const subtitle = getBannerSubtitle(banner, locale);
  const body = getBannerBody(banner, locale);
  const ctaText = getBannerCtaText(banner, locale);
  const imageUrl = getBannerImageUrl(banner.imagePath);

  return (
    <section
      id={`promo-${banner.id}`}
      className={`grid min-h-[640px] overflow-hidden md:grid-cols-2`}
    >
      {/* Image panel */}
      <div
        className={`relative min-h-[540px] min-w-0 overflow-hidden ${
          imageRight ? "md:order-2" : ""
        }`}
        style={{ backgroundColor: banner.bgColor }}
      >
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover object-center"
          />
        )}
      </div>

      {/* Text panel */}
      <div
        className={`flex min-w-0 items-center overflow-hidden px-8 py-20 md:px-16 ${
          imageRight ? "md:order-1" : ""
        }`}
        style={{
          backgroundColor: banner.bgColor + "20",
          color: banner.textColor === "#ffffff" ? "#1a1a1a" : banner.textColor,
        }}
      >
        <div className="min-w-0 max-w-lg">
          {subtitle && (
            <p
              className="eyebrow"
              style={{
                color:
                  banner.textColor === "#ffffff" ? "#0e7468" : banner.textColor,
              }}
            >
              {subtitle}
            </p>
          )}
          <h2 className="mt-5 font-serif text-5xl leading-[.98] md:text-7xl">
            {title}
          </h2>
          {body && (
            <p className="mt-7 max-w-md text-sm leading-7 text-neutral-700">
              {body}
            </p>
          )}
          {ctaText && banner.ctaUrl && (
            <Link
              href={banner.ctaUrl as Route}
              className="mt-9 inline-flex items-center gap-2 border-b border-current pb-1 text-[10px] font-bold uppercase tracking-[.15em]"
            >
              {ctaText}
              <ArrowUpRight size={14} />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
