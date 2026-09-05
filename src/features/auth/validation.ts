import { z } from "zod";
import { locales, type Locale } from "../../lib/i18n";

const localeSchema = z.enum(locales);
const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .max(254, "Email address is too long.");
const passwordSchema = z
  .string()
  .min(8, "Password must contain at least 8 characters.")
  .max(72, "Password must contain at most 72 characters.");

export const signInSchema = z.object({
  locale: localeSchema,
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

export const signUpSchema = z
  .object({
    locale: localeSchema,
    fullName: z
      .string()
      .trim()
      .min(2, "Enter your full name.")
      .max(100, "Full name is too long."),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  locale: localeSchema,
  email: emailSchema,
});

export const updatePasswordSchema = z
  .object({
    locale: localeSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export function parseLocale(value: FormDataEntryValue | null): Locale {
  const parsed = localeSchema.safeParse(value);
  return parsed.success ? parsed.data : "en";
}

export function safeAuthNext(next: string | null, locale: Locale) {
  const accountPath = `/${locale}/account`;
  if (
    next &&
    !next.includes("\\") &&
    (next === accountPath || next.startsWith(`${accountPath}/`))
  ) {
    return next;
  }
  return accountPath;
}
