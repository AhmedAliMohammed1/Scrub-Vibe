import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PaginationNav } from "../../src/components/ui/pagination-nav";

afterEach(cleanup);

describe("PaginationNav", () => {
  it("announces the visible range and keeps filters in page links", () => {
    render(
      <PaginationNav
        locale="en"
        pathname="/en/admin/orders"
        searchParams={{ status: "confirmed" }}
        currentPage={2}
        totalItems={35}
        pageSize={10}
        anchor="orders-list"
        itemLabel={{ en: "orders", ar: "طلب" }}
      />,
    );

    expect(screen.getByText("Showing 11–20 of 35 orders")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Page 2" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute(
      "href",
      "/en/admin/orders?status=confirmed&page=3#orders-list",
    );
  });

  it("uses Arabic labels and disables unavailable navigation", () => {
    render(
      <PaginationNav
        locale="ar"
        pathname="/ar/account/returns"
        currentPage={1}
        totalItems={11}
        pageSize={10}
        itemLabel={{ en: "requests", ar: "طلب" }}
      />,
    );

    expect(screen.getByText("عرض 1–10 من 11 طلب")).toBeInTheDocument();
    expect(screen.getByText("السابق")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("link", { name: "التالي" })).toHaveAttribute(
      "href",
      "/ar/account/returns?page=2",
    );
  });

  it("can hide redundant controls when a collection fits on one page", () => {
    const { container } = render(
      <PaginationNav
        locale="en"
        pathname="/en/shop"
        currentPage={1}
        totalItems={4}
        pageSize={12}
        itemLabel={{ en: "items", ar: "عنصر" }}
        hideWhenSinglePage
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
