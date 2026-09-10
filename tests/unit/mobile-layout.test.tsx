import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import AdminLayout from "@/app/[locale]/admin/layout";

afterEach(cleanup);

const projectRoot = resolve(__dirname, "../..");

function source(path: string) {
  return readFileSync(resolve(projectRoot, path), "utf8");
}

describe("mobile layout regressions", () => {
  it("separates the compact admin navigation from the desktop navigation", async () => {
    const layout = await AdminLayout({
      children: <div>Admin content</div>,
      params: Promise.resolve({ locale: "en" }),
    });
    render(layout);

    expect(
      screen.getByRole("navigation", { name: "Admin navigation" }),
    ).toHaveClass("hidden", "lg:flex");
    expect(
      screen.getByRole("navigation", { name: "Admin mobile navigation" }),
    ).toHaveClass("overflow-x-auto", "lg:hidden");
    expect(screen.getByRole("link", { name: "View store" })).toHaveClass(
      "min-h-11",
    );
  });

  it("allows checkout grid children to shrink inside a phone viewport", () => {
    const checkout = source("src/features/checkout/checkout-form.tsx");

    expect(checkout).toContain(
      "grid min-w-0 gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_400px]",
    );
    expect(checkout.match(/section className="min-w-0/g)).toHaveLength(3);
    expect(checkout).toContain('aside className="h-fit min-w-0');
    expect(checkout).toContain(
      "w-full min-w-0 max-w-full rounded-xs border border-dashed",
    );
  });

  it("contains wide admin tables instead of expanding the page", () => {
    const admin = source("src/app/[locale]/admin/page.tsx");

    expect(admin).toContain(
      'className="mt-4 min-w-0 scroll-mt-6 overflow-hidden',
    );
    expect(admin).toContain('className="max-w-full overflow-x-auto"');
    expect(admin).toContain(
      'aria-label={ar ? "جدول المنتجات" : "Products table"}',
    );
    expect(admin).toContain("tabIndex={0}");
  });

  it("stacks account orders and compacts cart lines on phones", () => {
    const account = source("src/app/[locale]/account/page.tsx");
    const cart = source("src/app/[locale]/cart/page.tsx");

    expect(account).toContain(
      "flex flex-col items-stretch justify-between gap-4 p-4",
    );
    expect(account).toContain("sm:flex-row sm:items-center");
    expect(cart).toContain("grid-cols-[72px_minmax(0,1fr)]");
    expect(cart).toContain("sm:grid-cols-[112px_minmax(0,1fr)_auto]");
    expect(
      cart.match(/className="grid size-11 place-items-center/g),
    ).toHaveLength(3);
  });
});
