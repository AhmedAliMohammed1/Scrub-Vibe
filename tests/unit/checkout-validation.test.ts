import { describe, expect, it } from "vitest";
import { checkoutOrderSchema, normalizeEgyptianPhone, otpRequestSchema } from "../../src/features/checkout/validation";

describe("Egypt checkout validation", () => {
  it.each([
    ["01012345678", "+201012345678"],
    ["201112345678", "+201112345678"],
    ["+20 12 1234 5678", "+201212345678"],
    ["00201512345678", "+201512345678"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeEgyptianPhone(input)).toBe(expected);
  });

  it.each(["", "010123", "+201312345678", "+44123456789"])("rejects %s", (input) => {
    expect(normalizeEgyptianPhone(input)).toBeNull();
    expect(otpRequestSchema.safeParse({ phone: input }).success).toBe(false);
  });

  it("accepts a complete order and rejects excessive quantities", () => {
    const order = {
      verificationToken: "x".repeat(40), locale: "en", customerName: "Mona Ali", email: "",
      phone: "01012345678", governorate: "Cairo", city: "Nasr City",
      streetAddress: "12 Example Street", building: "12", floor: "2", apartment: "4",
      landmark: "", customerNotes: "", paymentMethod: "cod",
      items: [{ variantId: "42", quantity: 2 }],
    };
    expect(checkoutOrderSchema.safeParse(order).success).toBe(true);
    expect(checkoutOrderSchema.safeParse({ ...order, items: [{ variantId: "42", quantity: 11 }] }).success).toBe(false);
  });
});
