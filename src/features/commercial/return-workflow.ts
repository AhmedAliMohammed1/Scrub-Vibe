export const returnStatuses = [
  "requested",
  "reviewing",
  "approved",
  "rejected",
  "received",
  "completed",
  "cancelled",
] as const;

export const returnResolutions = [
  "refund",
  "exchange",
  "store_credit",
] as const;

export const returnRefundMethods = [
  "original_payment",
  "vodafone_cash",
  "instapay",
  "bank_transfer",
  "cash",
] as const;

export type ReturnStatus = (typeof returnStatuses)[number];
export type ReturnResolution = (typeof returnResolutions)[number];
export type ReturnRefundMethod = (typeof returnRefundMethods)[number];

const nextStatuses: Record<ReturnStatus, readonly ReturnStatus[]> = {
  requested: ["requested", "reviewing", "approved", "rejected", "cancelled"],
  reviewing: ["reviewing", "approved", "rejected", "cancelled"],
  approved: ["approved", "received", "cancelled"],
  rejected: ["rejected"],
  received: ["received", "completed"],
  completed: ["completed"],
  cancelled: ["cancelled"],
};

export function allowedReturnStatuses(status: ReturnStatus) {
  return nextStatuses[status];
}

export function parseEgpToMinor(value: string): number | null {
  const normalized = value.trim();
  const match = /^(\d{1,7})(?:\.(\d{1,2}))?$/.exec(normalized);
  if (!match) return null;
  const pounds = Number(match[1]);
  const piastres = Number((match[2] ?? "").padEnd(2, "0"));
  const minor = pounds * 100 + piastres;
  return Number.isSafeInteger(minor) ? minor : null;
}

export function returnStatusLabel(status: ReturnStatus, locale: "en" | "ar") {
  const labels: Record<ReturnStatus, [string, string]> = {
    requested: ["Requested", "تم تقديم الطلب"],
    reviewing: ["Under review", "قيد المراجعة"],
    approved: ["Approved", "تمت الموافقة"],
    rejected: ["Not approved", "لم تتم الموافقة"],
    received: ["Items received", "تم استلام المنتجات"],
    completed: ["Completed", "مكتمل"],
    cancelled: ["Cancelled", "ملغي"],
  };
  return labels[status][locale === "ar" ? 1 : 0];
}

export function returnResolutionLabel(
  resolution: ReturnResolution,
  locale: "en" | "ar",
) {
  const labels: Record<ReturnResolution, [string, string]> = {
    refund: ["Refund", "استرداد المبلغ"],
    exchange: ["Exchange", "استبدال"],
    store_credit: ["Store credit", "رصيد متجر"],
  };
  return labels[resolution][locale === "ar" ? 1 : 0];
}

export function returnRefundMethodLabel(
  method: ReturnRefundMethod,
  locale: "en" | "ar",
) {
  const labels: Record<ReturnRefundMethod, [string, string]> = {
    original_payment: ["Original payment method", "وسيلة الدفع الأصلية"],
    vodafone_cash: ["Vodafone Cash", "فودافون كاش"],
    instapay: ["InstaPay", "إنستاباي"],
    bank_transfer: ["Bank transfer", "تحويل بنكي"],
    cash: ["Cash", "نقداً"],
  };
  return labels[method][locale === "ar" ? 1 : 0];
}

export function formatReturnErrorMessage(raw: string, locale: "en" | "ar") {
  const code = raw.toUpperCase();
  const ar = locale === "ar";
  const messages: Array<[string, string, string]> = [
    [
      "INVALID_RETURN_TRANSITION",
      "This return cannot move to that status.",
      "لا يمكن نقل طلب الاسترجاع إلى هذه الحالة.",
    ],
    [
      "TERMINAL_RETURN",
      "This return is closed and cannot be reopened.",
      "تم إغلاق طلب الاسترجاع ولا يمكن إعادة فتحه.",
    ],
    [
      "RETURN_RESOLUTION_REQUIRED",
      "Choose refund, exchange, or store credit before approval.",
      "اختر استرداد المبلغ أو الاستبدال أو رصيد المتجر قبل الموافقة.",
    ],
    [
      "RECEIVED_QUANTITY_REQUIRED",
      "Enter at least one received item before continuing.",
      "أدخل منتجاً مستلماً واحداً على الأقل قبل المتابعة.",
    ],
    [
      "INVALID_RETURN_ITEM_QUANTITIES",
      "Received and restocked quantities are not valid.",
      "كميات الاستلام والإضافة للمخزون غير صحيحة.",
    ],
    [
      "RESTOCK_CANNOT_BE_REVERSED",
      "Restocked units cannot be reduced from this screen.",
      "لا يمكن تقليل الكمية التي أضيفت للمخزون من هذه الشاشة.",
    ],
    [
      "INVALID_REFUND_AMOUNT",
      "The refund exceeds the eligible returned-item value.",
      "مبلغ الاسترداد يتجاوز قيمة المنتجات المؤهلة.",
    ],
    [
      "REFUND_AMOUNT_REQUIRED",
      "Enter the amount that was actually refunded.",
      "أدخل المبلغ الذي تم استرداده فعلياً.",
    ],
    [
      "REFUND_METHOD_REQUIRED",
      "Choose how the refund was sent.",
      "اختر وسيلة إرسال مبلغ الاسترداد.",
    ],
    [
      "REFUND_REFERENCE_REQUIRED",
      "Enter the refund transaction or receipt reference.",
      "أدخل رقم عملية أو إيصال الاسترداد.",
    ],
    [
      "ORDER_PAYMENT_NOT_REFUNDABLE",
      "Confirm that the order payment was collected before recording a refund.",
      "أكد تحصيل مبلغ الطلب قبل تسجيل الاسترداد.",
    ],
    [
      "RETURN_REVIEW_FORBIDDEN",
      "Your role cannot approve or reject returns.",
      "صلاحيتك لا تسمح بالموافقة على طلبات الاسترجاع أو رفضها.",
    ],
    [
      "RETURN_RECEIPT_FORBIDDEN",
      "Only warehouse staff or administrators can receive returned items.",
      "يمكن لموظفي المخزن أو المديرين فقط استلام المنتجات المرتجعة.",
    ],
    [
      "RETURN_COMPLETION_FORBIDDEN",
      "Only an administrator can complete a return settlement.",
      "يمكن للمدير فقط إكمال تسوية طلب الاسترجاع.",
    ],
    [
      "COMPLETED_RETURN_FINANCIALS_LOCKED",
      "Completed return financial details cannot be changed.",
      "لا يمكن تغيير البيانات المالية لطلب استرجاع مكتمل.",
    ],
  ];
  const match = messages.find(([key]) => code.includes(key));
  return match ? (ar ? match[2] : match[1]) : raw;
}
