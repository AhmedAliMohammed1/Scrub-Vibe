"use client";

import { useState, useTransition } from "react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  Eye,
  Loader2,
  Pencil,
  RotateCcw,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { deleteProductAction, setProductStatusAction } from "./actions";

export type ProductTableActionsProps = {
  productId: number;
  slug: string;
  title: string;
  status: "draft" | "active" | "scheduled" | "archived";
  locale: Locale;
};

export function ProductTableActions({
  productId,
  slug,
  title,
  status,
  locale,
}: ProductTableActionsProps) {
  const ar = locale === "ar";
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [isPendingStatus, startStatusTransition] = useTransition();

  const handleStatusChange = (nextStatus: "draft" | "active" | "archived") => {
    startStatusTransition(async () => {
      const formData = new FormData();
      formData.set("locale", locale);
      formData.set("productId", String(productId));
      formData.set("status", nextStatus);
      await setProductStatusAction(formData);
      router.refresh();
    });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError("");
    try {
      const formData = new FormData();
      formData.set("locale", locale);
      formData.set("productId", String(productId));
      const res = await deleteProductAction(formData);
      if (!res.success) {
        setDeleteError(
          res.error ||
            (ar
              ? "تعذر حذف المنتج. يرجى المحاولة لاحقاً."
              : "Failed to delete product. Please try again."),
        );
        setIsDeleting(false);
        return;
      }
      setShowDeleteModal(false);
      router.push(`/${locale}/admin?deleted=1#products-list`);
      router.refresh();
    } catch {
      setDeleteError(
        ar
          ? "حدث خطأ غير متوقع أثناء الحذف."
          : "An unexpected error occurred during deletion.",
      );
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Edit Button */}
        <Link
          href={`/${locale}/admin/products/${productId}/edit` as Route}
          className="inline-flex items-center gap-1.5 border border-[#073b36] bg-[#073b36] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-[#0e7468]"
          title={ar ? "تعديل تفاصيل المنتج" : "Edit product details"}
        >
          <Pencil size={11} />
          <span>{ar ? "تعديل" : "Edit"}</span>
        </Link>

        {/* Status Actions */}
        {status !== "active" && (
          <button
            type="button"
            disabled={isPendingStatus}
            onClick={() => handleStatusChange("active")}
            className="inline-flex items-center gap-1 border border-[#0e7468]/30 bg-emerald-50 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
          >
            {isPendingStatus ? (
              <Loader2 size={11} className="animate-spin" />
            ) : null}
            <span>{ar ? "نشر" : "Publish"}</span>
          </button>
        )}

        {status === "active" && (
          <button
            type="button"
            disabled={isPendingStatus}
            onClick={() => handleStatusChange("draft")}
            className="inline-flex items-center gap-1 border border-neutral-300 bg-neutral-100 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-700 transition hover:bg-neutral-200 disabled:opacity-50"
          >
            {isPendingStatus ? (
              <Loader2 size={11} className="animate-spin" />
            ) : null}
            <span>{ar ? "إخفاء" : "Unpublish"}</span>
          </button>
        )}

        {status !== "archived" && (
          <button
            type="button"
            disabled={isPendingStatus}
            onClick={() => handleStatusChange("archived")}
            className="inline-flex items-center gap-1 border border-stone-300 bg-stone-100 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-600 transition hover:bg-stone-200 disabled:opacity-50"
            title={ar ? "أرشفة المنتج" : "Archive product"}
          >
            <Archive size={11} />
            <span>{ar ? "أرشفة" : "Archive"}</span>
          </button>
        )}

        {status === "archived" && (
          <button
            type="button"
            disabled={isPendingStatus}
            onClick={() => handleStatusChange("draft")}
            className="inline-flex items-center gap-1 border border-stone-300 bg-stone-100 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-700 transition hover:bg-stone-200 disabled:opacity-50"
            title={ar ? "استعادة كمسودة" : "Restore as draft"}
          >
            <RotateCcw size={11} />
            <span>{ar ? "استعادة" : "Restore"}</span>
          </button>
        )}

        {/* View in Store */}
        {status === "active" && (
          <Link
            href={`/${locale}/products/${slug}` as Route}
            className="inline-flex items-center gap-1 border border-black/15 bg-white px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-700 transition hover:border-black/30 hover:bg-neutral-50"
            target="_blank"
            rel="noopener noreferrer"
            title={ar ? "معاينة في المتجر" : "View in store"}
          >
            <Eye size={11} />
            <span>{ar ? "عرض" : "View"}</span>
          </Link>
        )}

        {/* Delete Button */}
        <button
          type="button"
          onClick={() => {
            setDeleteError("");
            setShowDeleteModal(true);
          }}
          className="inline-flex items-center gap-1 border border-red-200 bg-red-50/70 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red-700 transition hover:border-red-400 hover:bg-red-100"
          title={ar ? "حذف المنتج نهائياً" : "Delete product permanently"}
        >
          <Trash2 size={11} />
          <span>{ar ? "حذف" : "Delete"}</span>
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
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
                    {ar ? "إجراء لا يمكن التراجع عنه" : "Destructive Action"}
                  </p>
                  <h3
                    id="delete-dialog-title"
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
                      «{title}»
                    </strong>{" "}
                    نهائياً من المتجر؟
                  </>
                ) : (
                  <>
                    Are you sure you want to permanently delete{" "}
                    <strong className="text-black font-semibold">
                      &quot;{title}&quot;
                    </strong>{" "}
                    from the catalogue?
                  </>
                )}
              </p>
              <p className="mt-2 text-[11px] text-neutral-500">
                {ar
                  ? "سيتم إزالة المنتج ومتغيراته ومخزونه وصوره وقوائم الرغبات المرتبطة به فوراً. طلبات العملاء السابقة التي تحتوي على هذا المنتج ستظل محفوظة ومحمية بسجلاتها التاريخية."
                  : "The product, its size/colour variants, inventory, and wishlist entries will be removed immediately. Past customer orders containing this product will remain completely safe with preserved snapshots."}
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
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Trash2 size={15} />
                )}
                <span>
                  {isDeleting
                    ? ar
                      ? "جارٍ الحذف…"
                      : "Deleting…"
                    : ar
                      ? "تأكيد الحذف"
                      : "Confirm Delete"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
