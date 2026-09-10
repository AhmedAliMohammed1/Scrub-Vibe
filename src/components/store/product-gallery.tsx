'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Info } from 'lucide-react';
import type { Product } from '@/features/catalog/types';
import type { Locale } from '@/lib/i18n';

export type ResolvedGalleryItem = {
  src: string;
  alt: { en: string; ar: string };
  colourCode?: string | null;
  position: number;
};

export type ResolvedGallery = {
  images: ResolvedGalleryItem[];
  isFallback: boolean;
  fallbackColourName?: string;
  selectedColourName?: string;
};

export function resolveProductGalleryImages(
  product: Product,
  selectedColourCode: string,
  locale: Locale,
): ResolvedGallery {
  const selectedColour = product.colors.find((c) => c.code === selectedColourCode);
  const selectedColourName = selectedColour?.name[locale] ?? selectedColourCode;

  const allImages = product.images ?? [];
  if (allImages.length === 0) {
    return {
      images: [
        {
          src: product.image.src,
          alt: product.image.alt,
          position: 10,
        },
      ],
      isFallback: false,
    };
  }

  // Find images matching selected colour
  const specificImages = allImages.filter(
    (img) => img.colourCode && img.colourCode.toLowerCase() === selectedColourCode.toLowerCase(),
  );
  const generalImages = allImages.filter((img) => !img.colourCode);

  if (specificImages.length > 0) {
    return {
      images: [...specificImages, ...generalImages],
      isFallback: false,
    };
  }

  // Check if ANY image is tagged with a colour code
  const anyColourImages = allImages.filter((img) => Boolean(img.colourCode));

  if (anyColourImages.length > 0) {
    // Other colours have images, but this one does not
    const otherColour = product.colors.find(
      (c) =>
        c.code.toLowerCase() !== selectedColourCode.toLowerCase() &&
        allImages.some(
          (img) => img.colourCode && img.colourCode.toLowerCase() === c.code.toLowerCase(),
        ),
    );

    if (otherColour) {
      const fallbackImages = allImages.filter(
        (img) =>
          img.colourCode && img.colourCode.toLowerCase() === otherColour.code.toLowerCase(),
      );
      const combined = [...fallbackImages, ...generalImages];
      return {
        images: combined.length > 0 ? combined : [{ src: product.image.src, alt: product.image.alt, position: 10 }],
        isFallback: true,
        fallbackColourName: otherColour.name[locale],
        selectedColourName,
      };
    }

    // If matching otherColour wasn't in product.colors, take the first tagged image
    const firstTaggedColourCode = anyColourImages[0].colourCode!;
    const fallbackImages = allImages.filter(
      (img) =>
        img.colourCode && img.colourCode.toLowerCase() === firstTaggedColourCode.toLowerCase(),
    );
    const combined = [...fallbackImages, ...generalImages];
    return {
      images: combined.length > 0 ? combined : [{ src: product.image.src, alt: product.image.alt, position: 10 }],
      isFallback: true,
      fallbackColourName: firstTaggedColourCode,
      selectedColourName,
    };
  }

  // Only general images exist for this product
  return {
    images: generalImages.length > 0 ? generalImages : [{ src: product.image.src, alt: product.image.alt, position: 10 }],
    isFallback: false,
  };
}

export function ProductGallery({
  product,
  selectedColourCode,
  locale,
}: {
  product: Product;
  selectedColourCode: string;
  locale: Locale;
}) {
  const { images, isFallback, fallbackColourName, selectedColourName } =
    resolveProductGalleryImages(product, selectedColourCode, locale);

  const [activeColour, setActiveColour] = useState(selectedColourCode);
  const [rawIndex, setRawIndex] = useState(0);

  const activeIndex =
    activeColour === selectedColourCode
      ? Math.min(rawIndex, Math.max(0, images.length - 1))
      : 0;

  const setActiveIndex = (idx: number) => {
    setActiveColour(selectedColourCode);
    setRawIndex(idx);
  };

  const activeImage = images[activeIndex] ?? images[0];

  return (
    <div className="w-full">
      {/* Fallback reassurance note */}
      {isFallback && (
        <div
          role="status"
          aria-live="polite"
          className="mb-4 flex items-center gap-2.5 rounded-xs border border-amber-200/90 bg-amber-50/90 px-3.5 py-2.5 text-xs text-amber-950 shadow-2xs backdrop-blur-xs"
        >
          <Info size={16} className="shrink-0 text-amber-700" aria-hidden="true" />
          <p className="leading-relaxed font-medium">
            {locale === 'ar'
              ? `لا تتوفر صور خاصة بهذا اللون (${selectedColourName}). يتم عرض صور اللون (${fallbackColourName}) كمعاينة.`
              : `No preview images available for ${selectedColourName}. Showing ${fallbackColourName} preview.`}
          </p>
        </div>
      )}

      {/* Main Image Frame */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xs border border-[var(--border-subtle)] bg-[#ebe9e4] shadow-xs lg:aspect-auto lg:min-h-[720px]">
        {activeImage && (
          <Image
            src={activeImage.src}
            alt={activeImage.alt[locale] || activeImage.alt.en || product.title[locale]}
            fill
            priority
            sizes="(min-width: 1024px) 60vw, 100vw"
            className="object-cover object-top transition-opacity duration-300"
          />
        )}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 rounded-full bg-black/60 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-xs">
            {activeIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnails strip */}
      {images.length > 1 && (
        <div
          className="mt-3 flex gap-2.5 overflow-x-auto pb-1"
          role="tablist"
          aria-label={locale === 'ar' ? 'معرض صور المنتج' : 'Product gallery thumbnails'}
        >
          {images.map((img, idx) => {
            const isSelected = idx === activeIndex;
            return (
              <button
                key={`${img.src}-${idx}`}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-label={`${locale === 'ar' ? 'صورة' : 'Image'} ${idx + 1}`}
                onClick={() => setActiveIndex(idx)}
                className={`relative size-20 shrink-0 overflow-hidden rounded-xs border transition-all ${
                  isSelected
                    ? 'border-[#0e7468] ring-2 ring-[#0e7468]/30 opacity-100'
                    : 'border-black/10 hover:border-black/30 opacity-70 hover:opacity-100'
                }`}
              >
                <Image
                  src={img.src}
                  alt={img.alt[locale] || img.alt.en || ''}
                  fill
                  sizes="80px"
                  className="object-cover object-top"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
