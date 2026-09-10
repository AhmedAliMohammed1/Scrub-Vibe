export type SearchParamValue = string | string[] | undefined;

export type PaginationModel = {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  from: number;
  to: number;
};

export function parsePage(value: SearchParamValue): number {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^\d+$/.test(raw)) return 1;
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function getPagination(
  totalItems: number,
  requestedPage: number,
  pageSize = 10,
): PaginationModel {
  const safeTotal = Math.max(0, Math.floor(totalItems));
  const safeSize = Math.max(1, Math.floor(pageSize));
  const totalPages = Math.max(1, Math.ceil(safeTotal / safeSize));
  const currentPage = Math.min(Math.max(1, requestedPage), totalPages);
  const from = (currentPage - 1) * safeSize;

  return {
    currentPage,
    pageSize: safeSize,
    totalItems: safeTotal,
    totalPages,
    from,
    to: Math.min(from + safeSize - 1, Math.max(0, safeTotal - 1)),
  };
}

export function paginateItems<T>(
  items: readonly T[],
  requestedPage: number,
  pageSize = 10,
) {
  const pagination = getPagination(items.length, requestedPage, pageSize);
  return {
    items: items.slice(pagination.from, pagination.from + pagination.pageSize),
    pagination,
  };
}

export function paginationPages(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([
    1,
    2,
    currentPage - 1,
    currentPage,
    currentPage + 1,
    totalPages - 1,
    totalPages,
  ]);
  const sorted = [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  return sorted.flatMap<number | "ellipsis">((page, index) => {
    const previous = sorted[index - 1];
    return previous && page - previous > 1 ? ["ellipsis", page] : [page];
  });
}

export function buildPaginationHref({
  pathname,
  searchParams,
  page,
  pageParam = "page",
  anchor,
}: {
  pathname: string;
  searchParams?: Record<string, SearchParamValue>;
  page: number;
  pageParam?: string;
  anchor?: string;
}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (key === pageParam || value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) {
      params.append(key, item);
    }
  }
  if (page > 1) params.set(pageParam, String(page));

  const query = params.toString();
  return `${pathname}${query ? `?${query}` : ""}${anchor ? `#${anchor}` : ""}`;
}
