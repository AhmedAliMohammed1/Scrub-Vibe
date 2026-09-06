import type { Product } from "./types";

type ScrubInput = Pick<
  Product,
  | "id"
  | "slug"
  | "title"
  | "description"
  | "category"
  | "price"
  | "color"
  | "colorCode"
  | "colorName"
  | "sizes"
  | "image"
> & { compareAt?: number };

const scrub = (product: ScrubInput): Product => ({
  ...product,
  inStock: true,
  badge: product.compareAt ? "sale" : "new",
  art: "ink",
});

const products: ScrubInput[] = [
  {
    id: "sv-f2",
    slug: "female-design-2-scrub-set",
    title: { en: "Women's Design 2 Scrub Set", ar: "طقم سكراب حريمي تصميم ٢" },
    description: {
      en: "A polished burgundy scrub set with practical pockets, premium fabric and an easy fit made for long shifts.",
      ar: "طقم سكراب بلون نبيتي بقماش عالي الجودة وجيوب عملية وقصة مريحة لساعات العمل الطويلة.",
    },
    category: "women",
    price: 85000,
    compareAt: 100000,
    color: "#6f182f",
    colorCode: "burgundy",
    colorName: { en: "Burgundy", ar: "نبيتي" },
    sizes: ["XS", "S", "M", "L", "XL", "2XL"],
    image: {
      src: "/images/scrub-vibe/female-design-2.webp",
      alt: { en: "Women's Design 2 Scrub Set", ar: "طقم سكراب حريمي تصميم ٢" },
    },
  },
  {
    id: "sv-f9",
    slug: "female-design-9-scrub-set",
    title: { en: "Women's Design 9 Scrub Set", ar: "طقم سكراب حريمي تصميم ٩" },
    description: {
      en: "A clean black scrub set designed for effortless movement and all-day comfort.",
      ar: "طقم سكراب أسود بقصة عملية تمنح حرية حركة وراحة طوال اليوم.",
    },
    category: "women",
    price: 85000,
    compareAt: 99900,
    color: "#171717",
    colorCode: "black",
    colorName: { en: "Black", ar: "أسود" },
    sizes: ["XS", "S", "M", "L", "XL", "2XL"],
    image: {
      src: "/images/scrub-vibe/female-design-9.webp",
      alt: { en: "Women's Design 9 Scrub Set", ar: "طقم سكراب حريمي تصميم ٩" },
    },
  },
  {
    id: "sv-f4",
    slug: "female-design-4-scrub-set",
    title: { en: "Women's Design 4 Scrub Set", ar: "طقم سكراب حريمي تصميم ٤" },
    description: {
      en: "A stone scrub set with practical pockets and a soft professional finish.",
      ar: "طقم سكراب بلون حجري مع جيوب عملية ولمسة احترافية ناعمة.",
    },
    category: "women",
    price: 85000,
    compareAt: 100000,
    color: "#a89e91",
    colorCode: "stone",
    colorName: { en: "Stone", ar: "حجري" },
    sizes: ["XS", "S", "M", "L", "XL", "2XL"],
    image: {
      src: "/images/scrub-vibe/female-design-4.webp",
      alt: { en: "Women's Design 4 Scrub Set", ar: "طقم سكراب حريمي تصميم ٤" },
    },
  },
  {
    id: "sv-f7",
    slug: "female-design-7-scrub-set",
    title: { en: "Women's Design 7 Scrub Set", ar: "طقم سكراب حريمي تصميم ٧" },
    description: {
      en: "A modest charcoal scrub set with long sleeves and roomy pockets.",
      ar: "طقم سكراب محتشم باللون الفحمي بأكمام طويلة وجيوب واسعة.",
    },
    category: "women",
    price: 85000,
    compareAt: 100000,
    color: "#34363d",
    colorCode: "charcoal",
    colorName: { en: "Charcoal", ar: "فحمي" },
    sizes: ["XS", "S", "M", "L", "XL", "2XL"],
    image: {
      src: "/images/scrub-vibe/female-design-7.webp",
      alt: { en: "Women's Design 7 Scrub Set", ar: "طقم سكراب حريمي تصميم ٧" },
    },
  },
  {
    id: "sv-f6",
    slug: "female-design-6-scrub-set",
    title: { en: "Women's Design 6 Scrub Set", ar: "طقم سكراب حريمي تصميم ٦" },
    description: {
      en: "A sky-blue long-sleeve scrub set with adjustable side ties.",
      ar: "طقم سكراب سماوي بأكمام طويلة ورباط جانبي قابل للتعديل.",
    },
    category: "women",
    price: 85000,
    compareAt: 100000,
    color: "#a8cce7",
    colorCode: "sky-blue",
    colorName: { en: "Sky blue", ar: "سماوي" },
    sizes: ["XS", "S", "M", "L", "XL", "2XL"],
    image: {
      src: "/images/scrub-vibe/female-design-6.webp",
      alt: { en: "Women's Design 6 Scrub Set", ar: "طقم سكراب حريمي تصميم ٦" },
    },
  },
  {
    id: "sv-m1",
    slug: "male-design-1-scrub-set",
    title: { en: "Men's Design 1 Scrub Set", ar: "طقم سكراب رجالي تصميم ١" },
    description: {
      en: "A navy V-neck scrub set with a streamlined fit and practical pockets.",
      ar: "طقم سكراب رجالي كحلي بياقة V وقصة انسيابية وجيوب عملية.",
    },
    category: "men",
    price: 85000,
    compareAt: 100000,
    color: "#172c52",
    colorCode: "navy",
    colorName: { en: "Navy", ar: "كحلي" },
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
    image: {
      src: "/images/scrub-vibe/male-design-1.jpg",
      alt: { en: "Men's Design 1 Scrub Set", ar: "طقم سكراب رجالي تصميم ١" },
    },
  },
  {
    id: "sv-m2",
    slug: "male-design-2-scrub-set",
    title: { en: "Men's Design 2 Scrub Set", ar: "طقم سكراب رجالي تصميم ٢" },
    description: {
      en: "An olive zip-neck scrub set balancing a refined look with easy movement.",
      ar: "طقم سكراب رجالي زيتوني بياقة وسحّاب يجمع بين الأناقة وحرية الحركة.",
    },
    category: "men",
    price: 85000,
    compareAt: 100000,
    color: "#4f5041",
    colorCode: "olive",
    colorName: { en: "Olive", ar: "زيتوني" },
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
    image: {
      src: "/images/scrub-vibe/male-design-2.webp",
      alt: { en: "Men's Design 2 Scrub Set", ar: "طقم سكراب رجالي تصميم ٢" },
    },
  },
  {
    id: "sv-m5",
    slug: "male-design-5-scrub-set",
    title: { en: "Men's Design 5 Scrub Set", ar: "طقم سكراب رجالي تصميم ٥" },
    description: {
      en: "A rich teal scrub set made for a confident professional look and reliable comfort.",
      ar: "طقم سكراب رجالي باللون البترولي لمظهر مهني مميز وراحة موثوقة.",
    },
    category: "men",
    price: 85000,
    compareAt: 100000,
    color: "#07516a",
    colorCode: "teal",
    colorName: { en: "Teal", ar: "بترولي" },
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
    image: {
      src: "/images/scrub-vibe/male-design-5.jpeg",
      alt: { en: "Men's Design 5 Scrub Set", ar: "طقم سكراب رجالي تصميم ٥" },
    },
  },
  {
    id: "sv-lab",
    slug: "classic-medical-lab-coat",
    title: { en: "Classic Medical Lab Coat", ar: "بالطو طبي كلاسيك" },
    description: {
      en: "A crisp white medical coat with a classic collar and roomy pockets.",
      ar: "بالطو طبي أبيض بياقة كلاسيكية وجيوب واسعة.",
    },
    category: "unisex",
    price: 55000,
    color: "#f4f4f2",
    colorCode: "white",
    colorName: { en: "White", ar: "أبيض" },
    sizes: ["S", "M", "L", "XL", "2XL"],
    image: {
      src: "/images/scrub-vibe/lab-coat.webp",
      alt: { en: "Classic Medical Lab Coat", ar: "بالطو طبي كلاسيك" },
    },
  },
];

export const demoProducts: Product[] = products.map(scrub);
