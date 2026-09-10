import { describe, expect, it } from 'vitest';
import { resolveProductGalleryImages } from '../../src/components/store/product-gallery';
import type { Product } from '../../src/features/catalog/types';

describe('resolveProductGalleryImages', () => {
  const baseProduct: Product = {
    id: 'prod-1',
    slug: 'scrub-suit-pro',
    title: { en: 'Scrub Suit Pro', ar: 'طقم سكراب برو' },
    description: { en: 'High quality scrub', ar: 'سكراب عالي الجودة' },
    category: 'sets',
    price: 1200,
    codDeposit: 200,
    color: 'Navy Blue',
    colorCode: 'navy',
    colorName: { en: 'Navy Blue', ar: 'كحلي' },
    colors: [
      {
        id: 'c1',
        code: 'navy',
        swatch: '#000080',
        name: { en: 'Navy Blue', ar: 'كحلي' },
        sizes: ['M', 'L'],
        variants: { M: 'v1', L: 'v2' },
        allVariants: { M: 'v1', L: 'v2' },
        stockBySize: { M: 5, L: 10 },
        inStock: true,
      },
      {
        id: 'c2',
        code: 'burgundy',
        swatch: '#800020',
        name: { en: 'Burgundy', ar: 'خمري' },
        sizes: ['M'],
        variants: { M: 'v3' },
        allVariants: { M: 'v3' },
        stockBySize: { M: 3 },
        inStock: true,
      },
      {
        id: 'c3',
        code: 'teal',
        swatch: '#008080',
        name: { en: 'Teal', ar: 'تيل' },
        sizes: ['L'],
        variants: { L: 'v4' },
        allVariants: { L: 'v4' },
        stockBySize: { L: 2 },
        inStock: true,
      },
    ],
    sizes: ['M', 'L'],
    inStock: true,
    art: 'ink',
    image: {
      src: '/images/default.jpg',
      alt: { en: 'Default Scrub', ar: 'سكراب افتراضي' },
    },
  };

  it('falls back to default product.image if product.images is empty or undefined', () => {
    const res = resolveProductGalleryImages(baseProduct, 'navy', 'en');
    expect(res.isFallback).toBe(false);
    expect(res.images).toHaveLength(1);
    expect(res.images[0].src).toBe('/images/default.jpg');
  });

  it('returns specific images matching the selected colour when available', () => {
    const product: Product = {
      ...baseProduct,
      images: [
        {
          id: 1,
          src: '/images/navy-front.jpg',
          alt: { en: 'Navy Front', ar: 'كحلي من الأمام' },
          colourCode: 'navy',
          position: 10,
        },
        {
          id: 2,
          src: '/images/navy-back.jpg',
          alt: { en: 'Navy Back', ar: 'كحلي من الخلف' },
          colourCode: 'navy',
          position: 20,
        },
        {
          id: 3,
          src: '/images/burgundy-front.jpg',
          alt: { en: 'Burgundy Front', ar: 'خمري من الأمام' },
          colourCode: 'burgundy',
          position: 10,
        },
        {
          id: 4,
          src: '/images/general-fabric.jpg',
          alt: { en: 'Fabric Detail', ar: 'تفاصيل القماش' },
          colourCode: null,
          position: 30,
        },
      ],
    };

    const res = resolveProductGalleryImages(product, 'navy', 'en');
    expect(res.isFallback).toBe(false);
    expect(res.images).toHaveLength(3);
    expect(res.images.map((img) => img.src)).toEqual([
      '/images/navy-front.jpg',
      '/images/navy-back.jpg',
      '/images/general-fabric.jpg',
    ]);
  });

  it('falls back to another available colour with bilingual names when selected colour has no images', () => {
    const product: Product = {
      ...baseProduct,
      images: [
        {
          id: 1,
          src: '/images/navy-front.jpg',
          alt: { en: 'Navy Front', ar: 'كحلي من الأمام' },
          colourCode: 'navy',
          position: 10,
        },
        {
          id: 2,
          src: '/images/general-sizechart.jpg',
          alt: { en: 'Size Chart', ar: 'جدول المقاسات' },
          colourCode: null,
          position: 50,
        },
      ],
    };

    const resEn = resolveProductGalleryImages(product, 'teal', 'en');
    expect(resEn.isFallback).toBe(true);
    expect(resEn.fallbackColourName).toBe('Navy Blue');
    expect(resEn.selectedColourName).toBe('Teal');
    expect(resEn.images.map((i) => i.src)).toEqual([
      '/images/navy-front.jpg',
      '/images/general-sizechart.jpg',
    ]);

    const resAr = resolveProductGalleryImages(product, 'teal', 'ar');
    expect(resAr.isFallback).toBe(true);
    expect(resAr.fallbackColourName).toBe('كحلي');
    expect(resAr.selectedColourName).toBe('تيل');
  });

  it('returns general images without fallback flag when no colour-tagged images exist', () => {
    const product: Product = {
      ...baseProduct,
      images: [
        {
          id: 1,
          src: '/images/general-1.jpg',
          alt: { en: 'General 1', ar: 'عام 1' },
          colourCode: null,
          position: 10,
        },
        {
          id: 2,
          src: '/images/general-2.jpg',
          alt: { en: 'General 2', ar: 'عام 2' },
          colourCode: null,
          position: 20,
        },
      ],
    };

    const res = resolveProductGalleryImages(product, 'burgundy', 'en');
    expect(res.isFallback).toBe(false);
    expect(res.images).toHaveLength(2);
    expect(res.images.map((i) => i.src)).toEqual([
      '/images/general-1.jpg',
      '/images/general-2.jpg',
    ]);
  });
});
