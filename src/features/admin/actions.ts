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

import {
  productSchema,
  updateProductSchema,
  colourListSchema,
  parseSizesString,
} from "./schemas";

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
  let colourInput: unknown;
  try {
    colourInput = JSON.parse(data.colours);
  } catch {
    colourInput = null;
  }
  const parsedColours = colourListSchema.safeParse(colourInput);
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
  const sizes = parseSizesString(data.sizes);
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

  const { data: productId, error } = await supabase.rpc("admin_create_product_with_colours", {
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
      (data.compareAt === "" ? null : Math.round(data.compareAt * 100)) as number,
    p_cost_minor: (data.cost === "" ? null : Math.round(data.cost * 100)) as number,
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

  const { error: depositError } = await supabase
    .from("products")
    .update({ cod_deposit_minor: Math.round(data.codDeposit * 100) })
    .eq("id", productId as number);
  if (depositError) {
    return {
      status: "error",
      message: message(
        locale,
        "The product was created, but its COD deposit could not be saved. Set it from the product list.",
        "تم إنشاء المنتج، لكن تعذر حفظ مقدم الدفع عند الاستلام. حدده من قائمة المنتجات.",
      ),
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

export async function setProductDepositAction(formData: FormData) {
  const locale = formData.get("locale") === "ar" ? "ar" : "en";
  const parsed = z.object({
    productId: z.coerce.number().int().positive(),
    deposit: z.coerce.number().positive().max(1_000_000),
  }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Enter a valid positive COD deposit.");

  const { supabase } = await requireRoles(["product_manager", "admin", "super_admin"]);
  const { data: product, error: readError } = await supabase
    .from("products")
    .select("base_price_minor")
    .eq("id", parsed.data.productId)
    .single();
  const depositMinor = Math.round(parsed.data.deposit * 100);
  if (readError || !product || depositMinor > product.base_price_minor) {
    throw new Error("The COD deposit must not exceed the product price.");
  }
  const { error } = await supabase
    .from("products")
    .update({ cod_deposit_minor: depositMinor })
    .eq("id", parsed.data.productId);
  if (error) throw new Error("Unable to update the COD deposit.");
  revalidateCatalogue(locale);
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

export async function updateProductAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const raw = Object.fromEntries(formData);
  const locale = raw.locale === "ar" ? "ar" : "en";
  const parsed = updateProductSchema.safeParse(raw);
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

  let colourInput: unknown;
  try {
    colourInput = JSON.parse(data.colours);
  } catch {
    colourInput = null;
  }
  const parsedColours = colourListSchema.safeParse(colourInput);
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

  const sizes = parseSizesString(data.sizes);
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

  const { error } = await supabase.rpc("admin_update_product", {
    p_product_id: data.productId,
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
      (data.compareAt === "" ? null : Math.round(data.compareAt * 100)) as number,
    p_cost_minor: (data.cost === "" ? null : Math.round(data.cost * 100)) as number,
    p_cod_deposit_minor: Math.round(data.codDeposit * 100),
    p_material: data.material,
    p_fit: data.fit,
    p_colours: parsedColours.data,
    p_sizes: sizes,
    p_image_url: imageUrl || undefined,
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
            "The product could not be updated. Please try again.",
            "تعذر تحديث المنتج. حاول مرة أخرى.",
          ),
      fieldErrors: duplicate ? { slug: ["Choose a unique slug."] } : undefined,
    };
  }

  revalidateCatalogue(locale);
  revalidatePath(`/${locale}/admin/products/${data.productId}/edit`);
  revalidatePath(`/${locale}/products/${data.slug}`);
  return {
    status: "success",
    message: message(
      locale,
      "Product updated successfully.",
      "تم تحديث المنتج بنجاح.",
    ),
  };
}

export async function deleteProductAction(
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  const raw = Object.fromEntries(formData);
  const locale = raw.locale === "ar" ? "ar" : "en";
  const productId = Number(raw.productId);

  if (!Number.isInteger(productId) || productId <= 0) {
    return {
      success: false,
      error: message(locale, "Invalid product ID.", "معرف المنتج غير صالح."),
    };
  }

  const { supabase } = await requireRoles([
    "product_manager",
    "admin",
    "super_admin",
  ]);

  const { error } = await supabase.rpc("admin_delete_product", {
    p_product_id: productId,
  });

  if (error) {
    console.error("[actions/deleteProduct] Failed to delete product", error);
    return {
      success: false,
      error: message(
        locale,
        "Failed to delete product. Please try again.",
        "تعذر حذف المنتج. حاول مرة أخرى.",
      ),
    };
  }

  revalidateCatalogue(locale);
  return { success: true };
}
