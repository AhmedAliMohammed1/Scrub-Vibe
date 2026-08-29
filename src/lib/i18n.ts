export const locales = ["en", "ar"] as const;
export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export const copy = {
  en: {
    dir: "ltr" as const,
    freeShipping: "Free delivery across Egypt on orders over 1,500 EGP",
    nav: ["New in", "Women", "Men", "Kids", "Accessories", "The edit", "Sale"],
    eyebrow: "THE CAIRO EDIT · 2026",
    title: "Designed for the life in between.",
    heroBody:
      "Modern silhouettes, breathable natural fabrics, and quiet confidence—made for days that move.",
    shopWomen: "Shop women",
    shopMen: "Shop men",
    arrivals: "New arrivals",
    arrivalsBody: "Fresh forms for warmer days.",
    viewAll: "View all",
    add: "Quick add",
    curated: "Curated for now",
  },
  ar: {
    dir: "rtl" as const,
    freeShipping: "توصيل مجاني في مصر للطلبات فوق ١٥٠٠ جنيه",
    nav: [
      "وصل حديثاً",
      "نساء",
      "رجال",
      "أطفال",
      "إكسسوارات",
      "اختياراتنا",
      "تخفيضات",
    ],
    eyebrow: "تحرير القاهرة · ٢٠٢٦",
    title: "مصممة لكل لحظة بينهما.",
    heroBody: "قصّات عصرية وخامات طبيعية خفيفة وثقة هادئة—لأيام لا تتوقف.",
    shopWomen: "تسوقي النساء",
    shopMen: "تسوق الرجال",
    arrivals: "وصل حديثاً",
    arrivalsBody: "تفاصيل جديدة للأيام الدافئة.",
    viewAll: "عرض الكل",
    add: "إضافة سريعة",
    curated: "مختار لهذا الموسم",
  },
} as const;
