"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRoles } from "@/server/auth/roles";
import type { Locale } from "@/lib/i18n";

export type AdminActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

const productSchema = z
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
  });

function message(locale: Locale, en: string, ar: string) {
  return locale === "ar" ? ar : en;
}

function revalidateCatalogue(locale: Locale) {
  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/shop`);
}

export async function createProductAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const raw = Object.fromEntries(formData);
  const locale = raw.locale === "ar" ? "ar" : "en";
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      message: message(
        locale,
        "Please review the highlighted product details.",
        "يرجى مراجعة بيانات المنتج المحددة.",
      ),
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { supabase, userId } = await requireRoles([
    "product_manager",
    "admin",
    "super_admin",
  ]);
  const data = parsed.data;
  const colourSchema = z
    .array(
      z.object({
        code: z
          .string()
          .trim()
          .min(1)
          .max(40)
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
        en: z.string().trim().min(1).max(60),
        ar: z.string().trim().min(1).max(60),
        hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      }),
    )
    .min(1)
    .max(12);
  let colourInput: unknown;
  try {
    colourInput = JSON.parse(data.colours);
  } catch {
    colourInput = null;
  }
  const parsedColours = colourSchema.safeParse(colourInput);
  if (
    !parsedColours.success ||
    new Set(
      parsedColours.success ? parsedColours.data.map((item) => item.code) : [],
    ).size !== (parsedColours.success ? parsedColours.data.length : 0)
  ) {
    return {
      status: "error",
      message: message(
        locale,
        "Add between 1 and 12 valid colours with unique codes.",
        "أضف من لون واحد إلى ١٢ لوناً بأكواد مختلفة.",
      ),
      fieldErrors: { colours: ["Colour codes must be unique."] },
    };
  }
  const sizes = [
    ...new Set(
      data.sizes
        .split(",")
        .map((size) => size.trim())
        .filter(Boolean),
    ),
  ];
  if (!sizes.length || sizes.length > 20) {
    return {
      status: "error",
      message: message(
        locale,
        "Enter between 1 and 20 sizes.",
        "أدخل من مقاس واحد إلى ٢٠ مقاساً.",
      ),
      fieldErrors: {
        sizes: ["Use comma-separated sizes, for example: S, M, L, XL"],
      },
    };
  }

  let imageUrl = data.imageUrl;
  let uploadedPath: string | null = null;
  const image = formData.get("image");
  if (image instanceof File && image.size > 0) {
    const allowed = new Map([
      ["image/jpeg", "jpg"],
      ["image/png", "png"],
      ["image/webp", "webp"],
      ["image/avif", "avif"],
    ]);
    const extension = allowed.get(image.type);
    if (!extension || image.size > 5 * 1024 * 1024) {
      return {
        status: "error",
        message: message(
          locale,
          "Use a JPG, PNG, WebP, or AVIF image up to 5 MB.",
          "استخدم صورة JPG أو PNG أو WebP أو AVIF بحجم أقصى ٥ ميجابايت.",
        ),
        fieldErrors: {
          image: ["Unsupported image or file is larger than 5 MB."],
        },
      };
    }

    uploadedPath = `${userId}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("product-media")
      .upload(uploadedPath, image, { contentType: image.type, upsert: false });
    if (uploadError) {
      return {
        status: "error",
        message: message(
          locale,
          "The product image could not be uploaded.",
          "تعذر رفع صورة المنتج.",
        ),
      };
    }
    imageUrl = supabase.storage.from("product-media").getPublicUrl(uploadedPath)
      .data.publicUrl;
  }

  const { error } = await supabase.rpc("admin_create_product_with_colours", {
    p_slug: data.slug,
    p_title_en: data.titleEn,
    p_title_ar: data.titleAr,
    p_description_en: data.descriptionEn,
    p_description_ar: data.descriptionAr,
    p_category_id: data.categoryId,
    p_gender: data.gender,
    p_status: data.status,
    p_base_price_minor: Math.round(data.price * 100),
    p_compare_at_price_minor:
      data.compareAt === "" ? null : Math.round(data.compareAt * 100),
    p_cost_minor: data.cost === "" ? null : Math.round(data.cost * 100),
    p_material: data.material,
    p_fit: data.fit,
    p_colours: parsedColours.data,
    p_sizes: sizes,
    p_stock: data.stock,
    p_low_stock_threshold: data.lowStockThreshold,
    p_image_url: imageUrl,
  });

  if (error) {
    if (uploadedPath) {
      await supabase.storage.from("product-media").remove([uploadedPath]);
    }
    const duplicate = error.code === "23505";
    return {
      status: "error",
      message: duplicate
        ? message(
            locale,
            "That product slug already exists.",
            "رابط هذا المنتج مستخدم بالفعل.",
          )
        : message(
            locale,
            "The product could not be created. Please try again.",
            "تعذر إنشاء المنتج. حاول مرة أخرى.",
          ),
      fieldErrors: duplicate ? { slug: ["Choose a unique slug."] } : undefined,
    };
  }

  revalidateCatalogue(locale);
  return {
    status: "success",
    message: message(
      locale,
      "Product created successfully.",
      "تم إنشاء المنتج بنجاح.",
    ),
  };
}

export async function setProductStatusAction(formData: FormData) {
  const locale = formData.get("locale") === "ar" ? "ar" : "en";
  const parsed = z
    .object({
      productId: z.coerce.number().int().positive(),
      status: z.enum(["draft", "active", "archived"]),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Invalid product status change.");

  const { supabase } = await requireRoles([
    "product_manager",
    "admin",
    "super_admin",
  ]);
  const { error } = await supabase.rpc("admin_set_product_status", {
    p_product_id: parsed.data.productId,
    p_status: parsed.data.status,
  });
  if (error) throw new Error("Unable to change the product status.");
  revalidateCatalogue(locale);
}

export async function adjustInventoryAction(formData: FormData) {
  const locale = formData.get("locale") === "ar" ? "ar" : "en";
  const parsed = z
    .object({
      variantId: z.coerce.number().int().positive(),
      onHand: z.coerce.number().int().nonnegative(),
      reason: z.string().trim().min(3).max(240),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Enter valid stock and a short reason.");

  const { supabase } = await requireRoles([
    "warehouse",
    "product_manager",
    "admin",
    "super_admin",
  ]);
  const { error } = await supabase.rpc("admin_adjust_inventory", {
    p_variant_id: parsed.data.variantId,
    p_new_on_hand: parsed.data.onHand,
    p_reason: parsed.data.reason,
  });
  if (error) throw new Error("Unable to adjust inventory.");
  revalidateCatalogue(locale);
}
