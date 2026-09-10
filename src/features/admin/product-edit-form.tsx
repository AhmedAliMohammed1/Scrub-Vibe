"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  ImagePlus,
  LoaderCircle,
  Package,
  Plus,
  Save,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";
import {
  deleteProductAction,
  updateProductAction,
  type AdminActionState,
} from "./actions";

type Category = { id: number; slug: string; name: string };
type ColourInput = { code: string; en: string; ar: string; hex: string };

const originalPalette: ColourInput[] = [
  { code: "burgundy", en: "Burgundy", ar: "نبيتي", hex: "#6f182f" },
  { code: "black", en: "Black", ar: "أسود", hex: "#171717" },
  { code: "stone", en: "Stone", ar: "حجري", hex: "#a89e91" },
  { code: "charcoal", en: "Charcoal", ar: "فحمي", hex: "#34363d" },
  { code: "sky-blue", en: "Sky blue", ar: "سماوي", hex: "#a8cce7" },
  { code: "navy", en: "Navy", ar: "كحلي", hex: "#172c52" },
  { code: "olive", en: "Olive", ar: "زيتوني", hex: "#4f5041" },
  { code: "teal", en: "Teal", ar: "بترولي", hex: "#07516a" },
];

export type ProductEditDetails = {
  id: number;
  slug: string;
  status: "draft" | "active" | "scheduled" | "archived";
  gender: string | null;
  material: string | null;
  fit: string | null;
  base_price_minor: number;
  compare_at_price_minor: number | null;
  cost_minor: number | null;
  cod_deposit_minor: number;
  category_id: number;
  product_translations: {
    locale: string;
    title: string;
    description: string | null;
  }[];
  product_images: {
    id?: number;
    storage_path: string;
    alt_en: string;
    alt_ar?: string | null;
    position: number;
    colour_code?: string | null;
  }[];
  product_options: {
    id: number;
    code: string;
    name_en: string;
    name_ar: string;
    product_option_values: {
      id: number;
      code: string;
      label_en: string;
      label_ar: string;
      swatch_hex: string | null;
      position: number;
    }[];
  }[];
  product_variants: {
    id: number;
    sku: string;
    is_active: boolean;
    inventory: {
      on_hand: number;
      reserved: number;
      low_stock_threshold: number;
    } | null;
  }[];
};

const inputClass =
  "mt-2 h-11 w-full border border-black/15 bg-white px-3 text-sm outline-none transition focus:border-[#0e7468] focus:ring-2 focus:ring-[#0e7468]/10";
const textareaClass = `${inputClass} h-28 py-3 resize-y`;

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ProductEditForm({
  product,
  categories,
  locale,
}: {
  product: ProductEditDetails;
  categories: Category[];
  locale: Locale;
}) {
  const ar = locale === "ar";
  const router = useRouter();

  const titleEn =
    product.product_translations.find((t) => t.locale === "en")?.title ?? "";
  const titleAr =
    product.product_translations.find((t) => t.locale === "ar")?.title ?? "";
  const descEn =
    product.product_translations.find((t) => t.locale === "en")?.description ??
    "";
  const descAr =
    product.product_translations.find((t) => t.locale === "ar")?.description ??
    "";

  // Extract colours from product_options
  const colourOption = product.product_options.find((o) => o.code === "color");
  const initialColours: ColourInput[] = colourOption?.product_option_values
    ?.length
    ? colourOption.product_option_values
        .toSorted((a, b) => a.position - b.position)
        .map((v) => ({
          code: v.code,
          en: v.label_en,
          ar: v.label_ar,
          hex: v.swatch_hex ?? "#172c52",
        }))
    : [{ code: "navy", en: "Navy", ar: "كحلي", hex: "#172c52" }];

  // Extract sizes from product_options
  const sizeOption = product.product_options.find((o) => o.code === "size");
  const initialSizes = sizeOption?.product_option_values?.length
    ? sizeOption.product_option_values
        .toSorted((a, b) => a.position - b.position)
        .map((v) => v.label_en)
        .join(", ")
    : "XS, S, M, L, XL, 2XL";

  const [slug, setSlug] = useState(product.slug);
  const [colours, setColours] = useState<ColourInput[]>(initialColours);
  const [existingImages, setExistingImages] = useState<{
    id: number;
    src: string;
    colourCode: string;
    position: number;
    altEn: string;
    altAr: string;
  }[]>(
    (product.product_images ?? []).map((img, idx) => ({
      id: img.id ?? idx,
      src: img.storage_path,
      colourCode: img.colour_code ?? "",
      position: img.position ?? (idx + 1) * 10,
      altEn: img.alt_en ?? "",
      altAr: img.alt_ar ?? "",
    })),
  );
  const [newFiles, setNewFiles] = useState<{
    id: string;
    file: File;
    previewUrl: string;
    colourCode: string;
    position: number;
  }[]>([]);
  const [newUrls, setNewUrls] = useState<{
    id: string;
    url: string;
    colourCode: string;
    position: number;
  }[]>([]);
  const [batchUploadColour, setBatchUploadColour] = useState<string>("");
  const [newUrlInput, setNewUrlInput] = useState<string>("");
  const [newUrlColour, setNewUrlColour] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (fileInputRef.current) {
      const dt = new DataTransfer();
      for (const nf of newFiles) {
        dt.items.add(nf.file);
      }
      fileInputRef.current.files = dt.files;
    }
  }, [newFiles]);

  const handleFilesChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const added = files.map((file, idx) => ({
      id: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      colourCode: batchUploadColour,
      position: (existingImages.length + newFiles.length + newUrls.length + idx + 1) * 10,
    }));
    setNewFiles((prev) => [...prev, ...added]);
    e.target.value = "";
  };

  const handleAddUrl = () => {
    if (!newUrlInput.trim()) return;
    const item = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      url: newUrlInput.trim(),
      colourCode: newUrlColour,
      position: (existingImages.length + newFiles.length + newUrls.length + 1) * 10,
    };
    setNewUrls((prev) => [...prev, item]);
    setNewUrlInput("");
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [state, formAction, pending] = useActionState(updateProductAction, {
    status: "idle",
  } as AdminActionState);

  const errorFor = (name: string) => state.fieldErrors?.[name]?.[0];

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError("");
    try {
      const formData = new FormData();
      formData.set("locale", locale);
      formData.set("productId", String(product.id));
      const res = await deleteProductAction(formData);
      if (!res.success) {
        setDeleteError(
          res.error ||
            (ar
              ? "تعذر حذف هذا المنتج حالياً."
              : "Failed to delete this product."),
        );
        setIsDeleting(false);
        return;
      }
      router.push(`/${locale}/admin?deleted=1`);
    } catch {
      setDeleteError(
        ar ? "حدث خطأ غير متوقع." : "An unexpected error occurred.",
      );
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8" dir={ar ? "rtl" : "ltr"}>
      {/* Header & Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 bg-white p-6 md:p-8">
        <div>
          <Link
            href={`/${locale}/admin#products-list`}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0e7468] hover:underline"
          >
            <ArrowLeft size={14} className={ar ? "rotate-180" : undefined} />
            <span>{ar ? "العودة لقائمة المنتجات" : "Back to products"}</span>
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-3xl font-bold text-neutral-900 md:text-4xl">
              {ar ? titleAr || product.slug : titleEn || product.slug}
            </h1>
            <span
              className={`inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                product.status === "active"
                  ? "bg-emerald-100 text-emerald-800"
                  : product.status === "draft"
                    ? "bg-neutral-100 text-neutral-700"
                    : "bg-stone-200 text-stone-700"
              }`}
            >
              {product.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            SKU: {product.slug} · ID: #{product.id} ·{" "}
            {product.product_variants.length} {ar ? "متغيرات" : "variants"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {product.status === "active" && (
            <Link
              href={`/${locale}/products/${product.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 border border-black/15 bg-white px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-700 hover:border-black/30 hover:bg-neutral-50"
            >
              <ExternalLink size={14} />
              <span>{ar ? "معاينة بالمتجر" : "View in store"}</span>
            </Link>
          )}
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-1.5 border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider text-red-700 hover:bg-red-100"
          >
            <Trash2 size={14} />
            <span>{ar ? "حذف المنتج" : "Delete"}</span>
          </button>
        </div>
      </div>

      {state.message && (
        <div
          className={`border px-5 py-4 text-sm font-medium ${
            state.status === "success"
              ? "border-emerald-700/20 bg-emerald-50 text-emerald-900"
              : "border-red-700/20 bg-red-50 text-red-900"
          }`}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.status === "success" && (
            <CheckCircle2 className="me-2 inline" size={18} />
          )}
          {state.message}
        </div>
      )}

      {/* Main Form */}
      <form action={formAction} className="space-y-8">
        <input type="hidden" name="productId" value={product.id} />
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="colours" value={JSON.stringify(colours)} />

        {/* Section 1: Basic Details */}
        <section className="border border-black/10 bg-white p-6 shadow-xs md:p-8">
          <div className="border-b border-black/10 pb-4">
            <h2 className="font-serif text-2xl font-bold text-neutral-900">
              {ar ? "البيانات الأساسية للمنتج" : "General Information"}
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              {ar
                ? "اسم المنتج باللغتين والرابط المخصص والوصف الكامل."
                : "Bilingual product titles, unique URL slug, and descriptions."}
            </p>
          </div>

          <div className="mt-6 grid gap-6">
            <div className="grid gap-5 md:grid-cols-2">
              <Label
                text={ar ? "الاسم بالإنجليزية (Title EN)" : "English Name"}
                error={errorFor("titleEn")}
              >
                <input
                  name="titleEn"
                  required
                  maxLength={140}
                  defaultValue={titleEn}
                  className={inputClass}
                  placeholder="Classic V-Neck Medical Scrub"
                />
              </Label>
              <Label
                text={ar ? "الاسم بالعربية (Title AR)" : "Arabic Name"}
                error={errorFor("titleAr")}
              >
                <input
                  name="titleAr"
                  dir="rtl"
                  required
                  maxLength={140}
                  defaultValue={titleAr}
                  className={inputClass}
                  placeholder="طقم سكراب طبي كلاسيك سبعة"
                />
              </Label>
            </div>

            <Label
              text={ar ? "رابط المنتج (Slug)" : "Product Slug (URL)"}
              hint={
                ar
                  ? "يستخدم في عنوان الصفحة (أحرف إنجليزية صغيرة وشرطات)"
                  : "Used in URL (lowercase letters, numbers, hyphens)"
              }
              error={errorFor("slug")}
            >
              <input
                name="slug"
                required
                maxLength={100}
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
                className={inputClass}
              />
            </Label>

            <div className="grid gap-5 md:grid-cols-2">
              <Label
                text={ar ? "الوصف بالإنجليزية" : "English Description"}
                error={errorFor("descriptionEn")}
              >
                <textarea
                  name="descriptionEn"
                  maxLength={3000}
                  defaultValue={descEn}
                  className={textareaClass}
                />
              </Label>
              <Label
                text={ar ? "الوصف بالعربية" : "Arabic Description"}
                error={errorFor("descriptionAr")}
              >
                <textarea
                  name="descriptionAr"
                  dir="rtl"
                  maxLength={3000}
                  defaultValue={descAr}
                  className={textareaClass}
                />
              </Label>
            </div>
          </div>
        </section>

        {/* Section 2: Classification, Audience, Material & Fit */}
        <section className="border border-black/10 bg-white p-6 shadow-xs md:p-8">
          <div className="border-b border-black/10 pb-4">
            <h2 className="font-serif text-2xl font-bold text-neutral-900">
              {ar ? "التصنيف والسمات والحالة" : "Classification & Attributes"}
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              {ar
                ? "اختر الفئة المستهدفة، حالة النشر، نوع الخامة وقصة التصميم."
                : "Audience, category, publication status, fabric composition, and cut."}
            </p>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Label
              text={ar ? "التصنيف" : "Category"}
              error={errorFor("categoryId")}
            >
              <select
                name="categoryId"
                required
                defaultValue={product.category_id}
                className={inputClass}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Label>

            <Label
              text={ar ? "الفئة المستهدفة" : "Audience"}
              error={errorFor("gender")}
            >
              <select
                name="gender"
                defaultValue={product.gender ?? "unisex"}
                className={inputClass}
              >
                <option value="women">{ar ? "نساء" : "Women"}</option>
                <option value="men">{ar ? "رجال" : "Men"}</option>
                <option value="unisex">
                  {ar ? "للجميع (Unisex)" : "Unisex"}
                </option>
                <option value="girls">{ar ? "بنات" : "Girls"}</option>
                <option value="boys">{ar ? "أولاد" : "Boys"}</option>
              </select>
            </Label>

            <Label
              text={ar ? "حالة النشر" : "Publication Status"}
              error={errorFor("status")}
            >
              <select
                name="status"
                defaultValue={product.status}
                className={inputClass}
              >
                <option value="active">
                  {ar ? "منشور (Active)" : "Active (Visible in store)"}
                </option>
                <option value="draft">
                  {ar ? "مسودة (Draft)" : "Draft (Hidden from store)"}
                </option>
                <option value="archived">
                  {ar ? "مؤرشف (Archived)" : "Archived"}
                </option>
              </select>
            </Label>

            <Label
              text={ar ? "الخامة" : "Material"}
              error={errorFor("material")}
            >
              <input
                name="material"
                maxLength={120}
                defaultValue={product.material ?? ""}
                placeholder={
                  ar
                    ? "٧٢٪ بوليستر، ٢١٪ رايون، ٧٪ سباندكس"
                    : "72% Polyester, 21% Rayon, 7% Spandex"
                }
                className={inputClass}
              />
            </Label>

            <Label text={ar ? "القصة" : "Fit"} error={errorFor("fit")}>
              <input
                name="fit"
                maxLength={120}
                defaultValue={product.fit ?? ""}
                placeholder={
                  ar ? "قصة مريحة / سليم فيت" : "Tailored modern fit"
                }
                className={inputClass}
              />
            </Label>
          </div>
        </section>

        {/* Section 3: Pricing & Commercial Terms */}
        <section className="border border-black/10 bg-white p-6 shadow-xs md:p-8">
          <div className="border-b border-black/10 pb-4">
            <h2 className="font-serif text-2xl font-bold text-neutral-900">
              {ar ? "الأسعار والشروط التجارية" : "Pricing & Commercials"}
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              {ar
                ? "سعر البيع، السعر قبل الخصم، مقدم الدفع عند الاستلام، وتكلفة الإنتاج."
                : "Selling price, comparison discount price, COD deposit requirement, and internal cost."}
            </p>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Label
              text={ar ? "سعر البيع الحالي (ج.م)" : "Price (EGP)"}
              error={errorFor("price")}
            >
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                required
                defaultValue={product.base_price_minor / 100}
                className={inputClass}
              />
            </Label>

            <Label
              text={ar ? "السعر قبل الخصم (ج.م)" : "Compare At Price (EGP)"}
              hint={ar ? "اختياري" : "Optional anchor"}
              error={errorFor("compareAt")}
            >
              <input
                name="compareAt"
                type="number"
                min="0"
                step="0.01"
                defaultValue={
                  product.compare_at_price_minor !== null
                    ? product.compare_at_price_minor / 100
                    : ""
                }
                className={inputClass}
              />
            </Label>

            <Label
              text={ar ? "مقدم الدفع عند الاستلام (ج.م)" : "COD Deposit (EGP)"}
              hint={ar ? "مطلوب لتأكيد طلب COD" : "Required for COD"}
              error={errorFor("codDeposit")}
            >
              <input
                name="codDeposit"
                type="number"
                min="0"
                step="0.01"
                required
                defaultValue={product.cod_deposit_minor / 100}
                className={inputClass}
              />
            </Label>

            <Label
              text={ar ? "تكلفة القطعة (ج.م)" : "Unit Cost (EGP)"}
              hint={ar ? "داخلي لتحليل الأرباح" : "For margin tracking"}
              error={errorFor("cost")}
            >
              <input
                name="cost"
                type="number"
                min="0"
                step="0.01"
                defaultValue={
                  product.cost_minor !== null ? product.cost_minor / 100 : ""
                }
                className={inputClass}
              />
            </Label>
          </div>
        </section>

        {/* Section 4: Product Media & Gallery */}
        <section className="border border-black/10 bg-white p-6 shadow-xs md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-4">
            <div>
              <h2 className="font-serif text-2xl font-bold text-neutral-900">
                {ar ? "معرض وصور المنتج والألوان" : "Media & Product Gallery"}
              </h2>
              <p className="mt-1 text-xs text-neutral-500">
                {ar
                  ? "أضف صوراً متعددة للمنتج وحدد اللون الخاص بكل صورة، أو اجعلها صورة عامة لكافة الألوان. في حال عدم وجود صور لأحد الألوان، سيقوم المتجر تلقائياً بعرض صور لون بديل مع إشعار للمستخدم."
                  : "Add multiple product images and assign them to specific colours or all colours. If a colour has no images, the storefront displays images from an available colour with a friendly note."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-neutral-500">
                {existingImages.length + newFiles.length + newUrls.length}{" "}
                {ar ? "صور" : "images"}
              </span>
            </div>
          </div>

          {/* Current / Active Images List */}
          <div className="mt-6">
            <label className="block text-[10px] font-bold uppercase tracking-[.14em] text-neutral-600 mb-3">
              {ar ? "الصور الحالية والمرفوعة" : "Current & Uploaded Images"}
            </label>

            {existingImages.length === 0 &&
            newFiles.length === 0 &&
            newUrls.length === 0 ? (
              <div className="flex flex-col items-center justify-center border border-dashed border-black/15 bg-neutral-50 py-10 text-center">
                <Package className="size-10 text-neutral-300 mb-2" />
                <p className="text-xs text-neutral-500">
                  {ar
                    ? "لا توجد صور مضافة بعد. استخدم أدوات الرفع أدناه."
                    : "No images added yet. Use the upload tools below."}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Existing Saved Images */}
                {existingImages.map((img, idx) => {
                  const assignedColour = colours.find(
                    (c) => c.code === img.colourCode,
                  );
                  return (
                    <div
                      key={`existing-${img.id}-${idx}`}
                      className="group relative flex flex-col border border-black/10 bg-[#fafafa] p-3 transition hover:border-[#0e7468]"
                    >
                      <div className="relative aspect-square w-full overflow-hidden bg-neutral-200 border border-black/5">
                        <Image
                          src={img.src}
                          alt={img.altEn || "Product"}
                          fill
                          sizes="200px"
                          className="object-cover object-top"
                        />
                        {assignedColour ? (
                          <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-neutral-800 shadow-xs backdrop-blur-xs">
                            <span
                              className="size-2.5 rounded-full border border-black/20"
                              style={{ backgroundColor: assignedColour.hex }}
                            />
                            <span>
                              {ar ? assignedColour.ar : assignedColour.en}
                            </span>
                          </div>
                        ) : (
                          <div className="absolute top-2 left-2 rounded-full bg-neutral-900/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs backdrop-blur-xs">
                            {ar ? "كافة الألوان" : "All Colours"}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setExistingImages((prev) =>
                              prev.filter((item) => item.id !== img.id),
                            )
                          }
                          className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-white/90 text-neutral-600 shadow-xs hover:bg-red-50 hover:text-red-700 transition"
                          title={ar ? "حذف الصورة" : "Remove image"}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Card Settings */}
                      <div className="mt-3 space-y-2">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                            {ar ? "اللون المخصص" : "Assigned Colour"}
                          </label>
                          <select
                            value={img.colourCode}
                            onChange={(e) =>
                              setExistingImages((prev) =>
                                prev.map((item) =>
                                  item.id === img.id
                                    ? { ...item, colourCode: e.target.value }
                                    : item,
                                ),
                              )
                            }
                            className="mt-1 h-9 w-full border border-black/15 bg-white px-2 text-xs font-medium text-neutral-800 outline-hidden focus:border-[#0e7468]"
                          >
                            <option value="">
                              {ar
                                ? "كافة الألوان (عامة)"
                                : "All Colours (General)"}
                            </option>
                            {colours.map((c) => (
                              <option key={c.code} value={c.code}>
                                {c.en} / {c.ar}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                            {ar ? "الترتيب" : "Position"}
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={img.position}
                            onChange={(e) =>
                              setExistingImages((prev) =>
                                prev.map((item) =>
                                  item.id === img.id
                                    ? {
                                        ...item,
                                        position:
                                          Number(e.target.value) || 0,
                                      }
                                    : item,
                                ),
                              )
                            }
                            className="h-8 w-20 border border-black/15 bg-white px-2 text-center text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Pending New Files */}
                {newFiles.map((nf) => {
                  const assignedColour = colours.find(
                    (c) => c.code === nf.colourCode,
                  );
                  return (
                    <div
                      key={`new-file-${nf.id}`}
                      className="group relative flex flex-col border-2 border-dashed border-[#0e7468]/40 bg-[#f0f9f7] p-3"
                    >
                      <div className="relative aspect-square w-full overflow-hidden bg-neutral-200 border border-black/5">
                        <Image
                          src={nf.previewUrl}
                          alt="New upload"
                          fill
                          sizes="200px"
                          className="object-cover object-top"
                        />
                        {assignedColour ? (
                          <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-neutral-800 shadow-xs backdrop-blur-xs">
                            <span
                              className="size-2.5 rounded-full border border-black/20"
                              style={{ backgroundColor: assignedColour.hex }}
                            />
                            <span>{ar ? assignedColour.ar : assignedColour.en}</span>
                          </div>
                        ) : (
                          <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-[#0e7468] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                            <span>{ar ? "جديد" : "New"}</span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setNewFiles((prev) =>
                              prev.filter((item) => item.id !== nf.id),
                            )
                          }
                          className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-white/90 text-neutral-600 shadow-xs hover:bg-red-50 hover:text-red-700 transition"
                          title={ar ? "إلغاء الصورة" : "Cancel image"}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="mt-3 space-y-2">
                        <div>
                          <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                            {ar ? "اللون المخصص" : "Assigned Colour"}
                          </label>
                          <select
                            value={nf.colourCode}
                            onChange={(e) =>
                              setNewFiles((prev) =>
                                prev.map((item) =>
                                  item.id === nf.id
                                    ? { ...item, colourCode: e.target.value }
                                    : item,
                                ),
                              )
                            }
                            className="mt-1 h-9 w-full border border-black/15 bg-white px-2 text-xs font-medium text-neutral-800 outline-hidden focus:border-[#0e7468]"
                          >
                            <option value="">
                              {ar
                                ? "كافة الألوان (عامة)"
                                : "All Colours (General)"}
                            </option>
                            {colours.map((c) => (
                              <option key={c.code} value={c.code}>
                                {c.en} / {c.ar}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                            {ar ? "الترتيب" : "Position"}
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={nf.position}
                            onChange={(e) =>
                              setNewFiles((prev) =>
                                prev.map((item) =>
                                  item.id === nf.id
                                    ? {
                                        ...item,
                                        position:
                                          Number(e.target.value) || 0,
                                      }
                                    : item,
                                ),
                              )
                            }
                            className="h-8 w-20 border border-black/15 bg-white px-2 text-center text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Pending New URLs */}
                {newUrls.map((nu) => (
                  <div
                    key={`new-url-${nu.id}`}
                    className="group relative flex flex-col border-2 border-dashed border-blue-400/40 bg-blue-50/40 p-3"
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-neutral-200 border border-black/5">
                      <Image
                        src={nu.url}
                        alt="External image"
                        fill
                        sizes="200px"
                        className="object-cover object-top"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setNewUrls((prev) =>
                            prev.filter((item) => item.id !== nu.id),
                          )
                        }
                        className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-white/90 text-neutral-600 shadow-xs hover:bg-red-50 hover:text-red-700 transition"
                        title={ar ? "إلغاء الرابط" : "Cancel URL"}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="mt-3 space-y-2">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                          {ar ? "اللون المخصص" : "Assigned Colour"}
                        </label>
                        <select
                          value={nu.colourCode}
                          onChange={(e) =>
                            setNewUrls((prev) =>
                              prev.map((item) =>
                                item.id === nu.id
                                  ? { ...item, colourCode: e.target.value }
                                  : item,
                              ),
                            )
                          }
                          className="mt-1 h-9 w-full border border-black/15 bg-white px-2 text-xs font-medium text-neutral-800 outline-hidden focus:border-[#0e7468]"
                        >
                          <option value="">
                            {ar
                              ? "كافة الألوان (عامة)"
                              : "All Colours (General)"}
                          </option>
                          {colours.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.en} / {c.ar}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                          {ar ? "الترتيب" : "Position"}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={nu.position}
                          onChange={(e) =>
                            setNewUrls((prev) =>
                              prev.map((item) =>
                                item.id === nu.id
                                  ? {
                                      ...item,
                                      position:
                                        Number(e.target.value) || 0,
                                    }
                                  : item,
                              ),
                            )
                          }
                          className="h-8 w-20 border border-black/15 bg-white px-2 text-center text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload New Images / Add URL Controls */}
          <div className="mt-8 border-t border-black/10 pt-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 mb-3">
              {ar ? "إضافة صور جديدة للمنتج" : "Upload New Images"}
            </h3>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Multi-file Uploader */}
              <div className="rounded-xs border border-black/10 bg-[#fafafa] p-4">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 mb-2">
                  {ar
                    ? "١. حدد اللون المراد الرفع له:"
                    : "1. Select Colour for Upload:"}
                </label>
                <select
                  value={batchUploadColour}
                  onChange={(e) => setBatchUploadColour(e.target.value)}
                  className="mb-4 h-10 w-full border border-black/15 bg-white px-3 text-xs font-medium text-neutral-800 outline-hidden focus:border-[#0e7468]"
                >
                  <option value="">
                    {ar
                      ? "كافة الألوان (صور عامة)"
                      : "All Colours (General Images)"}
                  </option>
                  {colours.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.en} / {c.ar}
                    </option>
                  ))}
                </select>

                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 mb-2">
                  {ar
                    ? "٢. اختر ملفات الصور (واحدة أو أكثر):"
                    : "2. Choose Image Files (One or Multiple):"}
                </label>
                <label className="flex h-11 cursor-pointer items-center justify-center gap-2 border border-[#0e7468] bg-[#0e7468]/5 px-4 text-xs font-bold text-[#0e7468] hover:bg-[#0e7468]/10 transition">
                  <ImagePlus size={16} />
                  <span>
                    {ar
                      ? "اختر صور من جهازك (JPG, PNG, WebP)"
                      : "Select Images (JPG, PNG, WebP)"}
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="sr-only"
                    onChange={handleFilesChosen}
                  />
                </label>
              </div>

              {/* URL Adder */}
              <div className="rounded-xs border border-black/10 bg-[#fafafa] p-4">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 mb-2">
                  {ar
                    ? "أو أضف رابط صورة خارجي (URL):"
                    : "Or Add External Image URL:"}
                </label>
                <div className="space-y-3">
                  <input
                    type="url"
                    value={newUrlInput}
                    onChange={(e) => setNewUrlInput(e.target.value)}
                    placeholder="https://..."
                    className="h-10 w-full border border-black/15 bg-white px-3 text-xs"
                  />
                  <div className="flex gap-2">
                    <select
                      value={newUrlColour}
                      onChange={(e) => setNewUrlColour(e.target.value)}
                      className="h-10 flex-1 border border-black/15 bg-white px-3 text-xs"
                    >
                      <option value="">
                        {ar ? "كافة الألوان" : "All Colours"}
                      </option>
                      {colours.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.en} / {c.ar}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddUrl}
                      className="inline-flex h-10 items-center gap-1.5 border border-black/20 bg-white px-4 text-xs font-bold hover:bg-neutral-50 transition"
                    >
                      <Plus size={14} />
                      <span>{ar ? "إضافة" : "Add"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hidden Form Inputs */}
          <input
            type="hidden"
            name="existing_images"
            value={JSON.stringify(existingImages)}
          />
          <input
            type="hidden"
            name="new_images_metadata"
            value={JSON.stringify(
              newFiles.map((f, idx) => ({
                index: idx,
                colourCode: f.colourCode || null,
                position: f.position,
              })),
            )}
          />
          <input
            type="hidden"
            name="new_image_urls"
            value={JSON.stringify(
              newUrls.map((u) => ({
                src: u.url,
                colourCode: u.colourCode || null,
                position: u.position,
              })),
            )}
          />
          <input
            ref={fileInputRef}
            type="file"
            name="new_images"
            multiple
            className="sr-only"
            tabIndex={-1}
            readOnly
          />
        </section>

        {/* Section 5: Colours & Palette */}
        <section className="border border-black/10 bg-[#f8faf9] p-6 shadow-xs md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-4">
            <div>
              <h2 className="font-serif text-2xl font-bold text-neutral-900">
                {ar ? "ألوان وتشكيلة المنتج" : "Colours & Palette"}
              </h2>
              <p className="mt-1 text-xs text-neutral-500">
                {ar
                  ? "تعديل الألوان النشطة وإضافة ألوان جديدة وتحديد الكود والدرجة اللونية."
                  : "Edit active colors, add new shades, and configure codes and color swatches."}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setColours((items) => [
                  ...items,
                  { code: "", en: "", ar: "", hex: "#0e7468" },
                ])
              }
              className="inline-flex h-10 items-center gap-2 border border-black/20 bg-white px-4 text-xs font-bold uppercase tracking-wider text-neutral-800 hover:bg-neutral-50"
            >
              <Plus size={15} />
              <span>{ar ? "أضف لوناً جديداً" : "Add Colour"}</span>
            </button>
          </div>

          {/* Quick presets */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="self-center text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              {ar ? "ألوان سريعة:" : "Quick Palette:"}
            </span>
            {originalPalette.map((p) => {
              const selected = colours.some((c) => c.code === p.code);
              return (
                <button
                  key={p.code}
                  type="button"
                  disabled={selected}
                  onClick={() => setColours((items) => [...items, p])}
                  className="inline-flex items-center gap-2 border border-black/15 bg-white px-3 py-1.5 text-xs disabled:opacity-40 hover:border-black/30 transition"
                >
                  <span
                    className="size-3 rounded-full border border-black/15 shrink-0"
                    style={{ backgroundColor: p.hex }}
                  />
                  <span>{ar ? p.ar : p.en}</span>
                </button>
              );
            })}
          </div>

          {/* Colours list */}
          <div className="mt-6 grid gap-3">
            {colours.map((c, index) => (
              <div
                key={index}
                className="grid gap-3 border border-black/10 bg-white p-4 sm:grid-cols-[1fr_1fr_1fr_80px_auto] items-end"
              >
                <Label text={ar ? "الاسم EN" : "Name EN"}>
                  <input
                    required
                    value={c.en}
                    onChange={(e) =>
                      setColours((items) =>
                        items.map((it, i) =>
                          i === index ? { ...it, en: e.target.value } : it,
                        ),
                      )
                    }
                    className={inputClass}
                    placeholder="Navy"
                  />
                </Label>
                <Label text={ar ? "الاسم AR" : "Name AR"}>
                  <input
                    required
                    dir="rtl"
                    value={c.ar}
                    onChange={(e) =>
                      setColours((items) =>
                        items.map((it, i) =>
                          i === index ? { ...it, ar: e.target.value } : it,
                        ),
                      )
                    }
                    className={inputClass}
                    placeholder="كحلي"
                  />
                </Label>
                <Label text={ar ? "الكود (Code)" : "Code"}>
                  <input
                    required
                    value={c.code}
                    onChange={(e) =>
                      setColours((items) =>
                        items.map((it, i) =>
                          i === index
                            ? { ...it, code: slugify(e.target.value) }
                            : it,
                        ),
                      )
                    }
                    className={inputClass}
                    placeholder="navy"
                  />
                </Label>
                <Label text={ar ? "الدرجة" : "Swatch"}>
                  <input
                    type="color"
                    value={c.hex}
                    onChange={(e) =>
                      setColours((items) =>
                        items.map((it, i) =>
                          i === index ? { ...it, hex: e.target.value } : it,
                        ),
                      )
                    }
                    className={`${inputClass} p-1 cursor-pointer`}
                  />
                </Label>
                <button
                  type="button"
                  disabled={colours.length === 1}
                  onClick={() =>
                    setColours((items) => items.filter((_, i) => i !== index))
                  }
                  aria-label={ar ? "حذف اللون" : "Remove colour"}
                  className="mb-0.5 grid size-11 place-items-center border border-black/15 bg-white text-neutral-500 hover:text-red-700 disabled:opacity-30 transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          {errorFor("colours") && (
            <p className="mt-3 text-xs text-red-700">{errorFor("colours")}</p>
          )}
        </section>

        {/* Section 6: Sizes */}
        <section className="border border-black/10 bg-white p-6 shadow-xs md:p-8">
          <div className="border-b border-black/10 pb-4">
            <h2 className="font-serif text-2xl font-bold text-neutral-900">
              {ar ? "المقاسات المتاحة" : "Available Sizes"}
            </h2>
            <p className="mt-1 text-xs text-neutral-500">
              {ar
                ? "أدخل المقاسات مفصولة بفواصل (مثال: XS, S, M, L, XL, 2XL)."
                : "Comma-separated size designations (e.g. XS, S, M, L, XL, 2XL)."}
            </p>
          </div>

          <div className="mt-6">
            <Label
              text={ar ? "قائمة المقاسات" : "Sizes List"}
              hint={ar ? "افصل بين المقاسات بفواصل" : "Comma separated"}
              error={errorFor("sizes")}
            >
              <input
                name="sizes"
                required
                defaultValue={initialSizes}
                className={inputClass}
              />
            </Label>
          </div>
        </section>

        {/* Section 7: Existing Variants Inventory Preview */}
        {product.product_variants.length > 0 && (
          <section className="border border-black/10 bg-white p-6 shadow-xs md:p-8">
            <div className="border-b border-black/10 pb-4">
              <h2 className="font-serif text-2xl font-bold text-neutral-900">
                {ar ? "المتغيرات والمخزون الحالي" : "Current Variants & Stock"}
              </h2>
              <p className="mt-1 text-xs text-neutral-500">
                {ar
                  ? "نظرة عامة على متغيرات المنتج الحالية ومستويات المخزون لكل كود."
                  : "Overview of existing SKU variants and current stock quantities."}
              </p>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-start text-xs">
                <thead className="bg-[#073b36] text-[10px] font-bold uppercase tracking-wider text-white">
                  <tr>
                    <th className="px-4 py-3 text-start">
                      {ar ? "كود SKU" : "SKU"}
                    </th>
                    <th className="px-4 py-3 text-start">
                      {ar ? "الحالة" : "Status"}
                    </th>
                    <th className="px-4 py-3 text-start">
                      {ar ? "المخزون المتوفر" : "On Hand"}
                    </th>
                    <th className="px-4 py-3 text-start">
                      {ar ? "المحجوز" : "Reserved"}
                    </th>
                    <th className="px-4 py-3 text-start">
                      {ar ? "حد التنبيه" : "Alert Threshold"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10 border border-t-0 border-black/10">
                  {product.product_variants.map((v) => (
                    <tr key={v.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 font-mono font-medium text-neutral-800">
                        {v.sku}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase ${
                            v.is_active
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-neutral-100 text-neutral-500"
                          }`}
                        >
                          {v.is_active
                            ? ar
                              ? "نشط"
                              : "Active"
                            : ar
                              ? "معطل"
                              : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold">
                        {v.inventory?.on_hand ?? 0}
                      </td>
                      <td className="px-4 py-3 text-neutral-500">
                        {v.inventory?.reserved ?? 0}
                      </td>
                      <td className="px-4 py-3 text-neutral-500">
                        {v.inventory?.low_stock_threshold ?? 3}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Sticky Action Footer */}
        <div className="sticky bottom-0 z-20 flex items-center justify-between gap-4 border border-black/10 bg-white/95 p-4 shadow-lg backdrop-blur-md md:px-8">
          <Link
            href={`/${locale}/admin#products-list`}
            className="text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-black hover:underline"
          >
            {ar ? "إلغاء التعديلات" : "Cancel"}
          </Link>

          <button
            type="submit"
            disabled={pending}
            className="flex h-12 min-w-44 items-center justify-center gap-2 bg-[#073b36] px-6 text-xs font-bold uppercase tracking-[.15em] text-white hover:bg-[#0e7468] transition disabled:opacity-60 shadow-md"
          >
            {pending ? (
              <LoaderCircle className="animate-spin" size={17} />
            ) : (
              <Save size={17} />
            )}
            <span>
              {pending
                ? ar
                  ? "جارٍ الحفظ…"
                  : "Saving…"
                : ar
                  ? "حفظ جميع التعديلات"
                  : "Save All Changes"}
            </span>
          </button>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => {
            if (!isDeleting) setShowDeleteModal(false);
          }}
        >
          <div
            className="relative w-full max-w-md border border-black/10 bg-white p-6 shadow-2xl md:p-7"
            onClick={(e) => e.stopPropagation()}
            dir={ar ? "rtl" : "ltr"}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-full bg-red-100 text-red-700 shrink-0">
                  <TriangleAlert size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.14em] text-red-700">
                    {ar
                      ? "إجراء خطير لا يمكن التراجع عنه"
                      : "Destructive Action"}
                  </p>
                  <h3
                    id="delete-modal-title"
                    className="font-serif text-2xl font-bold text-neutral-900"
                  >
                    {ar ? "حذف المنتج نهائياً؟" : "Delete Product Permanently?"}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isDeleting) setShowDeleteModal(false);
                }}
                disabled={isDeleting}
                aria-label={ar ? "إغلاق" : "Close"}
                className="grid size-8 place-items-center border border-black/10 text-neutral-500 hover:bg-neutral-100 hover:text-black transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 text-xs leading-relaxed text-neutral-600">
              <p>
                {ar ? (
                  <>
                    هل أنت متأكد من رغبتك في حذف المنتج{" "}
                    <strong className="text-black font-semibold">
                      «{titleAr || titleEn || product.slug}»
                    </strong>{" "}
                    نهائياً من المتجر؟
                  </>
                ) : (
                  <>
                    Are you sure you want to permanently delete{" "}
                    <strong className="text-black font-semibold">
                      &quot;{titleEn || titleAr || product.slug}&quot;
                    </strong>{" "}
                    from the catalogue?
                  </>
                )}
              </p>
              <p className="mt-2 text-[11px] text-neutral-500">
                {ar
                  ? "سيتم حذف هذا المنتج وجميع متغيراته ومخزونه وصوره وقوائم الرغبات نهائياً من قاعدة البيانات. سجلات الطلبات التاريخية للعملاء ستبقى محفوظة بالكامل دون أي تعديل."
                  : "This product, its variants, inventory records, and images will be permanently removed from the database. Existing customer order histories and invoices will remain completely preserved."}
              </p>
            </div>

            {deleteError && (
              <div
                role="alert"
                className="mt-4 border border-red-300 bg-red-50 p-3 text-xs text-red-800"
              >
                {deleteError}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-black/10 pt-4">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="h-10 border border-black/20 bg-white px-4 text-xs font-bold uppercase tracking-wider text-neutral-700 hover:bg-neutral-50 transition disabled:opacity-50"
              >
                {ar ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="flex h-10 min-w-32 items-center justify-center gap-2 bg-red-700 px-5 text-xs font-bold uppercase tracking-wider text-white hover:bg-red-800 transition disabled:opacity-50"
              >
                {isDeleting ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : (
                  <Trash2 size={15} />
                )}
                <span>
                  {isDeleting
                    ? ar
                      ? "جارٍ الحذف…"
                      : "Deleting…"
                    : ar
                      ? "تأكيد الحذف النهائي"
                      : "Confirm Delete"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Label({
  text,
  hint,
  error,
  children,
}: {
  text: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-[10px] font-bold uppercase tracking-[.14em] text-neutral-600">
      <span>{text}</span>
      {hint && (
        <span className="ms-2 normal-case tracking-normal text-neutral-400">
          {hint}
        </span>
      )}
      {children}
      {error && (
        <span className="mt-1 block text-[11px] normal-case tracking-normal text-red-700">
          {error}
        </span>
      )}
    </label>
  );
}
