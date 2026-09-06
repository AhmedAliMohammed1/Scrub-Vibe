export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export const copy = {
  en: {
    dir: "ltr" as const,
    freeShipping: "Delivery across Egypt · Cash on delivery available",
    nav: [
      "New in",
      "Female scrubs",
      "Male scrubs",
      "Lab coats",
      "Instagram",
      "Our quality",
      "Sale",
    ],
    eyebrow: "MEDICAL CLOTHING · MADE IN EGYPT",
    title: "Confidence for every shift.",
    heroBody:
      "Premium scrubs made in our own factory with practical details, a precise fit and all-day comfort.",
    shopWomen: "Shop female scrubs",
    shopMen: "Shop male scrubs",
    arrivals: "Scrubs made to move",
    arrivalsBody:
      "The latest Scrub Vibe designs, ready for the pace of your day.",
    viewAll: "View all",
    add: "Quick add",
    curated: "Wear the difference",
  },
  ar: {
    dir: "rtl" as const,
    freeShipping: "توصيل لجميع أنحاء مصر · الدفع عند الاستلام متاح",
    nav: [
      "وصل حديثاً",
      "سكراب حريمي",
      "سكراب رجالي",
      "بالطو طبي",
      "إنستجرام",
      "جودتنا",
      "العروض",
    ],
    eyebrow: "ملابس طبية · صناعة مصرية",
    title: "ثقة في كل شيفت.",
    heroBody:
      "سكراب عالي الجودة من مصنعنا بقصات عملية ومقاس مضبوط وراحة تدوم طوال اليوم.",
    shopWomen: "تسوقي السكراب الحريمي",
    shopMen: "تسوق السكراب الرجالي",
    arrivals: "سكراب يتحرك معك",
    arrivalsBody: "أحدث تصميمات سكراب فايب، جاهزة لإيقاع يومك.",
    viewAll: "عرض الكل",
    add: "إضافة سريعة",
    curated: "اشعر بالفرق",
  },
} as const;
