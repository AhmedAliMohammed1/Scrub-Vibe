import { z } from "zod";

const egyptianPhone = /^\+20(10|11|12|15)[0-9]{8}$/;

export function normalizeEgyptianPhone(value: string) {
  let phone = value.replace(/[^\d+]/g, "");
  if (phone.startsWith("0020")) phone = `+20${phone.slice(4)}`;
  else if (phone.startsWith("20")) phone = `+${phone}`;
  else if (phone.startsWith("0")) phone = `+20${phone.slice(1)}`;
  return egyptianPhone.test(phone) ? phone : null;
}

export const otpRequestSchema = z.object({
  phone: z.string().transform((value, context) => {
    const normalized = normalizeEgyptianPhone(value);
    if (!normalized) {
      context.addIssue({ code: "custom", message: "Enter a valid Egyptian mobile number." });
      return z.NEVER;
    }
    return normalized;
  }),
});

export const otpVerifySchema = otpRequestSchema.extend({
  code: z.string().trim().regex(/^\d{4,8}$/),
});

export const checkoutOrderSchema = z.object({
  verificationToken: z.string().min(32).max(200),
  locale: z.enum(["en", "ar"]),
  customerName: z.string().trim().min(2).max(120),
  email: z.union([z.literal(""), z.email().max(254)]),
  phone: z.string().transform((value, context) => {
    const normalized = normalizeEgyptianPhone(value);
    if (!normalized) {
      context.addIssue({ code: "custom", message: "Enter a valid Egyptian mobile number." });
      return z.NEVER;
    }
    return normalized;
  }),
  governorate: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(100),
  streetAddress: z.string().trim().min(5).max(300),
  building: z.string().trim().max(50),
  floor: z.string().trim().max(30),
  apartment: z.string().trim().max(30),
  landmark: z.string().trim().max(200),
  customerNotes: z.string().trim().max(1000),
  paymentMethod: z.enum(["cod", "vodafone_cash", "instapay", "paymob"]),
  items: z.array(z.object({
    variantId: z.string().regex(/^\d+$/),
    quantity: z.number().int().min(1).max(10),
  })).min(1).max(30),
});

export type CheckoutOrderInput = z.infer<typeof checkoutOrderSchema>;
