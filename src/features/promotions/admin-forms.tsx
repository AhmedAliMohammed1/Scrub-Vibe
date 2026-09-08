"use client";

import { Loader2 } from "lucide-react";
import { useActionState } from "react";
import type { Locale } from "@/lib/i18n";
import {
  saveCampaignAction,
  saveDiscountCodeAction,
  type PromotionActionState,
} from "./admin-actions";

export type AdminCampaign = {
  id: number;
  name_en: string;
  name_ar: string;
  description_en: string | null;
  description_ar: string | null;
  channel: string;
  utm_campaign: string | null;
  budget_minor: number | null;
  starts_on: string;
  ends_on: string;
  is_active: boolean;
};

export type AdminDiscountCode = {
  id: number;
  campaign_id: number | null;
  code: string;
  discount_type: "percentage" | "fixed";
  value: number;
  minimum_subtotal_minor: number;
  maximum_discount_minor: number | null;
  usage_limit: number | null;
  per_customer_limit: number;
  starts_on: string | null;
  ends_on: string | null;
  is_active: boolean;
};

const initialState: PromotionActionState = { status: "idle", message: "" };
const inputClass =
  "mt-2 h-11 w-full border border-black/15 bg-white px-3 text-sm outline-none focus:border-[#0e7468]";
const textareaClass =
  "mt-2 min-h-20 w-full border border-black/15 bg-white p-3 text-sm outline-none focus:border-[#0e7468]";

export function CampaignForm({
  locale,
  campaign,
  today,
}: {
  locale: Locale;
  campaign?: AdminCampaign;
  today: string;
}) {
  const ar = locale === "ar";
  const [state, action, pending] = useActionState(
    saveCampaignAction,
    initialState,
  );
  const nextMonth = new Date(`${today}T12:00:00Z`);
  nextMonth.setUTCDate(nextMonth.getUTCDate() + 30);
  return (
    <form
      action={action}
      className="border border-black/10 bg-white p-5 md:p-6"
    >
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="campaignId" value={campaign?.id ?? ""} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow text-[#0e7468]">
            {campaign
              ? ar
                ? "تعديل الحملة"
                : "EDIT CAMPAIGN"
              : ar
                ? "حملة جديدة"
                : "NEW CAMPAIGN"}
          </p>
          {campaign && (
            <h3 className="mt-2 font-serif text-3xl">
              {ar ? campaign.name_ar : campaign.name_en}
            </h3>
          )}
        </div>
        <ActiveSwitch
          ar={ar}
          defaultChecked={campaign?.is_active ?? true}
          label={ar ? "الحملة نشطة" : "Campaign active"}
        />
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label={ar ? "الاسم بالإنجليزية" : "English name"}>
          <input
            name="nameEn"
            required
            minLength={2}
            maxLength={120}
            defaultValue={campaign?.name_en ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label={ar ? "الاسم بالعربية" : "Arabic name"}>
          <input
            name="nameAr"
            required
            minLength={2}
            maxLength={120}
            dir="rtl"
            defaultValue={campaign?.name_ar ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label={ar ? "الوصف بالإنجليزية" : "English description"}>
          <textarea
            name="descriptionEn"
            maxLength={1000}
            defaultValue={campaign?.description_en ?? ""}
            className={textareaClass}
          />
        </Field>
        <Field label={ar ? "الوصف بالعربية" : "Arabic description"}>
          <textarea
            name="descriptionAr"
            maxLength={1000}
            dir="rtl"
            defaultValue={campaign?.description_ar ?? ""}
            className={textareaClass}
          />
        </Field>
        <Field label={ar ? "قناة التسويق" : "Marketing channel"}>
          <select
            name="channel"
            defaultValue={campaign?.channel ?? "instagram"}
            className={inputClass}
          >
            {[
              "instagram",
              "facebook",
              "tiktok",
              "whatsapp",
              "email",
              "influencer",
              "offline",
              "other",
            ].map((channel) => (
              <option key={channel}>{channel}</option>
            ))}
          </select>
        </Field>
        <Field label="UTM campaign">
          <input
            name="utmCampaign"
            maxLength={150}
            pattern="[A-Za-z0-9._-]+"
            defaultValue={campaign?.utm_campaign ?? ""}
            placeholder="summer_scrubs_2026"
            className={inputClass}
          />
        </Field>
        <Field
          label={
            ar
              ? "ميزانية الخصومات (ج.م، اختياري)"
              : "Discount budget (EGP, optional)"
          }
        >
          <input
            name="budget"
            type="number"
            min="0.01"
            step="0.01"
            defaultValue={
              campaign?.budget_minor ? campaign.budget_minor / 100 : ""
            }
            className={inputClass}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={ar ? "يبدأ" : "Starts"}>
            <input
              name="startsOn"
              type="date"
              required
              defaultValue={campaign?.starts_on ?? today}
              className={inputClass}
            />
          </Field>
          <Field label={ar ? "ينتهي" : "Ends"}>
            <input
              name="endsOn"
              type="date"
              required
              defaultValue={
                campaign?.ends_on ?? nextMonth.toISOString().slice(0, 10)
              }
              className={inputClass}
            />
          </Field>
        </div>
      </div>
      <FormFooter
        ar={ar}
        pending={pending}
        state={state}
        label={ar ? "حفظ الحملة" : "Save campaign"}
      />
    </form>
  );
}

export function DiscountCodeForm({
  locale,
  campaigns,
  discountCode,
}: {
  locale: Locale;
  campaigns: AdminCampaign[];
  discountCode?: AdminDiscountCode;
}) {
  const ar = locale === "ar";
  const [state, action, pending] = useActionState(
    saveDiscountCodeAction,
    initialState,
  );
  return (
    <form
      action={action}
      className="border border-black/10 bg-white p-5 md:p-6"
    >
      <input type="hidden" name="locale" value={locale} />
      <input
        type="hidden"
        name="discountCodeId"
        value={discountCode?.id ?? ""}
      />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow text-[#0e7468]">
            {discountCode
              ? ar
                ? "تعديل الكود"
                : "EDIT CODE"
              : ar
                ? "كود خصم جديد"
                : "NEW DISCOUNT CODE"}
          </p>
          {discountCode && (
            <h3 className="mt-2 font-mono text-2xl font-bold">
              {discountCode.code}
            </h3>
          )}
        </div>
        <ActiveSwitch
          ar={ar}
          defaultChecked={discountCode?.is_active ?? true}
          label={ar ? "الكود نشط" : "Code active"}
        />
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label={ar ? "الكود" : "Code"}>
          <input
            name="code"
            required
            minLength={3}
            maxLength={32}
            pattern="[A-Za-z0-9][A-Za-z0-9_-]*"
            defaultValue={discountCode?.code ?? ""}
            className={`${inputClass} font-mono uppercase`}
          />
        </Field>
        <Field label={ar ? "الحملة (اختياري)" : "Campaign (optional)"}>
          <select
            name="campaignId"
            defaultValue={discountCode?.campaign_id ?? ""}
            className={inputClass}
          >
            <option value="">{ar ? "بدون حملة" : "No campaign"}</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {ar ? campaign.name_ar : campaign.name_en}
              </option>
            ))}
          </select>
        </Field>
        <Field label={ar ? "نوع الخصم" : "Discount type"}>
          <select
            name="discountType"
            defaultValue={discountCode?.discount_type ?? "percentage"}
            className={inputClass}
          >
            <option value="percentage">
              {ar ? "نسبة مئوية" : "Percentage"}
            </option>
            <option value="fixed">{ar ? "مبلغ ثابت" : "Fixed amount"}</option>
          </select>
        </Field>
        <Field label={ar ? "القيمة (% أو ج.م)" : "Value (% or EGP)"}>
          <input
            name="value"
            type="number"
            min="0.01"
            step="0.01"
            required
            defaultValue={discountCode ? discountCode.value / 100 : 10}
            className={inputClass}
          />
        </Field>
        <Field label={ar ? "الحد الأدنى للطلب (ج.م)" : "Minimum order (EGP)"}>
          <input
            name="minimumSubtotal"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={(discountCode?.minimum_subtotal_minor ?? 0) / 100}
            className={inputClass}
          />
        </Field>
        <Field
          label={
            ar ? "أقصى خصم للنسبة (اختياري)" : "Percentage cap (EGP, optional)"
          }
        >
          <input
            name="maximumDiscount"
            type="number"
            min="0.01"
            step="0.01"
            defaultValue={
              discountCode?.maximum_discount_minor
                ? discountCode.maximum_discount_minor / 100
                : ""
            }
            className={inputClass}
          />
        </Field>
        <Field label={ar ? "إجمالي مرات الاستخدام" : "Total usage limit"}>
          <input
            name="usageLimit"
            type="number"
            min="1"
            step="1"
            defaultValue={discountCode?.usage_limit ?? ""}
            placeholder={ar ? "غير محدود" : "Unlimited"}
            className={inputClass}
          />
        </Field>
        <Field label={ar ? "لكل عميل" : "Per-customer limit"}>
          <input
            name="perCustomerLimit"
            type="number"
            min="1"
            max="100"
            step="1"
            required
            defaultValue={discountCode?.per_customer_limit ?? 1}
            className={inputClass}
          />
        </Field>
        <Field label={ar ? "بداية خاصة (اختياري)" : "Code starts (optional)"}>
          <input
            name="startsOn"
            type="date"
            defaultValue={discountCode?.starts_on ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label={ar ? "نهاية خاصة (اختياري)" : "Code ends (optional)"}>
          <input
            name="endsOn"
            type="date"
            defaultValue={discountCode?.ends_on ?? ""}
            className={inputClass}
          />
        </Field>
      </div>
      <p className="mt-4 text-[11px] leading-5 text-neutral-500">
        {ar
          ? "الكود بدون تواريخ خاصة يتبع تواريخ الحملة. الخصم الثابت بالجنيه؛ خصم النسبة يقبل حداً أقصى اختيارياً."
          : "A code without its own dates follows its campaign schedule. Fixed values are EGP; percentage codes may have an optional EGP cap."}
      </p>
      <FormFooter
        ar={ar}
        pending={pending}
        state={state}
        label={ar ? "حفظ الكود" : "Save code"}
      />
    </form>
  );
}

function ActiveSwitch({
  defaultChecked,
  label,
}: {
  ar: boolean;
  defaultChecked: boolean;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 text-xs font-bold">
      <input
        type="checkbox"
        name="isActive"
        defaultChecked={defaultChecked}
        className="size-4 accent-[#0e7468]"
      />
      {label}
    </label>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="text-xs font-bold text-neutral-700">
      {label}
      {children}
    </label>
  );
}
function FormFooter({
  pending,
  state,
  label,
}: {
  ar: boolean;
  pending: boolean;
  state: PromotionActionState;
  label: string;
}) {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-5">
      <p
        aria-live="polite"
        className={`text-xs ${state.status === "error" ? "text-[#a6432b]" : "text-[#0e7468]"}`}
      >
        {state.message}
      </p>
      <button
        disabled={pending}
        className="flex h-11 min-w-36 items-center justify-center gap-2 bg-[#073b36] px-5 text-[10px] font-bold uppercase tracking-[.14em] text-white disabled:opacity-50"
      >
        {pending && <Loader2 size={15} className="animate-spin" />}
        {label}
      </button>
    </div>
  );
}
