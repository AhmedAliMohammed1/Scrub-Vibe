"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { BadgePercent, CheckCircle2, CreditCard, Loader2, LockKeyhole, Package, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useShop } from "@/components/store/cart-provider";
import type { Locale } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import {
  calculateShippingQuote,
  type ShippingGovernorateOption,
} from "@/features/shipping/types";
import { normalizeDiscountCode, type DiscountPreview } from "@/features/promotions/types";
import type { CustomerAddress, AddressLabel } from "@/features/addresses/types";
import { CheckoutAddressSelector } from "@/features/addresses/checkout-address-selector";
import { createCustomerAddressAction } from "@/features/addresses/actions";

type PaymentMethod = "cod" | "vodafone_cash" | "instapay" | "paymob";
type DepositMethod = "vodafone_cash" | "instapay";
type PaymentIconProps = { size?: number; className?: string };
type Props = {
  locale: Locale;
  otpEnabled: boolean;
  codDeposits: Record<string, number> | null;
  shippingLocations: ShippingGovernorateOption[];
  savedAddresses?: CustomerAddress[];
  isAuthenticated?: boolean;
  customerProfile?: { full_name: string | null; email: string | null } | null;
  payments: {
    paymob: boolean;
    vodafoneNumber: string | null;
    instapayAddress: string | null;
  };
};

const inputClass = "h-12 w-full border border-black/20 bg-white px-4 text-sm outline-none focus:border-[#0e7468]";
const paymentHelpUrl =
  "https://wa.me/201096733209?text=" +
  encodeURIComponent("Hello Scrub Vibe, I need the Vodafone Cash or InstaPay transfer details for my order.");

export function CheckoutForm({
  locale,
  payments,
  otpEnabled,
  codDeposits,
  shippingLocations,
  savedAddresses = [],
  isAuthenticated = false,
  customerProfile,
}: Props) {
  const ar = locale === "ar";
  const router = useRouter();
  const { cartItems, clearCart } = useShop();

  const defaultAddress = savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0] ?? null;

  const [selectedAddressId, setSelectedAddressId] = useState<number | "new">(
    defaultAddress ? defaultAddress.id : "new",
  );
  const [saveNewAddress, setSaveNewAddress] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState<AddressLabel>("clinic");

  const [customerName, setCustomerName] = useState(
    defaultAddress?.recipientName ?? customerProfile?.full_name ?? "",
  );
  const [email, setEmail] = useState(customerProfile?.email ?? "");
  const [phone, setPhone] = useState(defaultAddress?.phone ?? "");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("vodafone_cash");
  const [codDepositMethod, setCodDepositMethod] = useState<DepositMethod>("vodafone_cash");
  const [streetAddress, setStreetAddress] = useState(defaultAddress?.streetAddress ?? "");
  const [building, setBuilding] = useState(defaultAddress?.building ?? "");
  const [floor, setFloor] = useState(defaultAddress?.floor ?? "");
  const [apartment, setApartment] = useState(defaultAddress?.apartment ?? "");
  const [landmark, setLandmark] = useState(defaultAddress?.landmark ?? "");
  const [customerNotes, setCustomerNotes] = useState("");

  const [governorateCode, setGovernorateCode] = useState(defaultAddress?.governorateCode ?? "");
  const [cityCode, setCityCode] = useState(defaultAddress?.cityCode ?? "");
  const [customCity, setCustomCity] = useState(
    defaultAddress && defaultAddress.cityCode === "other" ? defaultAddress.city : "",
  );

  const handleSelectSavedAddress = (addr: CustomerAddress | "new") => {
    if (addr === "new") {
      setSelectedAddressId("new");
      setStreetAddress("");
      setBuilding("");
      setFloor("");
      setApartment("");
      setLandmark("");
    } else {
      setSelectedAddressId(addr.id);
      setCustomerName(addr.recipientName);
      setPhone(addr.phone);
      setGovernorateCode(addr.governorateCode);
      setCityCode(addr.cityCode);
      setCustomCity(addr.cityCode === "other" ? addr.city : "");
      setStreetAddress(addr.streetAddress);
      setBuilding(addr.building ?? "");
      setFloor(addr.floor ?? "");
      setApartment(addr.apartment ?? "");
      setLandmark(addr.landmark ?? "");
      setVerificationToken("");
      setOtpSent(false);

      const nextGov = shippingLocations.find((item) => item.code === addr.governorateCode);
      if (paymentMethod === "cod" && !nextGov?.zone.codEnabled) {
        setPaymentMethod("vodafone_cash");
      }
    }
  };

  const [busy, setBusy] = useState<"otp" | "verify" | "order" | null>(null);
  const [discountInput, setDiscountInput] = useState("");
  const [discountResult, setDiscountResult] = useState<{ preview: DiscountPreview; fingerprint: string } | null>(null);
  const [discountBusy, setDiscountBusy] = useState(false);
  const [discountError, setDiscountError] = useState("");
  const [error, setError] = useState("");
  const subtotal = cartItems.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const discountFingerprint = `${cartItems.map((line) => `${line.variantId}:${line.quantity}`).join("|")}:${paymentMethod}:${phone.replace(/[^\d+]/g, "")}`;
  const appliedDiscount = discountResult?.fingerprint === discountFingerprint
    && discountResult.preview.code === normalizeDiscountCode(discountInput)
    ? discountResult.preview
    : null;
  const pricingSubtotal = appliedDiscount?.discountedSubtotalMinor ?? subtotal;
  const selectedGovernorate =
    shippingLocations.find((item) => item.code === governorateCode) ?? null;
  const shippingQuote = calculateShippingQuote(
    pricingSubtotal,
    paymentMethod,
    selectedGovernorate?.zone ?? null,
  );
  const depositFor = (productId: string, cartDeposit: number | undefined) =>
    codDeposits === null
      ? (cartDeposit ?? 0)
      : (codDeposits[productId] ?? 0);
  const codDeposit = cartItems.reduce(
    (sum, line) =>
      sum + depositFor(line.productId, line.codDeposit) * line.quantity,
    0,
  );
  const productCodAvailable =
    cartItems.length > 0 &&
    cartItems.every(
      (line) => depositFor(line.productId, line.codDeposit) > 0,
    );
  const codAvailable =
    productCodAvailable && Boolean(selectedGovernorate?.zone.codEnabled);

  const copy: Record<string, [string, string]> = {
    invalid_phone: ["Enter a valid Egyptian mobile number.", "أدخل رقم موبايل مصري صحيح."],
    invalid_customerName: ["Enter your full name (at least 2 characters).", "أدخل الاسم بالكامل (حرفان على الأقل)."],
    invalid_email: ["Enter a valid email address or leave it empty.", "أدخل بريداً إلكترونياً صحيحاً أو اتركه فارغاً."],
    invalid_governorateCode: ["Choose an available delivery governorate.", "اختر محافظة توصيل متاحة."],
    invalid_cityCode: ["Choose your city or select Other area.", "اختر المدينة أو اختر منطقة أخرى."],
    invalid_city: ["Enter your city or district.", "أدخل المدينة أو المنطقة."],
    invalid_streetAddress: ["Enter a complete street address (at least 5 characters).", "أدخل عنوان شارع كامل (٥ أحرف على الأقل)."],
    invalid_codDepositMethod: ["Choose Vodafone Cash or InstaPay for the COD deposit.", "اختر فودافون كاش أو إنستاباي لدفع مقدم الطلب."],
    invalid_items: ["Your bag contains an unavailable item. Remove it and add it again.", "تحتوي الحقيبة على منتج غير متاح. احذفه وأضفه مرة أخرى."],
    too_many_requests: ["Too many attempts. Please wait ten minutes.", "محاولات كثيرة. انتظر عشر دقائق ثم حاول مجدداً."],
    otp_not_configured: ["Phone verification is being configured. Please contact us to order.", "جارٍ إعداد التحقق بالهاتف. تواصل معنا لإتمام الطلب."],
    otp_delivery_failed: ["The verification message could not be sent.", "تعذر إرسال رسالة التحقق."],
    invalid_code: ["That verification code is not correct.", "رمز التحقق غير صحيح."],
    verification_failed: ["Verification failed. Please request a new code.", "فشل التحقق. اطلب رمزاً جديداً."],
    verification_expired: ["Your verification expired. Please verify the phone again.", "انتهت صلاحية التحقق. تحقق من الهاتف مرة أخرى."],
    insufficient_stock: ["One of your selected items just sold out. Please review your bag.", "نفدت إحدى القطع المختارة. راجع حقيبتك."],
    item_unavailable: ["A selected colour or size is no longer available. Remove it and add a current option.", "اللون أو المقاس المحدد لم يعد متاحاً. احذفه واختر خياراً متاحاً."],
    cod_deposit_not_configured: ["Cash on delivery is not configured for one of these products. Choose another payment method.", "الدفع عند الاستلام غير مهيأ لأحد المنتجات. اختر طريقة دفع أخرى."],
    cod_deposit_method_required: ["Choose how you paid the cash-on-delivery deposit.", "اختر طريقة دفع مقدم الطلب."],
    payment_proof_required: ["Upload your transfer screenshot.", "ارفع صورة إيصال التحويل."],
    invalid_payment_proof: ["Use a JPG, PNG or WebP image up to 5 MB.", "استخدم صورة JPG أو PNG أو WebP بحد أقصى ٥ ميجابايت."],
    paymob_not_configured: ["Online payment is not available yet. Choose another method.", "الدفع الإلكتروني غير متاح حالياً. اختر طريقة أخرى."],
    shipping_area_unavailable: ["That delivery area is unavailable. Choose another area.", "منطقة التوصيل غير متاحة. اختر منطقة أخرى."],
    cod_unavailable_for_zone: ["Cash on delivery is unavailable for this delivery area.", "الدفع عند الاستلام غير متاح في منطقة التوصيل هذه."],
    discount_invalid: ["This discount code is not valid.", "كود الخصم غير صحيح."],
    discount_inactive: ["This campaign is not active right now.", "هذه الحملة غير نشطة حالياً."],
    discount_expired: ["This discount code has expired or has not started yet.", "انتهت صلاحية الكود أو لم يبدأ بعد."],
    discount_minimum_not_met: ["Your basket has not reached this code’s minimum order value.", "لم تصل السلة إلى الحد الأدنى لهذا الكود."],
    discount_usage_limit: ["This discount code has reached its usage limit.", "وصل كود الخصم إلى حد الاستخدام."],
    discount_customer_limit: ["This phone number has already used this code the maximum number of times.", "استخدم رقم الهاتف هذا الكود بالحد الأقصى المسموح."],
    discount_budget_exhausted: ["This campaign’s discount budget has been used.", "تم استهلاك ميزانية خصومات الحملة."],
    discount_not_applicable: ["This code cannot reduce this order further.", "لا يمكن لهذا الكود تخفيض الطلب أكثر."],
    discount_validation_failed: ["The code could not be checked. Please try again.", "تعذر التحقق من الكود. حاول مرة أخرى."],
    checkout_configuration_error: ["Checkout is missing its secure server connection. Please contact us while we fix it.", "إعداد الاتصال الآمن للدفع غير مكتمل. تواصل معنا لحين إصلاحه."],
    invalid_order: ["Review the highlighted checkout details.", "راجع بيانات الطلب المحددة."],
    proof_upload_failed: ["The receipt could not be uploaded. Please try again.", "تعذر رفع الإيصال. حاول مرة أخرى."],
    order_failed: ["We could not place the order. Please try again or contact us on WhatsApp.", "تعذر إنشاء الطلب. حاول مرة أخرى أو تواصل معنا عبر واتساب."],
  };
  const showError = (key: string) => setError((copy[key] ?? copy.order_failed)[ar ? 1 : 0]);
  const showResponseError = (result: { error?: string; fields?: Record<string, string[]> }) => {
    if (result.error === "invalid_order" && result.fields) {
      const firstField = Object.keys(result.fields).find((field) => result.fields?.[field]?.length);
      showError(firstField ? `invalid_${firstField}` : "invalid_order");
      return;
    }
    showError(result.error ?? "order_failed");
  };

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

  async function applyDiscount() {
    const code = normalizeDiscountCode(discountInput);
    if (!code) { setDiscountError(copy.discount_invalid[ar ? 1 : 0]); return; }
    setDiscountBusy(true); setDiscountError(""); setDiscountResult(null);
    try {
      const response = await fetch("/api/checkout/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          phone,
          paymentMethod,
          items: cartItems.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
        }),
      });
      const result = await response.json() as DiscountPreview & { error?: string };
      if (!response.ok || result.error) {
        setDiscountError((copy[result.error ?? "discount_validation_failed"] ?? copy.discount_validation_failed)[ar ? 1 : 0]);
        return;
      }
      setDiscountInput(result.code);
      setDiscountResult({ preview: result, fingerprint: discountFingerprint });
    } catch {
      setDiscountError(copy.discount_validation_failed[ar ? 1 : 0]);
    } finally {
      setDiscountBusy(false);
    }
  }

  function removeDiscount() {
    setDiscountInput(""); setDiscountResult(null); setDiscountError("");
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
      governorateCode, cityCode,
      city: cityCode === "other"
        ? customCity
        : (selectedGovernorate?.cities.find((item) => item.code === cityCode)?.nameEn ?? ""),
      streetAddress: form.get("streetAddress"),
      building: form.get("building"), floor: form.get("floor"), apartment: form.get("apartment"),
      landmark: form.get("landmark"), customerNotes: form.get("customerNotes"), paymentMethod,
      codDepositMethod: paymentMethod === "cod" ? codDepositMethod : "",
      discountCode: appliedDiscount?.code ?? "",
      items: cartItems.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
    };
    const body = new FormData();
    body.set("order", JSON.stringify(payload));
    const proof = form.get("proof");
    if (proof instanceof File && proof.size) body.set("proof", proof);
    let response: Response;
    let result: { error?: string; fields?: Record<string, string[]>; orderNumber?: string; trackingToken?: string; paymentUrl?: string | null };
    try {
      response = await fetch("/api/checkout/orders", { method: "POST", body });
      result = await response.json() as typeof result;
    } catch {
      setBusy(null);
      showError("order_failed");
      return;
    }
    setBusy(null);
    if (!response.ok || !result.orderNumber || !result.trackingToken) { showResponseError(result); return; }
    if (saveNewAddress && isAuthenticated) {
      const targetGov = shippingLocations.find((item) => item.code === governorateCode);
      const targetCity =
        cityCode === "other"
          ? customCity
          : (targetGov?.cities.find((item) => item.code === cityCode)?.nameEn ?? "");
      createCustomerAddressAction({
        label: newAddressLabel,
        recipientName: customerName.trim(),
        phone: phone.trim(),
        governorateCode,
        cityCode,
        city: targetCity,
        streetAddress: streetAddress.trim(),
        building: building.trim() || null,
        floor: floor.trim() || null,
        apartment: apartment.trim() || null,
        landmark: landmark.trim() || null,
        isDefault: (savedAddresses?.length ?? 0) === 0,
      }).catch((err) => console.warn("[checkout] Failed to auto-save address", err));
    }
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

  const paymentOptions: { id: PaymentMethod; title: string; detail: string; icon: React.ComponentType<PaymentIconProps>; disabled?: boolean }[] = [
    { id: "cod", title: ar ? "الدفع عند الاستلام" : "Cash on delivery", detail: codAvailable ? (ar ? `ادفع مقدماً ${formatMoney(codDeposit, locale)} والباقي عند الاستلام.` : `Pay a ${formatMoney(codDeposit, locale)} deposit, then the balance on delivery.`) : !selectedGovernorate ? (ar ? "اختر المحافظة أولاً للتحقق من الإتاحة." : "Choose a governorate to check availability.") : !selectedGovernorate.zone.codEnabled ? (ar ? "غير متاح في منطقة التوصيل المحددة." : "Unavailable in the selected delivery zone.") : (ar ? "غير متاح حتى يحدد المسؤول مقدم كل منتج." : "Unavailable until every product has a deposit configured."), icon: Package, disabled: !codAvailable },
    ...(payments.paymob ? [{ id: "paymob" as const, title: ar ? "بطاقة أو محفظة إلكترونية" : "Card or mobile wallet", detail: ar ? "دفع آمن عبر Paymob، بما في ذلك المحافظ المتاحة." : "Secure Paymob checkout for cards and enabled wallets.", icon: CreditCard }] : []),
    { id: "vodafone_cash", title: "Vodafone Cash", detail: payments.vodafoneNumber ? (ar ? `حوّل إلى ${payments.vodafoneNumber} ثم ارفع صورة الإيصال.` : `Transfer to ${payments.vodafoneNumber}, then upload the receipt.`) : (ar ? "اطلب بيانات التحويل عبر واتساب، ثم ارفع صورة الإيصال." : "Get the transfer details on WhatsApp, then upload the receipt."), icon: VodafoneCashIcon },
    { id: "instapay", title: "InstaPay", detail: payments.instapayAddress ? (ar ? `حوّل إلى ${payments.instapayAddress} ثم ارفع صورة الإيصال.` : `Transfer to ${payments.instapayAddress}, then upload the receipt.`) : (ar ? "اطلب بيانات التحويل عبر واتساب، ثم ارفع صورة الإيصال." : "Get the transfer details on WhatsApp, then upload the receipt."), icon: InstaPayIcon },
  ];
  const manualPayment = paymentMethod === "vodafone_cash" || paymentMethod === "instapay";
  const proofRequired = manualPayment || paymentMethod === "cod";
  const transferMethod = paymentMethod === "cod" ? codDepositMethod : paymentMethod;
  const manualDestinationConfigured = transferMethod === "vodafone_cash"
    ? Boolean(payments.vodafoneNumber)
    : transferMethod === "instapay"
      ? Boolean(payments.instapayAddress)
      : true;
  const transferDestination = transferMethod === "vodafone_cash"
    ? payments.vodafoneNumber
    : transferMethod === "instapay"
      ? payments.instapayAddress
      : null;

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 md:px-10 md:py-20">
      <p className="eyebrow text-[#0e7468]">{ar ? "دفع آمن" : "SECURE CHECKOUT"}</p>
      <h1 className="mt-3 font-serif text-5xl md:text-7xl">{ar ? "أكمل طلبك" : "Complete your order"}</h1>
      <form onSubmit={placeOrder} className="mt-10 grid gap-8 lg:grid-cols-[1fr_390px]">
        <div className="grid gap-7">
          <section className="border border-black/10 bg-white p-5 md:p-7">
            <div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full bg-[#073b36] text-xs text-white">1</span><h2 className="font-serif text-3xl">{ar ? "بيانات التواصل" : "Contact details"}</h2></div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-xs font-bold">{ar ? "الاسم بالكامل" : "Full name"}<input name="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputClass} required minLength={2} autoComplete="name" /></label>
              <label className="grid gap-2 text-xs font-bold">{ar ? "البريد الإلكتروني (اختياري)" : "Email (optional)"}<input name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} autoComplete="email" /></label>
              <div className="sm:col-span-2">
                <label className="grid gap-2 text-xs font-bold">{ar ? "رقم الموبايل المصري" : "Egyptian mobile number"}<span className="flex gap-2"><input name="phone" value={phone} onChange={(event) => { setPhone(event.target.value); setVerificationToken(""); setOtpSent(false); }} className={inputClass} inputMode="tel" placeholder="01xxxxxxxxx" required autoComplete="tel" disabled={otpEnabled && Boolean(verificationToken)} />{otpEnabled && <button type="button" onClick={requestOtp} disabled={Boolean(busy) || Boolean(verificationToken)} className="min-w-32 bg-[#0e7468] px-4 text-[10px] font-bold uppercase tracking-[.1em] text-white disabled:opacity-50">{busy === "otp" ? <Loader2 className="mx-auto animate-spin" size={16} /> : verificationToken ? (ar ? "تم التحقق" : "Verified") : (ar ? "إرسال الرمز" : "Send OTP")}</button>}</span></label>
                {otpEnabled && otpSent && !verificationToken && <div className="mt-3 flex gap-2"><input value={otp} onChange={(event) => setOtp(event.target.value)} className={inputClass} inputMode="numeric" placeholder={ar ? "رمز التحقق" : "Verification code"} maxLength={8} /><button type="button" onClick={verifyOtp} disabled={busy === "verify" || otp.length < 4} className="min-w-32 border border-[#0e7468] px-4 text-[10px] font-bold uppercase tracking-[.1em] text-[#073b36] disabled:opacity-50">{busy === "verify" ? <Loader2 className="mx-auto animate-spin" size={16} /> : (ar ? "تحقق" : "Verify")}</button></div>}
                {otpEnabled && verificationToken && <p className="mt-3 flex items-center gap-2 text-xs font-bold text-[#0e7468]"><CheckCircle2 size={15} />{ar ? "تم التحقق من رقم الهاتف." : "Phone number verified."}</p>}
                {!otpEnabled && <p className="mt-3 text-xs text-neutral-500">{ar ? "التحقق برمز الهاتف غير مطلوب حالياً." : "Phone OTP verification is not currently required."}</p>}
              </div>
            </div>
          </section>

          <section className="border border-black/10 bg-white p-5 md:p-7">
            <div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full bg-[#073b36] text-xs text-white">2</span><h2 className="font-serif text-3xl">{ar ? "عنوان التوصيل" : "Delivery address"}</h2></div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {isAuthenticated && (
                <CheckoutAddressSelector
                  savedAddresses={savedAddresses}
                  selectedAddressId={selectedAddressId}
                  onSelectAddress={handleSelectSavedAddress}
                  shippingLocations={shippingLocations}
                  locale={locale}
                  saveNewAddress={saveNewAddress}
                  onToggleSaveNewAddress={setSaveNewAddress}
                  newAddressLabel={newAddressLabel}
                  onSelectNewAddressLabel={setNewAddressLabel}
                />
              )}
              <label className="grid gap-2 text-xs font-bold">{ar ? "المحافظة" : "Governorate"}<select name="governorateCode" className={inputClass} required value={governorateCode} onChange={(event) => { const next = shippingLocations.find((item) => item.code === event.target.value); setGovernorateCode(event.target.value); setCityCode(""); setCustomCity(""); if (paymentMethod === "cod" && !next?.zone.codEnabled) setPaymentMethod("vodafone_cash"); }}><option value="" disabled>{ar ? "اختر المحافظة" : "Choose governorate"}</option>{shippingLocations.map((item) => <option key={item.code} value={item.code}>{ar ? item.nameAr : item.nameEn}</option>)}</select></label>
              <label className="grid gap-2 text-xs font-bold">{ar ? "المدينة / المنطقة" : "City / district"}<select name="cityCode" className={inputClass} required value={cityCode} disabled={!selectedGovernorate} onChange={(event) => { setCityCode(event.target.value); setCustomCity(""); }}><option value="" disabled>{ar ? "اختر المدينة" : "Choose city"}</option>{selectedGovernorate?.cities.map((city) => <option key={city.code} value={city.code}>{ar ? city.nameAr : city.nameEn}</option>)}<option value="other">{ar ? "منطقة أخرى" : "Other area"}</option></select></label>
              {cityCode === "other" && <label className="grid gap-2 text-xs font-bold sm:col-span-2">{ar ? "اكتب المدينة أو المنطقة" : "Enter city or district"}<input name="city" className={inputClass} required minLength={2} maxLength={100} value={customCity} onChange={(event) => setCustomCity(event.target.value)} /></label>}
              {selectedGovernorate && <div className="border border-[#0e7468]/20 bg-[#dce9e5]/35 p-4 text-xs leading-5 text-neutral-700 sm:col-span-2"><strong>{ar ? selectedGovernorate.zone.nameAr : selectedGovernorate.zone.nameEn}</strong><span className="ms-2">{ar ? `التوصيل المتوقع خلال ${selectedGovernorate.zone.deliveryMinDays}–${selectedGovernorate.zone.deliveryMaxDays} أيام عمل.` : `Estimated delivery in ${selectedGovernorate.zone.deliveryMinDays}–${selectedGovernorate.zone.deliveryMaxDays} business days.`}</span>{selectedGovernorate.zone.freeShippingThresholdMinor !== null && <span className="mt-1 block text-[#0e7468]">{ar ? `شحن أساسي مجاني للطلبات من ${formatMoney(selectedGovernorate.zone.freeShippingThresholdMinor, locale)}.` : `Free base shipping from ${formatMoney(selectedGovernorate.zone.freeShippingThresholdMinor, locale)}.`}</span>}</div>}
              <label className="grid gap-2 text-xs font-bold sm:col-span-2">{ar ? "اسم الشارع والعنوان" : "Street address"}<input name="streetAddress" value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} className={inputClass} required minLength={5} autoComplete="street-address" /></label>
              <label className="grid gap-2 text-xs font-bold">{ar ? "المبنى" : "Building"}<input name="building" value={building} onChange={(e) => setBuilding(e.target.value)} className={inputClass} /></label>
              <label className="grid gap-2 text-xs font-bold">{ar ? "الدور" : "Floor"}<input name="floor" value={floor} onChange={(e) => setFloor(e.target.value)} className={inputClass} /></label>
              <label className="grid gap-2 text-xs font-bold">{ar ? "العيادة / الشقة" : "Clinic / Apt"}<input name="apartment" value={apartment} onChange={(e) => setApartment(e.target.value)} className={inputClass} /></label>
              <label className="grid gap-2 text-xs font-bold">{ar ? "علامة مميزة" : "Landmark"}<input name="landmark" value={landmark} onChange={(e) => setLandmark(e.target.value)} className={inputClass} /></label>
              <label className="grid gap-2 text-xs font-bold sm:col-span-2">{ar ? "ملاحظات الطلب" : "Order notes"}<textarea name="customerNotes" value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} className="min-h-24 border border-black/20 bg-white p-4 text-sm" maxLength={1000} /></label>
            </div>
          </section>

          <section className="border border-black/10 bg-white p-5 md:p-7">
            <div className="flex items-center gap-3"><span className="grid size-8 place-items-center rounded-full bg-[#073b36] text-xs text-white">3</span><h2 className="font-serif text-3xl">{ar ? "طريقة الدفع" : "Payment method"}</h2></div>
            <div className="mt-6 grid gap-3">{paymentOptions.map(({ id, title, detail, icon: Icon, disabled }) => <label key={id} className={`flex gap-4 border p-4 ${disabled ? "cursor-not-allowed bg-neutral-50 opacity-55" : "cursor-pointer"} ${paymentMethod === id ? "border-[#0e7468] bg-[#dce9e5]/60" : "border-black/10"}`}><input type="radio" name="paymentMethod" value={id} checked={paymentMethod === id} disabled={disabled} onChange={() => setPaymentMethod(id)} className="mt-1 accent-[#0e7468]" /><Icon size={24} className="shrink-0" /><span><strong className="block text-sm">{title}</strong><span className="mt-1 block text-xs leading-5 text-neutral-600">{detail}</span></span></label>)}</div>
            {paymentMethod === "cod" && codAvailable && <div className="mt-5 border border-[#0e7468]/20 bg-[#dce9e5]/35 p-4"><strong className="text-sm">{ar ? `مقدم مطلوب: ${formatMoney(codDeposit, locale)}` : `Required deposit: ${formatMoney(codDeposit, locale)}`}</strong><p className="mt-1 text-xs text-neutral-600">{ar ? `المتبقي عند الاستلام: ${formatMoney(Math.max(0, (shippingQuote?.totalMinor ?? pricingSubtotal) - codDeposit), locale)}` : `Balance due on delivery: ${formatMoney(Math.max(0, (shippingQuote?.totalMinor ?? pricingSubtotal) - codDeposit), locale)}`}</p><p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-neutral-600">{ar ? "طريقة دفع المقدم" : "Deposit payment method"}</p><div className="mt-2 grid grid-cols-2 gap-2"><DepositMethodButton selected={codDepositMethod === "vodafone_cash"} onClick={() => setCodDepositMethod("vodafone_cash")} label="Vodafone Cash" icon={VodafoneCashIcon} /><DepositMethodButton selected={codDepositMethod === "instapay"} onClick={() => setCodDepositMethod("instapay")} label="InstaPay" icon={InstaPayIcon} /></div>{transferDestination && <p className="mt-3 text-xs font-semibold text-[#073b36]">{ar ? `حوّل المقدم إلى ${transferDestination}` : `Transfer the deposit to ${transferDestination}`}</p>}</div>}
            {proofRequired && <div className="mt-5 grid gap-4">{!manualDestinationConfigured && <p className="border border-[#0e7468]/25 bg-[#dce9e5]/40 p-4 text-xs leading-5 text-neutral-700">{ar ? "قبل التحويل، احصل على بيانات الدفع الصحيحة من فريق Scrub Vibe عبر واتساب." : "Before transferring, get the correct payment details from the Scrub Vibe team on WhatsApp."} <a href={paymentHelpUrl} target="_blank" rel="noreferrer" className="font-bold text-[#0e7468] underline">{ar ? "فتح واتساب" : "Open WhatsApp"}</a></p>}<label className="grid gap-2 text-xs font-bold">{paymentMethod === "cod" ? (ar ? "صورة إيصال المقدم" : "Deposit receipt screenshot") : (ar ? "صورة إيصال التحويل" : "Transfer screenshot")}<input name="proof" type="file" accept="image/jpeg,image/png,image/webp" required className="border border-dashed border-[#0e7468] bg-[#dce9e5]/30 p-5 text-xs" /><span className="font-normal text-neutral-500">{ar ? "JPG أو PNG أو WebP — بحد أقصى ٥ ميجابايت. لن يبدأ تجهيز الطلب حتى تتم مراجعة التحويل." : "JPG, PNG or WebP — maximum 5 MB. Fulfilment starts after the transfer is reviewed."}</span></label></div>}
          </section>
        </div>

        <aside className="h-fit border border-black/10 bg-white p-5 lg:sticky lg:top-24">
          <h2 className="font-serif text-3xl">{ar ? "ملخص الطلب" : "Order summary"}</h2>
          <div className="mt-5 max-h-80 divide-y divide-black/10 overflow-auto">{cartItems.map((line) => <div key={line.key} className="grid grid-cols-[56px_1fr_auto] gap-3 py-3"><div className="relative aspect-[3/4] overflow-hidden bg-[#ebe9e4]"><Image src={line.image.src} alt={line.image.alt[locale]} fill sizes="56px" className="object-cover" /></div><div><strong className="text-xs">{line.title[locale]}</strong><p className="mt-1 text-[10px] text-neutral-500">{line.colourName[locale]} · {line.size} · ×{line.quantity}</p></div><strong className="text-[11px]">{formatMoney(line.price * line.quantity, locale)}</strong></div>)}</div>
          <div className="mt-5 border-t border-black/10 pt-5"><label htmlFor="discount-code" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.12em]"><BadgePercent size={15} />{ar ? "كود الخصم" : "Discount code"}</label><div className="mt-2 flex gap-2"><input id="discount-code" value={discountInput} onChange={(event) => { setDiscountInput(event.target.value.toUpperCase()); setDiscountError(""); }} maxLength={32} className="h-11 min-w-0 flex-1 border border-black/15 px-3 font-mono text-sm uppercase outline-none focus:border-[#0e7468]" placeholder={ar ? "أدخل الكود" : "Enter code"} />{appliedDiscount ? <button type="button" onClick={removeDiscount} className="flex h-11 items-center gap-2 border border-black/15 px-3 text-[10px] font-bold uppercase"><X size={14} />{ar ? "إزالة" : "Remove"}</button> : <button type="button" onClick={applyDiscount} disabled={discountBusy || !discountInput.trim()} className="flex h-11 min-w-24 items-center justify-center bg-[#0e7468] px-3 text-[10px] font-bold uppercase text-white disabled:opacity-50">{discountBusy ? <Loader2 size={15} className="animate-spin" /> : (ar ? "تطبيق" : "Apply")}</button>}</div>{appliedDiscount && <p className="mt-2 text-xs font-bold text-[#0e7468]">{ar ? `تم تطبيق ${appliedDiscount.code}: وفرت ${formatMoney(appliedDiscount.discountMinor, locale)}` : `${appliedDiscount.code} applied: you save ${formatMoney(appliedDiscount.discountMinor, locale)}`}{(ar ? appliedDiscount.campaignNameAr : appliedDiscount.campaignNameEn) ? ` · ${ar ? appliedDiscount.campaignNameAr : appliedDiscount.campaignNameEn}` : ""}</p>}{discountResult && !appliedDiscount && <p className="mt-2 text-xs text-amber-700">{ar ? "تغيرت بيانات السلة أو الدفع. أعد تطبيق الكود." : "Your basket, phone or payment method changed. Apply the code again."}</p>}{discountError && <p role="alert" className="mt-2 text-xs text-[#a6432b]">{discountError}</p>}</div>
          <dl className="mt-5 border-t pt-4 text-sm"><div className="flex justify-between"><dt>{ar ? "المنتجات" : "Subtotal"}</dt><dd>{formatMoney(appliedDiscount?.subtotalMinor ?? subtotal, locale)}</dd></div>{appliedDiscount && <div className="mt-2 flex justify-between font-bold text-[#0e7468]"><dt>{ar ? `خصم ${appliedDiscount.code}` : `${appliedDiscount.code} discount`}</dt><dd>−{formatMoney(appliedDiscount.discountMinor, locale)}</dd></div>}<div className="mt-2 flex justify-between"><dt>{ar ? "الشحن الأساسي" : "Base shipping"}</dt><dd>{shippingQuote ? shippingQuote.baseMinor ? formatMoney(shippingQuote.baseMinor, locale) : (ar ? "مجاني" : "Free") : (ar ? "اختر المنطقة" : "Choose area")}</dd></div>{shippingQuote?.discountMinor ? <div className="mt-2 flex justify-between text-[#0e7468]"><dt>{ar ? "خصم الشحن" : "Shipping discount"}</dt><dd>−{formatMoney(shippingQuote.discountMinor, locale)}</dd></div> : null}{shippingQuote?.codSurchargeMinor ? <div className="mt-2 flex justify-between"><dt>{ar ? "رسوم الدفع عند الاستلام" : "COD service fee"}</dt><dd>{formatMoney(shippingQuote.codSurchargeMinor, locale)}</dd></div> : null}{paymentMethod === "cod" && codAvailable && <><div className="mt-3 flex justify-between font-bold text-[#0e7468]"><dt>{ar ? "المقدم الآن" : "Deposit now"}</dt><dd>{formatMoney(codDeposit, locale)}</dd></div><div className="mt-2 flex justify-between"><dt>{ar ? "المتبقي عند الاستلام" : "Due on delivery"}</dt><dd>{formatMoney(Math.max(0, (shippingQuote?.totalMinor ?? pricingSubtotal) - codDeposit), locale)}</dd></div></>}<div className="mt-4 flex justify-between border-t pt-4 font-bold"><dt>{ar ? "الإجمالي" : "Total"}</dt><dd>{formatMoney(shippingQuote?.totalMinor ?? pricingSubtotal, locale)}</dd></div></dl>
          <label className="mt-5 flex gap-3 text-[11px] leading-5 text-neutral-600"><input type="checkbox" required className="mt-1 accent-[#0e7468]" />{ar ? "أؤكد صحة البيانات وأوافق على التواصل معي بخصوص الطلب." : "I confirm these details and agree to be contacted about this order."}</label>
          {error && <p role="alert" className="mt-4 border border-[#a6432b]/30 bg-[#a6432b]/8 p-3 text-xs text-[#8c3624]">{error}</p>}
          <button disabled={Boolean(busy) || discountBusy || Boolean(discountInput.trim() && !appliedDiscount) || (otpEnabled && !verificationToken) || !shippingQuote || !cityCode || (paymentMethod === "cod" && !codAvailable)} className="mt-5 flex h-14 w-full items-center justify-center gap-2 bg-[#073b36] text-xs font-bold uppercase tracking-[.14em] text-white disabled:cursor-not-allowed disabled:opacity-50">{busy === "order" ? <Loader2 className="animate-spin" size={17} /> : <LockKeyhole size={16} />}{ar ? "تأكيد الطلب" : "Place secure order"}</button>
          <p className="mt-3 text-center text-[10px] leading-4 text-neutral-500">{ar ? "لن نعتمد أي دفع إلكتروني إلا بعد التحقق الآمن منه." : "Electronic payments are never accepted without secure verification."}</p>
        </aside>
      </form>
    </main>
  );
}

function DepositMethodButton({ selected, onClick, label, icon: Icon }: {
  selected: boolean;
  onClick: () => void;
  label: string;
  icon: React.ComponentType<PaymentIconProps>;
}) {
  return <button type="button" onClick={onClick} aria-pressed={selected} className={`flex items-center gap-2 border px-3 py-3 text-start text-xs font-bold ${selected ? "border-[#0e7468] bg-white text-[#073b36]" : "border-black/10 bg-white/60 text-neutral-600"}`}><Icon size={22} /><span>{label}</span></button>;
}

function VodafoneCashIcon({ size = 24, className }: PaymentIconProps) {
  return <svg aria-hidden="true" viewBox="0 0 32 32" width={size} height={size} className={className}><circle cx="16" cy="16" r="15" fill="#e60000"/><path d="M7.5 13.1c5.9-4.2 13.5-4.5 17-1.2-5.1-1-9.9.4-12.6 3.2 2.5-.6 5.2-.3 7 1-3.9.1-7.3 2-8.8 5.1-1.7-2.1-2.6-5-2.6-8.1Z" fill="#fff"/><circle cx="21.7" cy="9" r="2" fill="#fff"/></svg>;
}

function InstaPayIcon({ size = 24, className }: PaymentIconProps) {
  return <svg aria-hidden="true" viewBox="0 0 32 32" width={size} height={size} className={className}><defs><linearGradient id="instapay-mark" x1="3" y1="29" x2="29" y2="3"><stop stopColor="#5b2a86"/><stop offset="1" stopColor="#e52b78"/></linearGradient></defs><rect x="1" y="1" width="30" height="30" rx="8" fill="url(#instapay-mark)"/><path d="M8 10h5v12H8zm7 0h4.8c3.2 0 5.2 1.7 5.2 4.5S22.9 19 19.8 19H19v3h-4zm4 3v3h.7c.9 0 1.4-.5 1.4-1.5S20.6 13 19.7 13z" fill="#fff"/></svg>;
}
