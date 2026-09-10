import { z } from "zod";

export const colourItemSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  en: z.string().trim().min(1).max(60),
  ar: z.string().trim().min(1).max(60),
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export const colourListSchema = z.array(colourItemSchema).min(1).max(12);

export const productSchema = z
  .object({
    locale: z.enum(["en", "ar"]),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(100)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    titleEn: z.string().trim().min(2).max(140),
    titleAr: z.string().trim().min(2).max(140),
    descriptionEn: z.string().trim().max(3000),
    descriptionAr: z.string().trim().max(3000),
    categoryId: z.coerce.number().int().positive(),
    gender: z.enum(["men", "women", "boys", "girls", "unisex"]),
    status: z.enum(["draft", "active"]),
    price: z.coerce.number().nonnegative().max(1_000_000),
    codDeposit: z.coerce.number().positive().max(1_000_000),
    compareAt: z.union([z.literal(""), z.coerce.number().nonnegative()]),
    cost: z.union([z.literal(""), z.coerce.number().nonnegative()]),
    material: z.string().trim().max(120),
    fit: z.string().trim().max(120),
    colours: z.string().max(4000),
    sizes: z.string().trim().min(1).max(200),
    stock: z.coerce.number().int().nonnegative().max(1_000_000),
    lowStockThreshold: z.coerce.number().int().nonnegative().max(100_000),
    imageUrl: z.union([z.literal(""), z.string().url().max(1000)]),
  })
  .superRefine((value, context) => {
    if (value.compareAt !== "" && value.compareAt < value.price) {
      context.addIssue({
        code: "custom",
        path: ["compareAt"],
        message: "Compare price must be equal to or higher than the price.",
      });
    }
    if (value.codDeposit > value.price) {
      context.addIssue({
        code: "custom",
        path: ["codDeposit"],
        message: "The COD deposit cannot be higher than the product price.",
      });
    }
  });

export const updateProductSchema = z
  .object({
    productId: z.coerce.number().int().positive(),
    locale: z.enum(["en", "ar"]),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(100)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    titleEn: z.string().trim().min(2).max(140),
    titleAr: z.string().trim().min(2).max(140),
    descriptionEn: z.string().trim().max(3000),
    descriptionAr: z.string().trim().max(3000),
    categoryId: z.coerce.number().int().positive(),
    gender: z.enum(["men", "women", "boys", "girls", "unisex"]),
    status: z.enum(["draft", "active", "archived"]),
    price: z.coerce.number().nonnegative().max(1_000_000),
    codDeposit: z.coerce.number().nonnegative().max(1_000_000),
    compareAt: z.union([z.literal(""), z.coerce.number().nonnegative()]),
    cost: z.union([z.literal(""), z.coerce.number().nonnegative()]),
    material: z.string().trim().max(120),
    fit: z.string().trim().max(120),
    colours: z.string().max(4000),
    sizes: z.string().trim().min(1).max(200),
    imageUrl: z.union([z.literal(""), z.string().url().max(1000)]),
  })
  .superRefine((value, context) => {
    if (value.compareAt !== "" && value.compareAt < value.price) {
      context.addIssue({
        code: "custom",
        path: ["compareAt"],
        message: "Compare price must be equal to or higher than the price.",
      });
    }
    if (value.codDeposit > value.price) {
      context.addIssue({
        code: "custom",
        path: ["codDeposit"],
        message: "The COD deposit cannot be higher than the product price.",
      });
    }
  });

export function parseSizesString(sizes: string): string[] {
  return [
    ...new Set(
      sizes
        .split(",")
        .map((size) => size.trim())
        .filter(Boolean),
    ),
  ];
}
