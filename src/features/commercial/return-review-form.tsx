"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { updateReturnAction } from "@/features/commercial/admin-actions";
import {
  allowedReturnStatuses,
  returnRefundMethodLabel,
  returnRefundMethods,
  returnResolutionLabel,
  returnResolutions,
  returnStatusLabel,
  type ReturnRefundMethod,
  type ReturnResolution,
  type ReturnStatus,
} from "@/features/commercial/return-workflow";

type ReviewItem = {
  id: number;
  title: string;
  variant: string;
  quantity: number;
  receivedQuantity: number;
  restockedQuantity: number;
  conditionNote: string | null;
};

type Props = {
  locale: "en" | "ar";
  returnId: string;
  initialStatus: ReturnStatus;
  initialResolution: ReturnResolution | null;
  customerFacingNote: string | null;
  refundAmountMinor: number;
  refundMethod: ReturnRefundMethod | null;
  refundReference: string | null;
  orderTotalMinor: number;
  eligibleItemsMinor: number;
  items: ReviewItem[];
};

const field =
  "mt-1.5 min-h-11 w-full rounded-xs border border-black/15 bg-white px-3 text-sm text-[#172421] outline-none transition focus:border-[#0e7468] focus:ring-2 focus:ring-[#0e7468]/20";

function SubmitButton({
  locale,
  completing,
}: {
  locale: "en" | "ar";
  completing: boolean;
}) {
  const { pending } = useFormStatus();
  const ar = locale === "ar";
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-11 rounded-xs bg-[#073b36] px-5 text-xs font-bold uppercase tracking-[.1em] text-white transition hover:bg-[#0e7468] disabled:cursor-wait disabled:opacity-60"
    >
      <span role="status" aria-live="polite" aria-atomic="true">
        {pending
          ? ar
            ? "جارٍ الحفظ…"
            : "Saving…"
          : completing
            ? ar
              ? "تأكيد وإكمال التسوية"
              : "Confirm & complete settlement"
            : ar
              ? "حفظ التحديث"
              : "Save update"}
      </span>
    </button>
  );
}

export function ReturnReviewForm(props: Props) {
  const ar = props.locale === "ar";
  const closed = ["rejected", "completed", "cancelled"].includes(
    props.initialStatus,
  );
  const [status, setStatus] = useState<ReturnStatus>(props.initialStatus);
  const [resolution, setResolution] = useState<ReturnResolution | "">(
    props.initialResolution ?? "",
  );
  const [quantities, setQuantities] = useState(() =>
    Object.fromEntries(
      props.items.map((item) => [
        item.id,
        {
          received: item.receivedQuantity,
          restocked: item.restockedQuantity,
        },
      ]),
    ),
  );

  if (closed) {
    return (
      <p className="mt-4 rounded-xs border border-black/10 bg-[#f5f7f5] p-3 text-xs text-neutral-600">
        {ar
          ? "تم إغلاق هذا الطلب وتثبيت بيانات التسوية لحماية السجل المالي."
          : "This case is closed and its settlement details are locked for audit safety."}
      </p>
    );
  }

  const receiving = status === "received" || status === "completed";
  const completing = status === "completed";
  const refunding = resolution === "refund";
  const receivedTotal = Object.values(quantities).reduce(
    (sum, item) => sum + item.received,
    0,
  );

  return (
    <form action={updateReturnAction} className="mt-5 space-y-5">
      <input type="hidden" name="locale" value={props.locale} />
      <input type="hidden" name="id" value={props.returnId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-[11px] font-bold uppercase tracking-[.08em] text-neutral-700">
          {ar ? "الحالة التالية" : "Next status"}
          <select
            name="status"
            value={status}
            onChange={(event) => setStatus(event.target.value as ReturnStatus)}
            className={field}
          >
            {allowedReturnStatuses(props.initialStatus).map((value) => (
              <option key={value} value={value}>
                {returnStatusLabel(value, props.locale)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[11px] font-bold uppercase tracking-[.08em] text-neutral-700">
          {ar ? "طريقة التسوية" : "Resolution"}
          <select
            name="resolution"
            value={resolution}
            onChange={(event) =>
              setResolution(event.target.value as ReturnResolution | "")
            }
            required={["approved", "received", "completed"].includes(status)}
            className={field}
          >
            <option value="">
              {ar ? "اختر طريقة التسوية" : "Choose resolution"}
            </option>
            {returnResolutions.map((value) => (
              <option key={value} value={value}>
                {returnResolutionLabel(value, props.locale)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {receiving && (
        <fieldset className="rounded-xs border border-black/10 bg-[#f8faf9] p-4">
          <legend className="px-2 text-xs font-bold uppercase tracking-[.1em] text-[#073b36]">
            {ar ? "فحص المنتجات المستلمة" : "Received-item inspection"}
          </legend>
          <p className="mb-4 text-xs leading-5 text-neutral-600">
            {ar
              ? "سجّل الكمية التي وصلت فعلياً. أضف للمخزون فقط القطع الصالحة لإعادة البيع."
              : "Record what physically arrived. Restock only units that are fit for resale."}
          </p>
          <div className="space-y-3">
            {props.items.map((item) => {
              const value = quantities[item.id];
              return (
                <div
                  key={item.id}
                  className="grid gap-3 rounded-xs border border-black/10 bg-white p-3 sm:grid-cols-[minmax(0,1fr)_7rem_7rem]"
                >
                  <div>
                    <strong className="text-sm">{item.title}</strong>
                    <p className="mt-1 text-xs text-neutral-500">
                      {item.variant} · {ar ? "المطلوب" : "Requested"}:{" "}
                      {item.quantity}
                    </p>
                    {item.conditionNote && (
                      <p className="mt-2 text-xs text-neutral-600">
                        {item.conditionNote}
                      </p>
                    )}
                  </div>
                  <input type="hidden" name="itemId" value={item.id} />
                  <label className="text-[10px] font-bold uppercase text-neutral-600">
                    {ar ? "تم الاستلام" : "Received"}
                    <input
                      name="receivedQuantity"
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={item.quantity}
                      value={value.received}
                      onChange={(event) => {
                        const received = Math.min(
                          item.quantity,
                          Math.max(0, Number(event.target.value)),
                        );
                        setQuantities((current) => ({
                          ...current,
                          [item.id]: {
                            received,
                            restocked: Math.min(
                              current[item.id].restocked,
                              received,
                            ),
                          },
                        }));
                      }}
                      className={field}
                      required
                    />
                  </label>
                  <label className="text-[10px] font-bold uppercase text-neutral-600">
                    {ar ? "أضيف للمخزون" : "Restocked"}
                    <input
                      name="restockedQuantity"
                      type="number"
                      inputMode="numeric"
                      min={item.restockedQuantity}
                      max={value.received}
                      value={value.restocked}
                      onChange={(event) => {
                        const restocked = Math.min(
                          value.received,
                          Math.max(
                            item.restockedQuantity,
                            Number(event.target.value),
                          ),
                        );
                        setQuantities((current) => ({
                          ...current,
                          [item.id]: { ...current[item.id], restocked },
                        }));
                      }}
                      className={field}
                      required
                    />
                  </label>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs font-semibold text-[#073b36]">
            {ar
              ? `إجمالي المستلم: ${receivedTotal}`
              : `Total received: ${receivedTotal}`}
          </p>
        </fieldset>
      )}

      {refunding && (
        <fieldset className="rounded-xs border border-[#0e7468]/25 bg-[#edf5f2] p-4">
          <legend className="px-2 text-xs font-bold uppercase tracking-[.1em] text-[#073b36]">
            {ar ? "تسوية الاسترداد" : "Refund settlement"}
          </legend>
          <p className="mb-4 text-xs leading-5 text-neutral-600">
            {ar
              ? `قيمة المنتجات المطلوبة ${formatMoney(props.eligibleItemsMinor, props.locale)}، وإجمالي الطلب ${formatMoney(props.orderTotalMinor, props.locale)}.`
              : `Requested merchandise value ${formatMoney(props.eligibleItemsMinor, props.locale)}; order total ${formatMoney(props.orderTotalMinor, props.locale)}.`}
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="text-[10px] font-bold uppercase text-neutral-700">
              {ar ? "المبلغ المسترد (ج.م)" : "Refund amount (EGP)"}
              <input
                name="refundAmount"
                type="number"
                inputMode="decimal"
                min="0"
                max={(props.orderTotalMinor / 100).toFixed(2)}
                step="0.01"
                defaultValue={(props.refundAmountMinor / 100).toFixed(2)}
                required={completing}
                className={field}
              />
            </label>
            <label className="text-[10px] font-bold uppercase text-neutral-700">
              {ar ? "وسيلة الاسترداد" : "Refund method"}
              <select
                name="refundMethod"
                defaultValue={props.refundMethod ?? ""}
                required={completing}
                className={field}
              >
                <option value="">
                  {ar ? "اختر الوسيلة" : "Choose method"}
                </option>
                {returnRefundMethods.map((method) => (
                  <option key={method} value={method}>
                    {returnRefundMethodLabel(method, props.locale)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[10px] font-bold uppercase text-neutral-700">
              {ar ? "رقم العملية / الإيصال" : "Transaction / receipt reference"}
              <input
                name="refundReference"
                maxLength={160}
                defaultValue={props.refundReference ?? ""}
                required={completing}
                className={field}
              />
            </label>
          </div>
          {completing && (
            <p className="mt-4 border-s-2 border-[#a5472f] ps-3 text-xs font-semibold leading-5 text-[#7d3523]">
              {ar
                ? "أكمل التسوية فقط بعد إرسال المبلغ فعلياً. سيُحدّث هذا حالة الدفع والطلب ولا يمكن التراجع عنه."
                : "Complete only after the money has actually been sent. This updates the payment and order records and cannot be undone."}
            </p>
          )}
        </fieldset>
      )}

      {!refunding && (
        <>
          <input type="hidden" name="refundAmount" value="0" />
          <input type="hidden" name="refundMethod" value="" />
          <input type="hidden" name="refundReference" value="" />
        </>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="text-[11px] font-bold uppercase tracking-[.08em] text-neutral-700">
          {ar ? "رسالة تظهر للعميل" : "Customer-facing update"}
          <textarea
            name="note"
            maxLength={1000}
            defaultValue={props.customerFacingNote ?? ""}
            placeholder={
              ar
                ? "مثال: تمت الموافقة. يرجى الاحتفاظ بالمنتج بحالته الأصلية."
                : "Example: Approved. Please keep the item in its original condition."
            }
            className={`${field} min-h-24 py-3 normal-case`}
          />
          <span className="mt-1 block text-[11px] font-normal normal-case text-neutral-500">
            {ar
              ? "تظهر في حساب العميل وتُرسل بالبريد الإلكتروني."
              : "Visible in the customer account and sent by email."}
          </span>
        </label>
        <label className="text-[11px] font-bold uppercase tracking-[.08em] text-neutral-700">
          {ar ? "ملاحظة داخلية خاصة" : "Private internal note"}
          <textarea
            name="internalNote"
            maxLength={2000}
            placeholder={
              ar
                ? "للفريق فقط — لا تظهر للعميل."
                : "Staff only — never shown to the customer."
            }
            className={`${field} min-h-24 py-3 normal-case`}
          />
        </label>
      </div>

      <div className="flex justify-end">
        <SubmitButton locale={props.locale} completing={completing} />
      </div>
    </form>
  );
}

function formatMoney(minor: number, locale: "en" | "ar") {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    style: "currency",
    currency: "EGP",
  }).format(minor / 100);
}
