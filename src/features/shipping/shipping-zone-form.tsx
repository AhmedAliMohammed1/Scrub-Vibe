"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import {
  updateShippingZoneAction,
  type ShippingZoneActionState,
} from "./admin-actions";

export type AdminShippingZone = {
  id: number;
  code: string;
  name_en: string;
  name_ar: string;
  shipping_fee_minor: number;
  free_shipping_threshold_minor: number | null;
  cod_enabled: boolean;
  cod_surcharge_minor: number;
  delivery_min_days: number;
  delivery_max_days: number;
  is_active: boolean;
  shipping_governorates: { name_en: string; name_ar: string }[];
};

const initialState: ShippingZoneActionState = { status: "idle", message: "" };
const inputClass =
  "mt-2 h-11 w-full border border-black/15 bg-white px-3 text-sm outline-none focus:border-[#0e7468]";

export function ShippingZoneForm({
  zone,
  locale,
}: {
  zone: AdminShippingZone;
  locale: Locale;
}) {
  const ar = locale === "ar";
  const [state, action, pending] = useActionState(
    updateShippingZoneAction,
    initialState,
  );

  return (
    <form action={action} className="border border-black/10 bg-white p-5 md:p-6">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="zoneId" value={zone.id} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#0e7468]">
            {zone.code.replaceAll("_", " ")}
          </p>
          <h2 className="mt-1 font-serif text-3xl">
            {ar ? zone.name_ar : zone.name_en}
          </h2>
          <p className="mt-2 max-w-xl text-xs leading-5 text-neutral-500">
            {zone.shipping_governorates
              .map((item) => (ar ? item.name_ar : item.name_en))
              .join(" · ")}
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs font-bold">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={zone.is_active}
            className="size-4 accent-[#0e7468]"
          />
          {ar ? "منطقة نشطة" : "Zone active"}
        </label>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={ar ? "رسوم التوصيل (ج.م)" : "Delivery fee (EGP)"}>
          <input name="shippingFee" type="number" min="0" max="1000000" step="0.01" required defaultValue={zone.shipping_fee_minor / 100} className={inputClass} />
        </Field>
        <Field label={ar ? "حد الشحن المجاني (اختياري)" : "Free-shipping threshold (optional)"}>
          <input name="freeShippingThreshold" type="number" min="0.01" max="1000000" step="0.01" defaultValue={zone.free_shipping_threshold_minor === null ? "" : zone.free_shipping_threshold_minor / 100} placeholder={ar ? "اتركه فارغاً للتعطيل" : "Blank to disable"} className={inputClass} />
        </Field>
        <Field label={ar ? "رسوم الدفع عند الاستلام" : "COD service fee (EGP)"}>
          <input name="codSurcharge" type="number" min="0" max="1000000" step="0.01" required defaultValue={zone.cod_surcharge_minor / 100} className={inputClass} />
        </Field>
        <Field label={ar ? "أقل أيام التوصيل" : "Minimum delivery days"}>
          <input name="deliveryMinDays" type="number" min="1" max="30" required defaultValue={zone.delivery_min_days} className={inputClass} />
        </Field>
        <Field label={ar ? "أقصى أيام التوصيل" : "Maximum delivery days"}>
          <input name="deliveryMaxDays" type="number" min="1" max="45" required defaultValue={zone.delivery_max_days} className={inputClass} />
        </Field>
        <label className="flex min-h-16 items-center gap-3 self-end border border-black/10 bg-[#eef2ef] px-4 text-xs font-bold">
          <input type="checkbox" name="codEnabled" defaultChecked={zone.cod_enabled} className="size-4 accent-[#0e7468]" />
          {ar ? "السماح بالدفع عند الاستلام" : "Allow cash on delivery"}
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-5">
        <p aria-live="polite" className={`text-xs ${state.status === "error" ? "text-[#a6432b]" : "text-[#0e7468]"}`}>
          {state.message}
        </p>
        <button disabled={pending} className="flex h-11 min-w-36 items-center justify-center gap-2 bg-[#073b36] px-5 text-[10px] font-bold uppercase tracking-[.14em] text-white disabled:opacity-50">
          {pending && <Loader2 size={15} className="animate-spin" />}
          {ar ? "حفظ المنطقة" : "Save zone"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="text-xs font-bold text-neutral-700">{label}{children}</label>;
}
