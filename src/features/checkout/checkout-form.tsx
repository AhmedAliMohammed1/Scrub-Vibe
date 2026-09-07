"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { CheckCircle2, CreditCard, Loader2, LockKeyhole, Package, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useShop } from "@/components/store/cart-provider";
import type { Locale } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";

type PaymentMethod = "cod" | "vodafone_cash" | "instapay" | "paymob";
type Props = {
  locale: Locale;
  otpEnabled: boolean;
  payments: {
    paymob: boolean;
    vodafoneNumber: string | null;
    instapayAddress: string | null;
  };
};

const governorates = [
  "Cairo", "Giza", "Alexandria", "Dakahlia", "Red Sea", "Beheira", "Fayoum",
  "Gharbia", "Ismailia", "Monufia", "Minya", "Qalyubia", "New Valley", "Suez",
  "Aswan", "Assiut", "Beni Suef", "Port Said", "Damietta", "Sharqia",
  "South Sinai", "Kafr El Sheikh", "Matrouh", "Luxor", "Qena", "North Sinai", "Sohag",
];

const inputClass = "h-12 w-full border border-black/20 bg-white px-4 text-sm outline-none focus:border-[#0e7468]";
const paymentHelpUrl =
  "https://wa.me/201096733209?text=" +
  encodeURIComponent("Hello Scrub Vibe, I need the Vodafone Cash or InstaPay transfer details for my order.");

export function CheckoutForm({ locale, payments, otpEnabled }: Props) {
  const ar = locale === "ar";
  const router = useRouter();
  const { cartItems, clearCart } = useShop();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [busy, setBusy] = useState<"otp" | "verify" | "order" | null>(null);
  const [error, setError] = useState("");
  const subtotal = cartItems.reduce((sum, line) => sum + line.price * line.quantity, 0);

  const copy: Record<string, [string, string]> = {
    invalid_phone: ["Enter a valid Egyptian mobile number.", "أدخل رقم موبايل مصري صحيح."],
    too_many_requests: ["Too many attempts. Please wait ten minutes.", "محاولات كثيرة. انتظر عشر دقائق ثم حاول مجدداً."],
    otp_not_configured: ["Phone verification is being configured. Please contact us to order.", "جارٍ إعداد التحقق بالهاتف. تواصل معنا لإتمام الطلب."],
    otp_delivery_failed: ["The verification message could not be sent.", "تعذر إرسال رسالة التحقق."],
    invalid_code: ["That verification code is not correct.", "رمز التحقق غير صحيح."],
    verification_failed: ["Verification failed. Please request a new code.", "فشل التحقق. اطلب رمزاً جديداً."],
    verification_expired: ["Your verification expired. Please verify the phone again.", "انتهت صلاحية التحقق. تحقق من الهاتف مرة أخرى."],
    insufficient_stock: ["One of your selected items just sold out. Please review your bag.", "نفدت إحدى القطع المختارة. راجع حقيبتك."],
    payment_proof_required: ["Upload your transfer screenshot.", "ارفع صورة إيصال التحويل."],
    invalid_payment_proof: ["Use a JPG, PNG or WebP image up to 5 MB.", "استخدم صورة JPG أو PNG أو WebP بحد أقصى ٥ ميجابايت."],
    paymob_not_configured: ["Online payment is not available yet. Choose another method.", "الدفع الإلكتروني غير متاح حالياً. اختر طريقة أخرى."],
    checkout_configuration_error: ["Checkout is missing its secure server connection. Please contact us while we fix it.", "إعداد الاتصال الآمن للدفع غير مكتمل. تواصل معنا لحين إصلاحه."],
    order_failed: ["We could not place the order. Please try again.", "تعذر إنشاء الطلب. حاول مرة أخرى."],
  };
  const showError = (key: string) => setError((copy[key] ?? copy.order_failed)[ar ? 1 : 0]);

  async function requestOtp() {
    setBusy("otp"); setError(""); setVerificationToken("");
    const response = await fetch("/api/checkout/otp/request", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone }),
    });
    const result = await response.json() as { error?: string };
    setBusy(null);
    if (!response.ok) { showError(result.error ?? "otp_delivery_failed"); return; }
    setOtpSent(true);
  }

  async function verifyOtp() {
    setBusy("verify"); setError("");
    const response = await fetch("/api/checkout/otp/verify", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, code: otp }),
    });
    const result = await response.json() as { error?: string; token?: string };
    setBusy(null);
    if (!response.ok || !result.token) { showError(result.error ?? "verification_failed"); return; }
    setVerificationToken(result.token); setOtp("");
  }

  async function placeOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (otpEnabled && !verificationToken) { setError(ar ? "تحقق من رقم الهاتف أولاً." : "Verify your phone before placing the order."); return; }
    if (cartItems.some((line) => !line.variantId)) { setError(ar ? "حدّث حقيبتك بإزالة المنتجات القديمة وإضافتها مرة أخرى." : "Refresh your bag by removing and re-adding older items."); return; }
    setBusy("order"); setError("");
    const form = new FormData(event.currentTarget);
    const payload = {
      verificationToken, locale, phone,
      customerName: form.get("customerName"), email: form.get("email"),
      governorate: form.get("governorate"), city: form.get("city"), streetAddress: form.get("streetAddress"),
      building: form.get("building"), floor: form.get("floor"), apartment: form.get("apartment"),
      landmark: form.get("landmark"), customerNotes: form.get("customerNotes"), paymentMethod,
      items: cartItems.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
    };
    const body = new FormData();
    body.set("order", JSON.stringify(payload));
    const proof = form.get("proof");
    if (proof instanceof File && proof.size) body.set("proof", proof);
    let response: Response;
    let result: { error?: string; orderNumber?: string; trackingToken?: string; paymentUrl?: string | null };
    try {
      response = await fetch("/api/checkout/orders", { method: "POST", body });
      result = await response.json() as typeof result;
    } catch {
      setBusy(null);
      showError("order_failed");
      return;
    }
    setBusy(null);
    if (!response.ok || !result.orderNumber || !result.trackingToken) { showError(result.error ?? "order_failed"); return; }
    try {
      const saved = JSON.parse(localStorage.getItem("scrub-vibe-order-tokens") ?? "{}") as Record<string, string>;
      saved[result.orderNumber] = result.trackingToken;
      localStorage.setItem("scrub-vibe-order-tokens", JSON.stringify(saved));
    } catch { /* The authenticated account can still open its order. */ }
    clearCart();
    if (result.paymentUrl) window.location.assign(result.paymentUrl);
    else router.push(`/${locale}/track/${result.orderNumber}` as Route);
  }

  if (!cartItems.length) return (
    <main className="mx-auto min-h-[65vh] max-w-2xl px-5 py-24 text-center">
      <Package className="mx-auto" size={36} strokeWidth={1.2} />
      <h1 className="mt-5 font-serif text-5xl">{ar ? "حقيبتك فارغة" : "Your bag is empty"}</h1>
      <Link href={`/${locale}/shop`} className="mt-8 inline-block bg-[#073b36] px-7 py-4 text-xs font-bold uppercase tracking-[.14em] text-white">{ar ? "تسوق الآن" : "Shop now"}</Link>
    </main>
  );

  const paymentOptions: { id: PaymentMethod; title: string; detail: string; icon: typeof CreditCard }[] = [
    { id: "cod", title: ar ? "الدفع عند الاستلام" : "Cash on delivery", detail: ar ? "ادفع نقداً عند استلام الطلب." : "Pay in cash when your order arrives.", icon: Package },
    ...(payments.paymob ? [{ id: "paymob" as const, title: ar ? "بطاقة أو محفظة إلكترونية" : "Card or mobile wallet", detail: ar ? "دفع آمن عبر Paymob، بما في ذلك المحافظ المتاحة." : "Secure Paymob checkout for cards and enabled wallets.", icon: CreditCard }] : []),
    { id: "vodafone_cash", title: "Vodafone Cash", detail: payments.vodafoneNumber ? (ar ? `حوّل إلى ${payments.vodafoneNumber} ثم ارفع صورة الإيصال.` : `Transfer to ${payments.vodafoneNumber}, then upload the receipt.`) : (ar ? "اطلب بيانات التحويل عبر واتساب، ثم ارفع صورة الإيصال." : "Get the transfer details on WhatsApp, then upload the receipt."), icon: Smartphone },
    { id: "instapay", title: "InstaPay", detail: payments.instapayAddress ? (ar ? `حوّل إلى ${payments.instapayAddress} ثم ارفع صورة الإيصال.` : `Transfer to ${payments.instapayAddress}, then upload the receipt.`) : (ar ? "اطلب بيانات التحويل عبر واتساب، ثم ارفع صورة الإيصال." : "Get the transfer details on WhatsApp, then upload the receipt."), icon: Smartphone },
  ];
  const manualPayment = paymentMethod === "vodafone_cash" || paymentMethod === "instapay";
  const manualDestinationConfigured = paymentMethod === "vodafone_cash"
    ? Boolean(payments.vodafoneNumber)
    : paymentMethod === "instapay"
      ? Boolean(payments.instapayAddress)
      : true;

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 md:px-10 md:py-20">
      <p className="eyebrow text-[#0e7468]">{ar ? "دفع آمن" : "SECURE CHECKOUT"}</p>
      <h1 className="mt-3 font-serif text-5xl md:text-7xl">{ar ? "أكمل طلبك" : "Complete your order"}</h1>
      <form onSubmit={placeOrder} className="mt-10 grid gap-8 lg:grid-cols-[1fr_390px]">
        <div className="grid gap-7">
          <section className="border border-black/10 bg-white p-5 md:p-7">
            <div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full bg-[#073b36] text-xs text-white">1</span><h2 className="font-serif text-3xl">{ar ? "بيانات التواصل" : "Contact details"}</h2></div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-xs font-bold">{ar ? "الاسم بالكامل" : "Full name"}<input name="customerName" className={inputClass} required minLength={2} autoComplete="name" /></label>
              <label className="grid gap-2 text-xs font-bold">{ar ? "البريد الإلكتروني (اختياري)" : "Email (optional)"}<input name="email" type="email" className={inputClass} autoComplete="email" /></label>
              <div className="sm:col-span-2">
                <label className="grid gap-2 text-xs font-bold">{ar ? "رقم الموبايل المصري" : "Egyptian mobile number"}<span className="flex gap-2"><input value={phone} onChange={(event) => { setPhone(event.target.value); setVerificationToken(""); setOtpSent(false); }} className={inputClass} inputMode="tel" placeholder="01xxxxxxxxx" required autoComplete="tel" disabled={otpEnabled && Boolean(verificationToken)} />{otpEnabled && <button type="button" onClick={requestOtp} disabled={Boolean(busy) || Boolean(verificationToken)} className="min-w-32 bg-[#0e7468] px-4 text-[10px] font-bold uppercase tracking-[.1em] text-white disabled:opacity-50">{busy === "otp" ? <Loader2 className="mx-auto animate-spin" size={16} /> : verificationToken ? (ar ? "تم التحقق" : "Verified") : (ar ? "إرسال الرمز" : "Send OTP")}</button>}</span></label>
                {otpEnabled && otpSent && !verificationToken && <div className="mt-3 flex gap-2"><input value={otp} onChange={(event) => setOtp(event.target.value)} className={inputClass} inputMode="numeric" placeholder={ar ? "رمز التحقق" : "Verification code"} maxLength={8} /><button type="button" onClick={verifyOtp} disabled={busy === "verify" || otp.length < 4} className="min-w-32 border border-[#0e7468] px-4 text-[10px] font-bold uppercase tracking-[.1em] text-[#073b36] disabled:opacity-50">{busy === "verify" ? <Loader2 className="mx-auto animate-spin" size={16} /> : (ar ? "تحقق" : "Verify")}</button></div>}
                {otpEnabled && verificationToken && <p className="mt-3 flex items-center gap-2 text-xs font-bold text-[#0e7468]"><CheckCircle2 size={15} />{ar ? "تم التحقق من رقم الهاتف." : "Phone number verified."}</p>}
                {!otpEnabled && <p className="mt-3 text-xs text-neutral-500">{ar ? "التحقق برمز الهاتف غير مطلوب حالياً." : "Phone OTP verification is not currently required."}</p>}
              </div>
            </div>
          </section>

          <section className="border border-black/10 bg-white p-5 md:p-7">
            <div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full bg-[#073b36] text-xs text-white">2</span><h2 className="font-serif text-3xl">{ar ? "عنوان التوصيل" : "Delivery address"}</h2></div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-xs font-bold">{ar ? "المحافظة" : "Governorate"}<select name="governorate" className={inputClass} required defaultValue=""><option value="" disabled>{ar ? "اختر المحافظة" : "Choose governorate"}</option>{governorates.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="grid gap-2 text-xs font-bold">{ar ? "المدينة / المنطقة" : "City / district"}<input name="city" className={inputClass} required /></label>
              <label className="grid gap-2 text-xs font-bold sm:col-span-2">{ar ? "اسم الشارع والعنوان" : "Street address"}<input name="streetAddress" className={inputClass} required minLength={5} autoComplete="street-address" /></label>
              <label className="grid gap-2 text-xs font-bold">{ar ? "المبنى" : "Building"}<input name="building" className={inputClass} /></label>
              <label className="grid gap-2 text-xs font-bold">{ar ? "الدور" : "Floor"}<input name="floor" className={inputClass} /></label>
              <label className="grid gap-2 text-xs font-bold">{ar ? "الشقة" : "Apartment"}<input name="apartment" className={inputClass} /></label>
              <label className="grid gap-2 text-xs font-bold">{ar ? "علامة مميزة" : "Landmark"}<input name="landmark" className={inputClass} /></label>
              <label className="grid gap-2 text-xs font-bold sm:col-span-2">{ar ? "ملاحظات الطلب" : "Order notes"}<textarea name="customerNotes" className="min-h-24 border border-black/20 bg-white p-4 text-sm" maxLength={1000} /></label>
            </div>
          </section>

          <section className="border border-black/10 bg-white p-5 md:p-7">
            <div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full bg-[#073b36] text-xs text-white">3</span><h2 className="font-serif text-3xl">{ar ? "طريقة الدفع" : "Payment method"}</h2></div>
            <div className="mt-6 grid gap-3">{paymentOptions.map(({ id, title, detail, icon: Icon }) => <label key={id} className={`flex cursor-pointer gap-4 border p-4 ${paymentMethod === id ? "border-[#0e7468] bg-[#dce9e5]/60" : "border-black/10"}`}><input type="radio" name="paymentMethod" value={id} checked={paymentMethod === id} onChange={() => setPaymentMethod(id)} className="mt-1 accent-[#0e7468]" /><Icon size={21} className="shrink-0" /><span><strong className="block text-sm">{title}</strong><span className="mt-1 block text-xs leading-5 text-neutral-600">{detail}</span></span></label>)}</div>
            {manualPayment && <div className="mt-5 grid gap-4">{!manualDestinationConfigured && <p className="border border-[#0e7468]/25 bg-[#dce9e5]/40 p-4 text-xs leading-5 text-neutral-700">{ar ? "قبل التحويل، احصل على بيانات الدفع الصحيحة من فريق Scrub Vibe عبر واتساب." : "Before transferring, get the correct payment details from the Scrub Vibe team on WhatsApp."} <a href={paymentHelpUrl} target="_blank" rel="noreferrer" className="font-bold text-[#0e7468] underline">{ar ? "فتح واتساب" : "Open WhatsApp"}</a></p>}<label className="grid gap-2 text-xs font-bold">{ar ? "صورة إيصال التحويل" : "Transfer screenshot"}<input name="proof" type="file" accept="image/jpeg,image/png,image/webp" required className="border border-dashed border-[#0e7468] bg-[#dce9e5]/30 p-5 text-xs" /><span className="font-normal text-neutral-500">{ar ? "JPG أو PNG أو WebP — بحد أقصى ٥ ميجابايت. لن يبدأ تجهيز الطلب حتى تتم مراجعة التحويل." : "JPG, PNG or WebP — maximum 5 MB. Fulfilment starts after the transfer is reviewed."}</span></label></div>}
          </section>
        </div>

        <aside className="h-fit border border-black/10 bg-white p-5 lg:sticky lg:top-24">
          <h2 className="font-serif text-3xl">{ar ? "ملخص الطلب" : "Order summary"}</h2>
          <div className="mt-5 max-h-80 divide-y divide-black/10 overflow-auto">{cartItems.map((line) => <div key={line.key} className="grid grid-cols-[56px_1fr_auto] gap-3 py-3"><div className="relative aspect-[3/4] overflow-hidden bg-[#ebe9e4]"><Image src={line.image.src} alt={line.image.alt[locale]} fill sizes="56px" className="object-cover" /></div><div><strong className="text-xs">{line.title[locale]}</strong><p className="mt-1 text-[10px] text-neutral-500">{line.colourName[locale]} · {line.size} · ×{line.quantity}</p></div><strong className="text-[11px]">{formatMoney(line.price * line.quantity, locale)}</strong></div>)}</div>
          <dl className="mt-5 border-t pt-4 text-sm"><div className="flex justify-between"><dt>{ar ? "المنتجات" : "Subtotal"}</dt><dd>{formatMoney(subtotal, locale)}</dd></div><div className="mt-2 flex justify-between"><dt>{ar ? "الشحن" : "Shipping"}</dt><dd>{ar ? "مجاني" : "Free"}</dd></div><div className="mt-4 flex justify-between border-t pt-4 font-bold"><dt>{ar ? "الإجمالي" : "Total"}</dt><dd>{formatMoney(subtotal, locale)}</dd></div></dl>
          <label className="mt-5 flex gap-3 text-[11px] leading-5 text-neutral-600"><input type="checkbox" required className="mt-1 accent-[#0e7468]" />{ar ? "أؤكد صحة البيانات وأوافق على التواصل معي بخصوص الطلب." : "I confirm these details and agree to be contacted about this order."}</label>
          {error && <p role="alert" className="mt-4 border border-[#a6432b]/30 bg-[#a6432b]/8 p-3 text-xs text-[#8c3624]">{error}</p>}
          <button disabled={Boolean(busy) || (otpEnabled && !verificationToken)} className="mt-5 flex h-14 w-full items-center justify-center gap-2 bg-[#073b36] text-xs font-bold uppercase tracking-[.14em] text-white disabled:cursor-not-allowed disabled:opacity-50">{busy === "order" ? <Loader2 className="animate-spin" size={17} /> : <LockKeyhole size={16} />}{ar ? "تأكيد الطلب" : "Place secure order"}</button>
          <p className="mt-3 text-center text-[10px] leading-4 text-neutral-500">{ar ? "لن نعتمد أي دفع إلكتروني إلا بعد التحقق الآمن منه." : "Electronic payments are never accepted without secure verification."}</p>
        </aside>
      </form>
    </main>
  );
}
