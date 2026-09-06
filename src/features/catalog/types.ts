export type ProductColour = {
  id: string;
  code: string;
  swatch: string;
  name: { en: string; ar: string };
  sizes: string[];
  variants: Record<string, string>;
  inStock: boolean;
};

export type Product = {
  id: string;
  slug: string;
  title: { en: string; ar: string };
  description: { en: string; ar: string };
  category: string;
  price: number;
  compareAt?: number;
  color: string;
  colorCode: string;
  colorName: { en: string; ar: string };
  colors: ProductColour[];
  sizes: string[];
  inStock: boolean;
  badge?: "new" | "sale" | "low";
  art: "clay" | "olive" | "ink" | "sand";
  image: { src: string; alt: { en: string; ar: string } };
};
