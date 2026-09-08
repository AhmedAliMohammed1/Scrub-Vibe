import { z } from "zod";
import { normalizeDiscountCode } from "./types";

export const discountPreviewSchema = z.object({
  code: z.string().transform(normalizeDiscountCode).pipe(
    z.string().min(3).max(32).regex(/^[A-Z0-9][A-Z0-9_-]*$/),
  ),
  phone: z.string().max(30).optional().default(""),
  paymentMethod: z.enum(["cod", "vodafone_cash", "instapay", "paymob"]),
  items: z.array(z.object({
    variantId: z.string().regex(/^\d+$/),
    quantity: z.number().int().min(1).max(10),
  })).min(1).max(30),
});

export const campaignFormSchema = z.object({
  campaignId: z.union([z.literal(""), z.coerce.number().int().positive()]).optional(),
  nameEn: z.string().trim().min(2).max(120),
  nameAr: z.string().trim().min(2).max(120),
  descriptionEn: z.string().trim().max(1000),
  descriptionAr: z.string().trim().max(1000),
  channel: z.enum(["instagram", "facebook", "tiktok", "whatsapp", "email", "influencer", "offline", "other"]),
  utmCampaign: z.union([z.literal(""), z.string().trim().max(150).regex(/^[A-Za-z0-9._-]+$/)]),
  budget: z.union([z.literal(""), z.coerce.number().positive().max(1_000_000)]),
  startsOn: z.iso.date(),
  endsOn: z.iso.date(),
}).refine((value) => value.endsOn >= value.startsOn, { path: ["endsOn"] });

export const discountCodeFormSchema = z.object({
  discountCodeId: z.union([z.literal(""), z.coerce.number().int().positive()]).optional(),
  campaignId: z.union([z.literal(""), z.coerce.number().int().positive()]),
  code: z.string().transform(normalizeDiscountCode).pipe(
    z.string().min(3).max(32).regex(/^[A-Z0-9][A-Z0-9_-]*$/),
  ),
  discountType: z.enum(["percentage", "fixed"]),
  value: z.coerce.number().positive().max(1_000_000),
  minimumSubtotal: z.coerce.number().min(0).max(1_000_000),
  maximumDiscount: z.union([z.literal(""), z.coerce.number().positive().max(1_000_000)]),
  usageLimit: z.union([z.literal(""), z.coerce.number().int().positive().max(1_000_000)]),
  perCustomerLimit: z.coerce.number().int().min(1).max(100),
  startsOn: z.union([z.literal(""), z.iso.date()]),
  endsOn: z.union([z.literal(""), z.iso.date()]),
}).superRefine((value, context) => {
  if (value.endsOn && value.startsOn && value.endsOn < value.startsOn) {
    context.addIssue({ code: "custom", path: ["endsOn"], message: "End date must follow start date." });
  }
  if (value.discountType === "percentage" && value.value > 100) {
    context.addIssue({ code: "custom", path: ["value"], message: "Percentage cannot exceed 100%." });
  }
  if (value.discountType === "fixed" && value.maximumDiscount !== "") {
    context.addIssue({ code: "custom", path: ["maximumDiscount"], message: "Fixed discounts do not use a maximum cap." });
  }
});
