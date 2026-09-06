export function isCheckoutPhoneOtpEnabled(
  value = process.env.CHECKOUT_PHONE_OTP_ENABLED,
) {
  if (!value) return true;
  return !["false", "0", "off", "no"].includes(value.trim().toLowerCase());
}
