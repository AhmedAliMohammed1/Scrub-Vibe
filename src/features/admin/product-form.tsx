"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  ImagePlus,
  LoaderCircle,
  PackagePlus,
  Plus,
  Trash2,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { createProductAction, type AdminActionState } from "./actions";

type Category = { id: number; slug: string; name: string };

const initialState: AdminActionState = { status: "idle" };
const input =
  "mt-2 h-11 w-full border border-black/15 bg-white px-3 text-sm outline-none transition focus:border-[#0e7468] focus:ring-2 focus:ring-[#0e7468]/10";
const textarea = `${input} h-28 py-3 resize-y`;
type ColourInput = { code: string; en: string; ar: string; hex: string };
const defaultColour: ColourInput = {
  code: "navy",
  en: "Navy",
  ar: "كحلي",
  hex: "#172c52",
};
const originalPalette: ColourInput[] = [
  { code: "burgundy", en: "Burgundy", ar: "نبيتي", hex: "#6f182f" },
  { code: "black", en: "Black", ar: "أسود", hex: "#171717" },
  { code: "stone", en: "Stone", ar: "حجري", hex: "#a89e91" },
  { code: "charcoal", en: "Charcoal", ar: "فحمي", hex: "#34363d" },
  { code: "sky-blue", en: "Sky blue", ar: "سماوي", hex: "#a8cce7" },
  defaultColour,
  { code: "olive", en: "Olive", ar: "زيتوني", hex: "#4f5041" },
  { code: "teal", en: "Teal", ar: "بترولي", hex: "#07516a" },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function ProductForm({
  locale,
  categories,
}: {
  locale: Locale;
  categories: Category[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [slug, setSlug] = useState("");
  const slugTouched = useRef(false);
  const [colours, setColours] = useState<ColourInput[]>([defaultColour]);
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
      position: (newFiles.length + newUrls.length + idx + 1) * 10,
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
      position: (newFiles.length + newUrls.length + 1) * 10,
    };
    setNewUrls((prev) => [...prev, item]);
    setNewUrlInput("");
  };

  const handleColourCodeChange = (index: number, rawVal: string) => {
    const oldCode = colours[index]?.code;
    const newCode = rawVal
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    setColours((items) =>
      items.map((it, i) => (i === index ? { ...it, code: newCode } : it)),
    );

    if (oldCode && oldCode !== newCode) {
      setNewFiles((prev) =>
        prev.map((nf) =>
          nf.colourCode === oldCode ? { ...nf, colourCode: newCode } : nf,
        ),
      );
      setNewUrls((prev) =>
        prev.map((nu) =>
          nu.colourCode === oldCode ? { ...nu, colourCode: newCode } : nu,
        ),
      );
    }
  };

  const handleColourCodeBlur = (index: number) => {
    const code = colours[index]?.code ?? "";
    const cleaned = code.replace(/^-+|-+$/g, "");
    if (cleaned !== code) {
      handleColourCodeChange(index, cleaned);
    }
  };

  const handleRemoveColour = (index: number) => {
    const codeToRemove = colours[index]?.code;
    setColours((items) => items.filter((_, i) => i !== index));
    if (codeToRemove) {
      setNewFiles((prev) =>
        prev.map((nf) =>
          nf.colourCode === codeToRemove ? { ...nf, colourCode: "" } : nf,
        ),
      );
      setNewUrls((prev) =>
        prev.map((nu) =>
          nu.colourCode === codeToRemove ? { ...nu, colourCode: "" } : nu,
        ),
      );
    }
  };

  const ar = locale === "ar";
  const [state, formAction, pending] = useActionState(
    async (previousState: AdminActionState, formData: FormData) => {
      const nextState = await createProductAction(previousState, formData);
      if (nextState.status === "success") {
        formRef.current?.reset();
        slugTouched.current = false;
        setSlug("");
        setColours([defaultColour]);
        setNewFiles([]);
        setNewUrls([]);
      }
      return nextState;
    },
    initialState,
  );

  const errorFor = (name: string) => state.fieldErrors?.[name]?.[0];

  return (
    <form
      ref={formRef}
      action={formAction}
      className="border border-black/10 bg-white p-5 shadow-[0_25px_70px_rgba(10,50,45,.07)] md:p-8"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="colours" value={JSON.stringify(colours)} />
      <input type="hidden" name="imageUrl" value="" />
      <div className="flex items-start justify-between gap-4 border-b border-black/10 pb-6">
        <div>
          <p className="eyebrow text-[#0e7468]">
            {ar ? "منتج جديد" : "NEW PRODUCT"}
          </p>
          <h2 className="mt-2 font-serif text-3xl">
            {ar ? "أضف تصميماً" : "Add a design"}
          </h2>
          <p className="mt-2 max-w-lg text-xs leading-5 text-neutral-500">
            {ar
              ? "أنشئ المنتج والترجمات والمقاسات والمخزون والصورة في خطوة واحدة."
              : "Create the product, translations, sizes, inventory, and image in one workflow."}
          </p>
        </div>
        <PackagePlus className="text-[#0e7468]" strokeWidth={1.4} />
      </div>

      {state.message && (
        <div
          className={`mt-5 border px-4 py-3 text-xs ${
            state.status === "success"
              ? "border-emerald-700/20 bg-emerald-50 text-emerald-800"
              : "border-red-700/20 bg-red-50 text-red-800"
          }`}
          role={state.status === "error" ? "alert" : "status"}
        >
          <div className="flex items-start gap-2">
            {state.status === "success" && (
              <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-700" size={15} />
            )}
            <div>
              <p className="font-semibold">{state.message}</p>
              {state.status === "error" && state.fieldErrors && Object.keys(state.fieldErrors).length > 0 && (
                <ul className="mt-2 list-disc ps-5 text-[11px] space-y-1 text-red-800">
                  {Object.entries(state.fieldErrors).flatMap(([field, errors]) =>
                    (errors ?? []).map((err, errIdx) => (
                      <li key={`${field}-${errIdx}`}>
                        <strong className="capitalize">{field}</strong>: {err}
                      </li>
                    )),
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <fieldset disabled={pending} className="mt-7 grid gap-6">
        <div className="grid gap-5 md:grid-cols-2">
          <Label
            text={ar ? "الاسم بالإنجليزية" : "English name"}
            error={errorFor("titleEn")}
          >
            <input
              name="titleEn"
              required
              maxLength={140}
              className={input}
              onChange={(event) => {
                if (!slugTouched.current) setSlug(slugify(event.target.value));
              }}
              placeholder="Women’s Flex Scrub Set"
            />
          </Label>
          <Label
            text={ar ? "الاسم بالعربية" : "Arabic name"}
            error={errorFor("titleAr")}
          >
            <input
              name="titleAr"
              dir="rtl"
              required
              maxLength={140}
              className={input}
              placeholder="طقم سكراب فليكس حريمي"
            />
          </Label>
        </div>

        <Label
          text={ar ? "الرابط المختصر" : "Product slug"}
          error={errorFor("slug")}
          hint="lowercase-words-with-dashes"
        >
          <input
            name="slug"
            required
            value={slug}
            className={input}
            onChange={(event) => {
              slugTouched.current = true;
              setSlug(slugify(event.target.value));
            }}
          />
        </Label>

        <div className="grid gap-5 md:grid-cols-2">
          <Label
            text={ar ? "الوصف بالإنجليزية" : "English description"}
            error={errorFor("descriptionEn")}
          >
            <textarea
              name="descriptionEn"
              maxLength={3000}
              className={textarea}
            />
          </Label>
          <Label
            text={ar ? "الوصف بالعربية" : "Arabic description"}
            error={errorFor("descriptionAr")}
          >
            <textarea
              name="descriptionAr"
              dir="rtl"
              maxLength={3000}
              className={textarea}
            />
          </Label>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Label
            text={ar ? "التصنيف" : "Category"}
            error={errorFor("categoryId")}
          >
            <select
              name="categoryId"
              required
              className={input}
              defaultValue=""
            >
              <option value="" disabled>
                {ar ? "اختر التصنيف" : "Choose category"}
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </Label>
          <Label text={ar ? "الفئة" : "Audience"} error={errorFor("gender")}>
            <select name="gender" className={input} defaultValue="women">
              <option value="women">{ar ? "نساء" : "Women"}</option>
              <option value="men">{ar ? "رجال" : "Men"}</option>
              <option value="unisex">{ar ? "للجميع" : "Unisex"}</option>
              <option value="girls">{ar ? "بنات" : "Girls"}</option>
              <option value="boys">{ar ? "أولاد" : "Boys"}</option>
            </select>
          </Label>
          <Label text={ar ? "الحالة" : "Status"} error={errorFor("status")}>
            <select name="status" className={input} defaultValue="draft">
              <option value="draft">{ar ? "مسودة" : "Draft"}</option>
              <option value="active">{ar ? "نشر الآن" : "Publish now"}</option>
            </select>
          </Label>
          <Label text={ar ? "الخامة" : "Material"} error={errorFor("material")}>
            <input
              name="material"
              maxLength={120}
              className={input}
              placeholder={ar ? "قطن / سباندكس" : "Cotton / spandex"}
            />
          </Label>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Label
            text={ar ? "السعر (ج.م)" : "Price (EGP)"}
            error={errorFor("price")}
          >
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              required
              className={input}
              placeholder="850"
            />
          </Label>
          <Label
            text={ar ? "قبل الخصم" : "Compare at"}
            error={errorFor("compareAt")}
          >
            <input
              name="compareAt"
              type="number"
              min="0"
              step="0.01"
              className={input}
              placeholder="1000"
            />
          </Label>
          <Label
            text={ar ? "مقدم الدفع عند الاستلام" : "COD deposit (EGP)"}
            error={errorFor("codDeposit")}
            hint={ar ? "مطلوب قبل تأكيد الطلب" : "Required before order confirmation"}
          >
            <input
              name="codDeposit"
              type="number"
              min="0.01"
              step="0.01"
              required
              className={input}
              placeholder="100"
            />
          </Label>
          <Label
            text={ar ? "التكلفة" : "Unit cost"}
            error={errorFor("cost")}
            hint={ar ? "لتحليل هامش الربح" : "For margin analysis"}
          >
            <input
              name="cost"
              type="number"
              min="0"
              step="0.01"
              className={input}
              placeholder="420"
            />
          </Label>
          <Label text={ar ? "القَصّة" : "Fit"} error={errorFor("fit")}>
            <input
              name="fit"
              maxLength={120}
              className={input}
              placeholder={ar ? "مريح" : "Relaxed"}
            />
          </Label>
        </div>

        <fieldset className="border border-black/10 bg-[#f8faf9] p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <legend className="text-[10px] font-bold uppercase tracking-[.14em] text-neutral-600">
                {ar ? "ألوان المنتج" : "Product colours"}
              </legend>
              <p className="mt-1 text-xs text-neutral-500">
                {ar
                  ? "سيتم إنشاء مخزون مستقل لكل تركيبة لون ومقاس."
                  : "A separate stock variant is created for every colour and size combination."}
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
              className="inline-flex h-9 items-center gap-2 border border-black/20 bg-white px-3 text-[10px] font-bold uppercase"
            >
              <Plus size={14} /> {ar ? "أضف لوناً" : "Add colour"}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {originalPalette.map((colour) => {
              const selected = colours.some(
                (item) => item.code === colour.code,
              );
              return (
                <button
                  key={colour.code}
                  type="button"
                  disabled={selected}
                  onClick={() => setColours((items) => [...items, colour])}
                  className="flex items-center gap-2 border border-black/15 bg-white px-3 py-2 text-[10px] disabled:opacity-40"
                >
                  <span
                    className="size-3 rounded-full border border-black/15"
                    style={{ backgroundColor: colour.hex }}
                  />
                  {ar ? colour.ar : colour.en}
                </button>
              );
            })}
          </div>

          <div className="mt-5 grid gap-3">
            {colours.map((colour, index) => (
              <div
                key={index}
                className="grid gap-3 border-t border-black/10 pt-3 sm:grid-cols-[1fr_1fr_1fr_80px_auto]"
              >
                <Label text={ar ? "الاسم EN" : "Name EN"}>
                  <input
                    required
                    value={colour.en}
                    onChange={(event) =>
                      setColours((items) =>
                        items.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, en: event.target.value }
                            : item,
                        ),
                      )
                    }
                    className={input}
                    placeholder="Royal blue"
                  />
                </Label>
                <Label text={ar ? "الاسم AR" : "Name AR"}>
                  <input
                    required
                    dir="rtl"
                    value={colour.ar}
                    onChange={(event) =>
                      setColours((items) =>
                        items.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, ar: event.target.value }
                            : item,
                        ),
                      )
                    }
                    className={input}
                    placeholder="أزرق ملكي"
                  />
                </Label>
                <Label
                  text={ar ? "الكود" : "Code"}
                  hint={ar ? "أحرف وشرطات (مثل: royal-blue)" : "lowercase & hyphens"}
                >
                  <input
                    required
                    value={colour.code}
                    onChange={(event) =>
                      handleColourCodeChange(index, event.target.value)
                    }
                    onBlur={() => handleColourCodeBlur(index)}
                    className={input}
                    placeholder="royal-blue"
                  />
                </Label>
                <Label text={ar ? "الدرجة" : "Swatch"}>
                  <input
                    type="color"
                    value={colour.hex}
                    onChange={(event) =>
                      setColours((items) =>
                        items.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, hex: event.target.value }
                            : item,
                        ),
                      )
                    }
                    className={`${input} p-1`}
                  />
                </Label>
                <button
                  type="button"
                  disabled={colours.length === 1}
                  onClick={() => handleRemoveColour(index)}
                  aria-label={ar ? "حذف اللون" : "Remove colour"}
                  className="mt-5 grid size-11 place-items-center border border-black/15 bg-white text-neutral-500 hover:text-red-700 disabled:opacity-30"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
          {errorFor("colours") && (
            <p className="mt-3 text-[11px] text-red-700">
              {errorFor("colours")}
            </p>
          )}
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Label
            text={ar ? "المقاسات" : "Sizes"}
            error={errorFor("sizes")}
            hint={ar ? "افصل بينها بفاصلة" : "Comma separated"}
          >
            <input
              name="sizes"
              required
              className={input}
              defaultValue="XS, S, M, L, XL, 2XL"
            />
          </Label>
          <Label
            text={ar ? "مخزون كل مقاس" : "Stock per size"}
            error={errorFor("stock")}
          >
            <input
              name="stock"
              type="number"
              min="0"
              required
              className={input}
              defaultValue="10"
            />
          </Label>
          <Label
            text={ar ? "تنبيه المخزون" : "Low-stock alert"}
            error={errorFor("lowStockThreshold")}
          >
            <input
              name="lowStockThreshold"
              type="number"
              min="0"
              required
              className={input}
              defaultValue="3"
            />
          </Label>
        </div>

        {/* Multi-Image Gallery Section */}
        <fieldset className="border border-black/10 bg-[#fafafa] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-4">
            <div>
              <legend className="font-serif text-xl font-bold text-neutral-900">
                {ar ? "معرض وصور المنتج والألوان" : "Media & Product Gallery"}
              </legend>
              <p className="mt-1 text-xs text-neutral-500">
                {ar
                  ? "أضف صوراً متعددة وحدد اللون الخاص بكل صورة، أو اجعلها صورة عامة لكافة الألوان."
                  : "Add multiple images and tag them to specific colours or all colours."}
              </p>
            </div>
            <span className="text-xs font-semibold text-neutral-500">
              {newFiles.length + newUrls.length}{" "}
              {ar ? "صور محددة" : "images selected"}
            </span>
          </div>

          {/* Pending Uploads Cards */}
          {(newFiles.length > 0 || newUrls.length > 0) && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {newFiles.map((nf) => {
                const assignedColour = colours.find(
                  (c) => c.code === nf.colourCode,
                );
                return (
                  <div
                    key={nf.id}
                    className="relative flex flex-col border border-black/10 bg-white p-3 shadow-2xs"
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-neutral-100 border border-black/5">
                      <Image
                        src={nf.previewUrl}
                        alt="Uploaded preview"
                        fill
                        sizes="180px"
                        className="object-cover object-top"
                      />
                      {assignedColour ? (
                        <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-neutral-800 shadow-xs">
                          <span
                            className="size-2.5 rounded-full border border-black/20"
                            style={{ backgroundColor: assignedColour.hex }}
                          />
                          <span>
                            {ar ? assignedColour.ar : assignedColour.en}
                          </span>
                        </div>
                      ) : (
                        <div className="absolute top-2 left-2 rounded-full bg-neutral-900/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
                          {ar ? "كافة الألوان" : "All Colours"}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setNewFiles((prev) =>
                            prev.filter((item) => item.id !== nf.id),
                          )
                        }
                        className="absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-white/90 text-neutral-600 hover:bg-red-50 hover:text-red-700 transition"
                        title={ar ? "إلغاء" : "Remove"}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="mt-2.5 space-y-1.5">
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
                        className="h-8 w-full border border-black/15 bg-white px-2 text-xs font-medium text-neutral-800 outline-hidden"
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
                  </div>
                );
              })}

              {newUrls.map((nu) => (
                <div
                  key={nu.id}
                  className="relative flex flex-col border border-black/10 bg-white p-3 shadow-2xs"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-neutral-100 border border-black/5">
                    <Image
                      src={nu.url}
                      alt="External image"
                      fill
                      sizes="180px"
                      className="object-cover object-top"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setNewUrls((prev) =>
                          prev.filter((item) => item.id !== nu.id),
                        )
                      }
                      className="absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-white/90 text-neutral-600 hover:bg-red-50 hover:text-red-700 transition"
                      title={ar ? "إلغاء" : "Remove"}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="mt-2.5 space-y-1.5">
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
                      className="h-8 w-full border border-black/15 bg-white px-2 text-xs font-medium text-neutral-800 outline-hidden"
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
                </div>
              ))}
            </div>
          )}

          {/* Upload and URL Controls */}
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="border border-black/10 bg-white p-3.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                {ar ? "١. اختر اللون المراد الرفع له:" : "1. Select Colour:"}
              </label>
              <select
                value={batchUploadColour}
                onChange={(e) => setBatchUploadColour(e.target.value)}
                className="mb-3 h-9 w-full border border-black/15 bg-white px-2.5 text-xs text-neutral-800"
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

              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                {ar ? "٢. اختر ملفات الصور:" : "2. Choose Images:"}
              </label>
              <label className="flex h-10 cursor-pointer items-center justify-center gap-2 border border-[#0e7468] bg-[#0e7468]/5 px-3 text-xs font-bold text-[#0e7468] hover:bg-[#0e7468]/10 transition">
                <ImagePlus size={15} />
                <span>{ar ? "رفع صور من جهازك" : "Upload Image Files"}</span>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  className="sr-only"
                  onChange={handleFilesChosen}
                />
              </label>
            </div>

            <div className="border border-black/10 bg-white p-3.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-600 mb-1.5">
                {ar
                  ? "أو أضف رابط صورة خارجي (URL):"
                  : "Or Add External Image URL:"}
              </label>
              <div className="space-y-2">
                <input
                  type="url"
                  value={newUrlInput}
                  onChange={(e) => setNewUrlInput(e.target.value)}
                  placeholder="https://..."
                  className="h-9 w-full border border-black/15 bg-white px-2.5 text-xs"
                />
                <div className="flex gap-2">
                  <select
                    value={newUrlColour}
                    onChange={(e) => setNewUrlColour(e.target.value)}
                    className="h-9 flex-1 border border-black/15 bg-white px-2 text-xs"
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
                    className="inline-flex h-9 items-center gap-1 border border-black/20 bg-white px-3 text-xs font-bold hover:bg-neutral-50 transition"
                  >
                    <Plus size={14} />
                    <span>{ar ? "إضافة" : "Add"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Hidden inputs */}
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
        </fieldset>

        <button className="flex h-13 items-center justify-center gap-2 bg-[#073b36] px-6 text-xs font-bold uppercase tracking-[.15em] text-white disabled:opacity-60">
          {pending ? (
            <LoaderCircle className="animate-spin" size={17} />
          ) : (
            <PackagePlus size={17} />
          )}
          {pending
            ? ar
              ? "جارٍ الإنشاء…"
              : "Creating…"
            : ar
              ? "إنشاء المنتج"
              : "Create product"}
        </button>
      </fieldset>
    </form>
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
