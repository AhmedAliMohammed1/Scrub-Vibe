import type { Route } from "next";
import Link from "next/link";
import {
  buildPaginationHref,
  getPagination,
  paginationPages,
  type SearchParamValue,
} from "@/lib/pagination";
import type { Locale } from "@/lib/i18n";

type Props = {
  locale: Locale;
  pathname: string;
  searchParams?: Record<string, SearchParamValue>;
  currentPage: number;
  totalItems: number;
  pageSize?: number;
  pageParam?: string;
  anchor?: string;
  itemLabel: { en: string; ar: string };
  className?: string;
  hideWhenSinglePage?: boolean;
};

export function PaginationNav({
  locale,
  pathname,
  searchParams,
  currentPage,
  totalItems,
  pageSize = 10,
  pageParam = "page",
  anchor,
  itemLabel,
  className = "",
  hideWhenSinglePage = false,
}: Props) {
  if (totalItems === 0) return null;
  const ar = locale === "ar";
  const pagination = getPagination(totalItems, currentPage, pageSize);
  if (hideWhenSinglePage && pagination.totalPages === 1) return null;
  const pages = paginationPages(pagination.currentPage, pagination.totalPages);
  const hrefFor = (page: number) =>
    buildPaginationHref({
      pathname,
      searchParams,
      page,
      pageParam,
      anchor,
    }) as Route;
  const firstItem = pagination.from + 1;
  const lastItem = Math.min(
    pagination.from + pagination.pageSize,
    pagination.totalItems,
  );
  const formatNumber = (value: number) => value.toLocaleString(locale);

  return (
    <nav
      aria-label={ar ? "التنقل بين الصفحات" : "Pagination"}
      className={`flex flex-col gap-3 border border-black/10 bg-white p-3 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <p className="text-xs font-semibold text-neutral-600" aria-live="polite">
        {ar
          ? `عرض ${formatNumber(firstItem)}–${formatNumber(lastItem)} من ${formatNumber(pagination.totalItems)} ${itemLabel.ar}`
          : `Showing ${formatNumber(firstItem)}–${formatNumber(lastItem)} of ${formatNumber(pagination.totalItems)} ${itemLabel.en}`}
      </p>

      {pagination.totalPages > 1 && (
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-1.5">
          <PageLink
            href={hrefFor(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            label={ar ? "السابق" : "Previous"}
          />
          {pages.map((page, index) =>
            page === "ellipsis" ? (
              <span
                key={`ellipsis-${index}`}
                className="hidden min-h-11 min-w-8 place-items-center text-sm text-neutral-400 sm:grid"
                aria-hidden="true"
              >
                …
              </span>
            ) : (
              <Link
                key={page}
                href={hrefFor(page)}
                aria-current={
                  page === pagination.currentPage ? "page" : undefined
                }
                aria-label={ar ? `الصفحة ${page}` : `Page ${page}`}
                className={`hidden min-h-11 min-w-11 place-items-center border px-3 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e7468] sm:grid ${
                  page === pagination.currentPage
                    ? "border-[#073b36] bg-[#073b36] text-white"
                    : "border-black/10 bg-white text-[#073b36] hover:border-[#0e7468] hover:bg-[#edf5f2]"
                }`}
              >
                {page.toLocaleString(locale)}
              </Link>
            ),
          )}
          <PageLink
            href={hrefFor(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            label={ar ? "التالي" : "Next"}
          />
        </div>
      )}
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  label,
}: {
  href: Route;
  disabled: boolean;
  label: string;
}) {
  const className =
    "inline-flex min-h-11 w-full items-center justify-center border px-3 text-[10px] font-bold uppercase tracking-[.08em] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0e7468] sm:w-auto";
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className={`${className} cursor-not-allowed border-black/5 bg-neutral-100 text-neutral-400`}
      >
        {label}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className={`${className} border-black/10 bg-white text-[#073b36] transition hover:border-[#0e7468] hover:bg-[#edf5f2]`}
    >
      {label}
    </Link>
  );
}
