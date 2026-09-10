import { describe, expect, it } from "vitest";
import { checkoutOrderSchema, normalizeEgyptianPhone, otpRequestSchema } from "../../src/features/checkout/validation";
import { isCheckoutPhoneOtpEnabled } from "../../src/features/checkout/config";

describe("Egypt checkout validation", () => {
  it("accepts safe discount codes and rejects unsafe values", () => {
    const valid = checkoutOrderSchema.safeParse({
      verificationToken: "", locale: "en", customerName: "Mona Ali", email: "",
      phone: "01012345678", governorateCode: "cairo", cityCode: "nasr_city", city: "Nasr City",
      streetAddress: "12 Example Street", building: "", floor: "", apartment: "",
      landmark: "", customerNotes: "", paymentMethod: "instapay", codDepositMethod: "",
      discountCode: "SAVE_10", items: [{ variantId: "1", quantity: 1 }],
    });
    expect(valid.success).toBe(true);
    expect(valid.success && valid.data.discountCode).toBe("SAVE_10");
    expect(valid.success && checkoutOrderSchema.safeParse({ ...valid.data, discountCode: "BAD CODE!" }).success).toBe(false);
  });
  it.each([
    [undefined, true], ["true", true], ["false", false], ["0", false], ["OFF", false], ["no", false],
  ])("reads OTP flag %s as %s", (value, expected) => {
    expect(isCheckoutPhoneOtpEnabled(value)).toBe(expected);
  });

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
      phone: "01012345678", governorateCode: "cairo", cityCode: "nasr_city", city: "",
      streetAddress: "12 Example Street", building: "12", floor: "2", apartment: "4",
      landmark: "", customerNotes: "", paymentMethod: "cod", codDepositMethod: "vodafone_cash",
      items: [{ variantId: "42", quantity: 2 }],
    };
    expect(checkoutOrderSchema.safeParse(order).success).toBe(true);
    expect(checkoutOrderSchema.safeParse({ ...order, items: [{ variantId: "42", quantity: 11 }] }).success).toBe(false);
  });

  it.each(["vodafone_cash", "instapay"] as const)(
    "accepts the %s manual proof-review method",
    (paymentMethod) => {
      expect(checkoutOrderSchema.safeParse({
        verificationToken: "x".repeat(40), locale: "en", customerName: "Mona Ali", email: "",
        phone: "01012345678", governorateCode: "cairo", cityCode: "nasr_city", city: "",
        streetAddress: "12 Example Street", building: "12", floor: "2", apartment: "4",
        landmark: "", customerNotes: "", paymentMethod, codDepositMethod: "",
        items: [{ variantId: "42", quantity: 1 }],
      }).success).toBe(true);
    },
  );

  it("accepts an empty verification token for the server-controlled disabled mode", () => {
    expect(checkoutOrderSchema.safeParse({
      verificationToken: "", locale: "en", customerName: "Mona Ali", email: "",
      phone: "01012345678", governorateCode: "cairo", cityCode: "nasr_city", city: "",
      streetAddress: "12 Example Street", building: "", floor: "", apartment: "",
      landmark: "", customerNotes: "", paymentMethod: "cod", codDepositMethod: "instapay",
      items: [{ variantId: "42", quantity: 1 }],
    }).success).toBe(true);
  });

  it("requires a deposit channel for cash on delivery", () => {
    const result = checkoutOrderSchema.safeParse({
      verificationToken: "", locale: "en", customerName: "Mona Ali", email: "",
      phone: "01012345678", governorateCode: "cairo", cityCode: "nasr_city", city: "",
      streetAddress: "12 Example Street", building: "", floor: "", apartment: "",
      landmark: "", customerNotes: "", paymentMethod: "cod", codDepositMethod: "",
      items: [{ variantId: "42", quantity: 1 }],
    });
    expect(result.success).toBe(false);
  });

  it("requires a typed district when Other area is selected", () => {
    const base = {
      verificationToken: "", locale: "en", customerName: "Mona Ali", email: "",
      phone: "01012345678", governorateCode: "aswan", cityCode: "other",
      streetAddress: "12 Example Street", building: "", floor: "", apartment: "",
      landmark: "", customerNotes: "", paymentMethod: "instapay", codDepositMethod: "",
      items: [{ variantId: "42", quantity: 1 }],
    };
    expect(checkoutOrderSchema.safeParse({ ...base, city: "" }).success).toBe(false);
    expect(checkoutOrderSchema.safeParse({ ...base, city: "Daraw" }).success).toBe(true);
  });

  it("accepts a comprehensive plain-text street address with empty granular fields", () => {
    const plainTextOrder = {
      verificationToken: "",
      locale: "ar" as const,
      customerName: "د. سارة محمود",
      email: "dr.sara@example.com",
      phone: "01098765432",
      governorateCode: "cairo",
      cityCode: "nasr_city",
      city: "Nasr City",
      streetAddress:
        "شارع مصطفى النحاس، عمارة الأطباء رقم ١٥، الدور الرابع، عيادة ٤٠٢، أمام مستشفى المروة",
      building: "",
      floor: "",
      apartment: "",
      landmark: "",
      customerNotes: "الاتصال قبل التوصيل بنصف ساعة",
      paymentMethod: "vodafone_cash" as const,
      codDepositMethod: "",
      discountCode: "",
      items: [{ variantId: "1", quantity: 2 }],
    };
    const result = checkoutOrderSchema.safeParse(plainTextOrder);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.streetAddress).toBe(plainTextOrder.streetAddress);
      expect(result.data.building).toBe("");
      expect(result.data.floor).toBe("");
    }
  });

  it("validates streetAddress boundaries in quick plain-text mode (5 to 300 chars)", () => {
    const base = {
      verificationToken: "",
      locale: "en" as const,
      customerName: "Dr. Mona",
      email: "",
      phone: "01012345678",
      governorateCode: "cairo",
      cityCode: "nasr_city",
      city: "Nasr City",
      building: "",
      floor: "",
      apartment: "",
      landmark: "",
      customerNotes: "",
      paymentMethod: "instapay" as const,
      codDepositMethod: "",
      items: [{ variantId: "1", quantity: 1 }],
    };

    // Too short (< 5 chars)
    expect(
      checkoutOrderSchema.safeParse({ ...base, streetAddress: "St" }).success,
    ).toBe(false);
    // Exact minimum (5 chars)
    expect(
      checkoutOrderSchema.safeParse({ ...base, streetAddress: "15 St" }).success,
    ).toBe(true);
    // Too long (> 300 chars)
    expect(
      checkoutOrderSchema.safeParse({
        ...base,
        streetAddress: "A".repeat(301),
      }).success,
    ).toBe(false);
    // At maximum boundary (300 chars)
    expect(
      checkoutOrderSchema.safeParse({
        ...base,
        streetAddress: "A".repeat(300),
      }).success,
    ).toBe(true);
  });
});

