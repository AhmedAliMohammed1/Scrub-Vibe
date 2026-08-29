export type Product = {
  id: string;
  slug: string;
  title: { en: string; ar: string };
  category: string;
  price: number;
  compareAt?: number;
  color: string;
  colorName: { en: string; ar: string };
  sizes: string[];
  badge?: "new" | "sale" | "low";
  art: "clay" | "olive" | "ink" | "sand";
};
