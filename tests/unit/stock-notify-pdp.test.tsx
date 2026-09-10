import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AddProduct } from "@/components/store/add-product";
import type { Product } from "@/features/catalog/types";

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { email: "doctor@example.com" } },
      }),
    },
  }),
}));

// Mock useShop
const mockAddToCart = vi.fn();
const mockToggleWishlist = vi.fn();
vi.mock("@/components/store/cart-provider", () => ({
  useShop: () => ({
    cart: 0,
    wishlist: [],
    addToCart: mockAddToCart,
    toggleWishlist: mockToggleWishlist,
  }),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const mockProduct: Product = {
  id: "42",
  slug: "premium-flex-scrub-top",
  title: { en: "Premium Flex Scrub Top", ar: "بلوزة سكراب مرنة بريميوم" },
  description: { en: "Comfortable medical scrub top", ar: "بلوزة طبية مريحة وعملية" },
  category: "scrubs",
  price: 75000,
  compareAt: 90000,
  codDeposit: 10000,
  color: "#073b36",
  colorCode: "emerald",
  colorName: { en: "Emerald", ar: "زمردي" },
  sizes: ["S", "M", "L"],
  inStock: true,
  badge: "new",
  art: "ink",
  image: {
    src: "/mock.png",
    alt: { en: "Emerald top", ar: "بلوزة زمردي" },
  },
  colors: [
    {
      id: "c-emerald",
      code: "emerald",
      swatch: "#073b36",
      name: { en: "Emerald", ar: "زمردي" },
      sizes: ["S", "M"], // L is out of stock!
      variants: { S: "v-s", M: "v-m" },
      allVariants: { S: "v-s", M: "v-m", L: "v-l" },
      stockBySize: { S: 5, M: 2, L: 0 },
      inStock: true,
    },
    {
      id: "c-burgundy",
      code: "burgundy",
      swatch: "#6f182f",
      name: { en: "Burgundy", ar: "نبيتي" },
      sizes: [], // All sizes out of stock!
      variants: {},
      allVariants: { S: "v-bs", M: "v-bm" },
      stockBySize: { S: 0, M: 0 },
      inStock: false,
    },
  ],
};

describe("PDP Back-In-Stock Notification UX", () => {
  it("renders Add to shopping bag when an in-stock size is selected", () => {
    render(<AddProduct product={mockProduct} locale="en" />);

    // Default size is S (in stock)
    const addBtn = screen.getByRole("button", { name: /add to shopping bag/i });
    expect(addBtn).toBeInTheDocument();
    expect(addBtn).toBeEnabled();

    // Out of stock size L button should be present and indicate out of stock
    const sizeLBtn = screen.getByRole("button", { name: /L \(Out of stock - click to notify\)/i });
    expect(sizeLBtn).toBeInTheDocument();
  });

  it("transforms primary button to Notify me when available when sold-out size L is clicked", async () => {
    render(<AddProduct product={mockProduct} locale="en" />);

    const sizeLBtn = screen.getByRole("button", { name: /L \(Out of stock - click to notify\)/i });
    fireEvent.click(sizeLBtn);

    // Primary button morphs into notify button
    expect(
      screen.queryByRole("button", { name: /add to shopping bag/i }),
    ).toBeNull();
    const notifyBtn = screen.getByRole("button", {
      name: /notify me when available/i,
    });
    expect(notifyBtn).toBeInTheDocument();

    // Reassurance banner is visible
    expect(
      screen.getByText(/this size or colour is currently out of stock/i),
    ).toBeInTheDocument();
  });

  it("opens the stock notify modal dialog when clicking Notify me when available", async () => {
    render(<AddProduct product={mockProduct} locale="en" />);

    const sizeLBtn = screen.getByRole("button", { name: /L \(Out of stock - click to notify\)/i });
    fireEvent.click(sizeLBtn);

    const notifyBtn = screen.getByRole("button", {
      name: /notify me when available/i,
    });
    fireEvent.click(notifyBtn);

    // Modal dialog is opened
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /notify me when available/i }),
    ).toBeInTheDocument();

    // Email field is auto-populated or ready for input
    const emailInput = screen.getByLabelText(/your email address/i) as HTMLInputElement;
    await waitFor(() => {
      expect(emailInput.value).toBe("doctor@example.com");
    });
  });

  it("submits stock notification subscription to /api/stock/subscribe", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    render(<AddProduct product={mockProduct} locale="en" />);

    // Click sold-out size L
    fireEvent.click(
      screen.getByRole("button", { name: /L \(Out of stock - click to notify\)/i }),
    );

    // Click notify button
    fireEvent.click(
      screen.getByRole("button", { name: /notify me when available/i }),
    );

    const emailInput = screen.getByLabelText(/your email address/i);
    fireEvent.change(emailInput, { target: { value: "doctor@example.com" } });

    // Set Alert submit button
    const submitBtn = screen.getByRole("button", { name: /set alert/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/stock/subscribe",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            productId: "42",
            variantId: "v-l",
            email: "doctor@example.com",
            locale: "en",
          }),
        }),
      );
    });

    // Success screen shown
    expect(
      await screen.findByText(/alert activated successfully/i),
    ).toBeInTheDocument();

    fetchSpy.mockRestore();
  });

  it("supports sold-out colour swatches and Arabic RTL locale", async () => {
    render(<AddProduct product={mockProduct} locale="ar" />);

    // Burgundy swatch indicates out of stock in Arabic
    const burgundySwatch = screen.getByRole("radio", {
      name: /نبيتي \(نفد المخزون\)/i,
    });
    expect(burgundySwatch).toBeInTheDocument();

    // Clicking burgundy switches color and displays Arabic notify button
    fireEvent.click(burgundySwatch);

    const arabicNotifyBtn = screen.getByRole("button", {
      name: /أخبرني عند توفر هذا المقاس/i,
    });
    expect(arabicNotifyBtn).toBeInTheDocument();
  });
});
