import { z } from "zod";
import { normalizeEgyptianPhone } from "@/features/checkout/validation";

export const addressInputSchema = z.object({
  label: z.enum(["clinic", "home", "work", "other"]).default("clinic"),
  customLabel: z
    .string()
    .trim()
    .max(50, { message: "Label must not exceed 50 characters." })
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  recipientName: z
    .string()
    .trim()
    .min(2, { message: "Recipient name must be at least 2 characters." })
    .max(120, { message: "Recipient name must not exceed 120 characters." }),
  phone: z.string().transform((value, context) => {
    const normalized = normalizeEgyptianPhone(value);
    if (!normalized) {
      context.addIssue({
        code: "custom",
        message: "Enter a valid Egyptian mobile number.",
      });
      return z.NEVER;
    }
    return normalized;
  }),
  governorateCode: z
    .string()
    .trim()
    .regex(/^[a-z0-9_]+$/, { message: "Select a valid governorate." })
    .max(80),
  cityCode: z
    .string()
    .trim()
    .regex(/^[a-z0-9_]+$/, { message: "Select a valid city." })
    .max(80),
  city: z
    .string()
    .trim()
    .min(2, { message: "Enter a valid city or district." })
    .max(100),
  streetAddress: z
    .string()
    .trim()
    .min(5, { message: "Street address must be at least 5 characters." })
    .max(300),
  building: z
    .string()
    .trim()
    .max(50)
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  floor: z
    .string()
    .trim()
    .max(30)
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  apartment: z
    .string()
    .trim()
    .max(50)
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  landmark: z
    .string()
    .trim()
    .max(200)
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  isDefault: z.boolean().default(false),
});

export type AddressInputValues = z.input<typeof addressInputSchema>;
export type AddressValidatedValues = z.output<typeof addressInputSchema>;
