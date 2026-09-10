import { describe, expect, it } from "vitest";
import {
  buildPaginationHref,
  getPagination,
  paginateItems,
  paginationPages,
  parsePage,
} from "../../src/lib/pagination";

describe("pagination", () => {
  it.each([
    [undefined, 1],
    ["", 1],
    ["0", 1],
    ["-2", 1],
    ["abc", 1],
    [["4", "8"], 4],
    ["12", 12],
  ])("parses page %j as %i", (value, expected) => {
    expect(parsePage(value)).toBe(expected);
  });

  it("clamps pages and returns an inclusive Supabase range", () => {
    expect(getPagination(95, 99, 10)).toEqual({
      currentPage: 10,
      pageSize: 10,
      totalItems: 95,
      totalPages: 10,
      from: 90,
      to: 94,
    });
  });

  it("slices in-memory collections with the same model", () => {
    const result = paginateItems(
      Array.from({ length: 23 }, (_, i) => i + 1),
      2,
    );
    expect(result.items).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    expect(result.pagination.totalPages).toBe(3);
  });

  it("keeps filters, removes page one, and adds the list anchor", () => {
    expect(
      buildPaginationHref({
        pathname: "/en/admin/orders",
        searchParams: { status: "confirmed", page: "3" },
        page: 1,
        anchor: "orders-list",
      }),
    ).toBe("/en/admin/orders?status=confirmed#orders-list");
  });

  it("uses a compact page window for long collections", () => {
    expect(paginationPages(8, 20)).toEqual([
      1,
      2,
      "ellipsis",
      7,
      8,
      9,
      "ellipsis",
      19,
      20,
    ]);
  });
});
