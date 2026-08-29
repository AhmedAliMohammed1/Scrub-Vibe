export function formatMoney(amountInMinor: number, locale: "en" | "ar" = "en") {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(amountInMinor / 100);
}

export function discountPercent(price: number, compareAt?: number | null) {
  if (!compareAt || compareAt <= price || compareAt <= 0) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}
