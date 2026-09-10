"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FileImage,
  Loader2,
  UploadCloud,
  X,
  Copy,
  Check,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";

type Props = {
  orderNumber: string;
  trackingToken?: string;
  phone?: string;
  paymentMethod: string;
  codDepositMinor?: number;
  totalMinor?: number;
  reviewNote?: string | null;
  locale: Locale;
  onSuccess?: (newPaymentStatus: string) => void;
};

export function PaymentProofReupload({
  orderNumber,
  trackingToken,
  phone,
  paymentMethod,
  codDepositMinor,
  totalMinor,
  reviewNote,
  locale,
  onSuccess,
}: Props) {
  const ar = locale === "ar";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [copiedTarget, setCopiedTarget] = useState(false);

  const vodafoneNumber = process.env.NEXT_PUBLIC_VODAFONE_CASH_NUMBER;
  const instapayAddress = process.env.NEXT_PUBLIC_INSTAPAY_ADDRESS;

  const targetDestination =
    paymentMethod === "vodafone_cash"
      ? vodafoneNumber
      : paymentMethod === "instapay"
        ? instapayAddress
        : null;

  const requiredAmount =
    paymentMethod === "cod" && codDepositMinor
      ? formatMoney(codDepositMinor, locale)
      : totalMinor
        ? formatMoney(totalMinor, locale)
        : null;

  useEffect(() => {
    if (!previewUrl) return;
    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFileSelection(selected: File | undefined | null) {
    setError("");
    if (!selected) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(selected.type)) {
      setError(
        ar
          ? "يرجى اختيار صورة بصيغة JPEG أو PNG أو WEBP."
          : "Please choose an image file (JPEG, PNG, or WEBP).",
      );
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setError(
        ar
          ? "حجم الصورة كبير جداً (الحد الأقصى ٥ ميجابايت)."
          : "Image size is too large (maximum 5MB).",
      );
      return;
    }

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  }

  function handleRemoveFile() {
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleCopy(text: string) {
    void navigator.clipboard.writeText(text);
    setCopiedTarget(true);
    setTimeout(() => setCopiedTarget(false), 2000);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError(
        ar
          ? "يرجى اختيار صورة إيصال الدفع أولاً."
          : "Please select a payment receipt image first.",
      );
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("proof", file);
      formData.append("locale", locale);
      if (trackingToken) {
        formData.append("trackingToken", trackingToken);
      }
      if (phone) {
        formData.append("phone", phone);
      }

      const response = await fetch(
        `/api/orders/${encodeURIComponent(orderNumber)}/payment-proof`,
        {
          method: "POST",
          body: formData,
        },
      );

      const result = (await response.json()) as {
        success?: boolean;
        error?: string;
        message?: string;
      };

      if (!response.ok || !result.success) {
        setError(
          result.error ??
            (ar
              ? "تعذر إرسال الإيصال. يرجى المحاولة مرة أخرى."
              : "Could not submit proof. Please try again."),
        );
        return;
      }

      setSuccess(true);
      onSuccess?.("proof_submitted");
    } catch {
      setError(
        ar
          ? "حدث خطأ في الاتصال بالخادم. يرجى المحاولة لاحقاً."
          : "Connection error. Please try again later.",
      );
    } finally {
      setUploading(false);
    }
  }

  if (success) {
    return (
      <section
        id="reupload-proof"
        className="mt-6 rounded-xs border border-[#0e7468]/30 bg-[#f0f5f3] p-5 sm:p-7 shadow-xs"
      >
        <div className="flex items-start gap-3.5">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#073b36] text-white">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span className="rounded-xs bg-[#0e7468]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[.1em] text-[#073b36]">
              {ar ? "تم استلام الإيصال" : "PROOF SUBMITTED"}
            </span>
            <h3 className="mt-1.5 font-serif text-lg text-[#073b36]">
              {ar
                ? "تم استلام إيصال الدفع الجديد بنجاح!"
                : "Replacement proof submitted successfully!"}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
              {ar
                ? "حالة الدفع تحولت الآن إلى 'قيد المراجعة'. سيقوم فريقنا بالتحقق من الإيصال وتأكيد طلبك في أقرب وقت."
                : "Payment status is now 'Under Review'. Our team will verify your receipt and confirm your order promptly."}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="reupload-proof"
      className="mt-6 rounded-xs border border-[#a5472f]/35 bg-white p-5 sm:p-7 shadow-xs transition-all"
    >
      {/* Rejection Header */}
      <div className="flex items-start gap-3.5">
        <div className="grid size-10 shrink-0 place-items-center rounded-xs bg-[#a5472f]/10 text-[#a5472f]">
          <AlertCircle size={22} strokeWidth={2} />
        </div>
        <div className="flex-1">
          <span className="inline-block rounded-xs bg-[#a5472f]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[.1em] text-[#a5472f]">
            {ar ? "تم رفض إيصال الدفع" : "PAYMENT PROOF REJECTED"}
          </span>
          <h2 className="mt-1 font-serif text-xl sm:text-2xl text-[var(--text-strong)]">
            {ar ? "إعادة رفع إيصال الدفع" : "Re-upload Payment Confirmation"}
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
            {ar
              ? "لم يتم تأكيد إيصال الدفع السابق. يرجى التأكد من تحويل المبلغ وإرفاق صورة الإيصال أو لقطة شاشة واضحة للتحويل لإعادة مراجعته وتأكيد الطلب."
              : "The previous payment proof could not be verified. Please ensure the transfer is complete and upload a clear receipt screenshot to re-evaluate and confirm your order."}
          </p>
        </div>
      </div>

      {/* Reviewer Note Callout */}
      {reviewNote && (
        <div className="mt-4 flex items-start gap-2.5 rounded-xs border border-amber-500/30 bg-amber-50/80 p-3.5 text-xs text-amber-950">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-700" />
          <div>
            <strong className="block font-bold">
              {ar ? "سبب الرفض من الإدارة:" : "Reviewer Note:"}
            </strong>
            <p className="mt-0.5 leading-relaxed text-amber-900">{reviewNote}</p>
          </div>
        </div>
      )}

      {/* Transfer Information Guide */}
      {(targetDestination || requiredAmount) && (
        <div className="mt-4 rounded-xs border border-[var(--border-subtle)] bg-[#f6f7f4] p-3.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                {paymentMethod === "cod"
                  ? ar
                    ? "مقدم الطلب المطلوب"
                    : "Required Deposit"
                  : ar
                    ? "إجمالي المبلغ المطلوب"
                    : "Total Required Amount"}
              </span>
              {requiredAmount && (
                <strong className="block text-sm text-[#073b36]">
                  {requiredAmount}
                </strong>
              )}
            </div>

            {targetDestination && (
              <div className="flex items-center gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    {paymentMethod === "vodafone_cash"
                      ? "Vodafone Cash"
                      : "InstaPay"}
                  </span>
                  <span className="block font-mono text-xs font-bold text-[#073b36]">
                    {targetDestination}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(targetDestination)}
                  className="grid size-8 place-items-center rounded-xs border border-[var(--border-subtle)] bg-white text-[var(--text-muted)] hover:text-[#073b36]"
                  title={ar ? "نسخ" : "Copy"}
                >
                  {copiedTarget ? (
                    <Check size={14} className="text-[#0e7468]" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Form */}
      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFileSelection(e.target.files?.[0])}
        />

        {!file ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFileSelection(e.dataTransfer.files?.[0]);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-xs border-2 border-dashed p-6 sm:p-8 text-center transition ${
              isDragging
                ? "border-[#0e7468] bg-[#f0f5f3]"
                : "border-[var(--border-subtle)] bg-[var(--surface-canvas)] hover:border-[#0e7468]/50"
            }`}
          >
            <UploadCloud
              size={32}
              className={`mx-auto transition ${
                isDragging ? "text-[#0e7468]" : "text-[var(--text-muted)]"
              }`}
            />
            <p className="mt-3 text-xs font-bold text-[var(--text-strong)]">
              {ar
                ? "اضغط هنا لاختيار صورة الإيصال أو اسحب الصورة وأفلتها هنا"
                : "Click to choose receipt image or drag and drop here"}
            </p>
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">
              {ar
                ? "صيغ مدعومة: JPEG, PNG, WEBP (الحد الأقصى ٥ ميجابايت)"
                : "Supported formats: JPEG, PNG, WEBP (Up to 5MB)"}
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-xs border border-[var(--border-subtle)] bg-[#f6f7f4] p-3.5">
            <div className="flex items-center gap-3 overflow-hidden">
              {previewUrl ? (
                <div className="relative size-14 shrink-0 overflow-hidden rounded-xs border border-black/10 bg-white">
                  <Image
                    src={previewUrl}
                    alt="Proof preview"
                    fill
                    sizes="56px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="grid size-14 shrink-0 place-items-center rounded-xs bg-neutral-200 text-neutral-500">
                  <FileImage size={24} />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-[var(--text-strong)]">
                  {file.name}
                </p>
                <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB · {file.type}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="grid size-8 shrink-0 place-items-center rounded-xs text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700"
              aria-label={ar ? "إلغاء الملف" : "Remove file"}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {error && (
          <p className="rounded-xs border border-[#a5472f]/30 bg-[#a5472f]/10 px-3.5 py-2 text-xs font-semibold text-[#a5472f]">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="submit"
            disabled={!file || uploading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xs bg-[#073b36] px-6 text-xs font-bold uppercase tracking-[.14em] text-white shadow-xs transition hover:bg-[#0e7468] disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="animate-spin" size={15} />
                <span>{ar ? "جارٍ الرفع…" : "Uploading…"}</span>
              </>
            ) : (
              <>
                <UploadCloud size={16} />
                <span>
                  {ar ? "إرسال إيصال الدفع البديل" : "Submit Replacement Confirmation"}
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
