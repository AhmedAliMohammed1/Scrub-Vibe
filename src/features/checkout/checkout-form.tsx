"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import {
  BadgePercent,
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  Package,
  SlidersHorizontal,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useShop } from "@/components/store/cart-provider";
import type { Locale } from "@/lib/i18n";
import { formatMoney } from "@/lib/money";
import {
  calculateShippingQuote,
  type ShippingGovernorateOption,
} from "@/features/shipping/types";
import {
  normalizeDiscountCode,
  type DiscountPreview,
} from "@/features/promotions/types";
import type { CustomerAddress, AddressLabel } from "@/features/addresses/types";
import { CheckoutAddressSelector } from "@/features/addresses/checkout-address-selector";
import { createCustomerAddressAction } from "@/features/addresses/actions";
import {
  checkEmailExistsAction,
  claimOrderWithPasswordAction,
  createAccountAndClaimOrderAction,
} from "@/features/orders/claim-actions";
import { createClient } from "@/lib/supabase/client";
import { trackStoreEvent } from "@/lib/analytics";

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
  initialDiscountCode?: string | null;
  payments: {
    paymob: boolean;
    vodafoneNumber: string | null;
    instapayAddress: string | null;
  };
};

const inputClass =
  "h-12 w-full rounded-xs border border-[var(--border-subtle)] bg-white px-4 text-sm text-[var(--text-strong)] outline-none transition focus:border-[#0e7468] focus:ring-2 focus:ring-[#0e7468]/20";
const paymentHelpUrl =
  "https://wa.me/201096733209?text=" +
  encodeURIComponent(
    "Hello Scrub Vibe, I need the Vodafone Cash or InstaPay transfer details for my order.",
  );

function synthesizePlainAddress({
  streetAddress,
  building,
  floor,
  apartment,
  landmark,
  isAr,
}: {
  streetAddress: string;
  building?: string | null;
  floor?: string | null;
  apartment?: string | null;
  landmark?: string | null;
  isAr: boolean;
}): string {
  const parts: string[] = [];
  const street = streetAddress?.trim();
  if (street) parts.push(street);

  const bldg = building?.trim();
  if (bldg) parts.push(isAr ? `عمارة/مبنى: ${bldg}` : `Bldg: ${bldg}`);

  const flr = floor?.trim();
  if (flr) parts.push(isAr ? `الدور: ${flr}` : `Floor: ${flr}`);

  const apt = apartment?.trim();
  if (apt) parts.push(isAr ? `عيادة/شقة: ${apt}` : `Apt/Clinic: ${apt}`);

  const mark = landmark?.trim();
  if (mark) parts.push(isAr ? `علامة مميزة: ${mark}` : `Landmark: ${mark}`);

  return parts.join(isAr ? "، " : ", ");
}

export function CheckoutForm({
  locale,
  payments,
  otpEnabled,
  codDeposits,
  shippingLocations,
  savedAddresses = [],
  isAuthenticated = false,
  customerProfile,
  initialDiscountCode,
}: Props) {
  const ar = locale === "ar";
  const router = useRouter();
  const { cartItems, clearCart } = useShop();

  const defaultAddress =
    savedAddresses.find((a) => a.isDefault) ?? savedAddresses[0] ?? null;

  const [selectedAddressId, setSelectedAddressId] = useState<number | "new">(
    defaultAddress ? defaultAddress.id : "new",
  );
  const [saveNewAddress, setSaveNewAddress] = useState(false);
  const [newAddressLabel, setNewAddressLabel] =
    useState<AddressLabel>("clinic");

  const [customerName, setCustomerName] = useState(
    defaultAddress?.recipientName ?? customerProfile?.full_name ?? "",
  );
  const [email, setEmail] = useState(customerProfile?.email ?? "");
  const [phone, setPhone] = useState(defaultAddress?.phone ?? "");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("vodafone_cash");
  const [codDepositMethod, setCodDepositMethod] =
    useState<DepositMethod>("vodafone_cash");
  const hasGranularInitial = Boolean(
    defaultAddress &&
      (defaultAddress.building ||
        defaultAddress.floor ||
        defaultAddress.apartment ||
        defaultAddress.landmark),
  );
  const [addressMode, setAddressMode] = useState<"quick" | "detailed">(
    hasGranularInitial ? "detailed" : "quick",
  );
  const [streetAddress, setStreetAddress] = useState(
    defaultAddress?.streetAddress ?? "",
  );
  const [building, setBuilding] = useState(defaultAddress?.building ?? "");
  const [floor, setFloor] = useState(defaultAddress?.floor ?? "");
  const [apartment, setApartment] = useState(defaultAddress?.apartment ?? "");
  const [landmark, setLandmark] = useState(defaultAddress?.landmark ?? "");
  const [plainAddress, setPlainAddress] = useState(
    defaultAddress
      ? hasGranularInitial
        ? synthesizePlainAddress({
            streetAddress: defaultAddress.streetAddress,
            building: defaultAddress.building,
            floor: defaultAddress.floor,
            apartment: defaultAddress.apartment,
            landmark: defaultAddress.landmark,
            isAr: ar,
          })
        : defaultAddress.streetAddress
      : "",
  );
  const [customerNotes, setCustomerNotes] = useState("");

  const [wantAccount, setWantAccount] = useState(false);
  const [accountPassword, setAccountPassword] = useState("");
  const [showAccountPassword, setShowAccountPassword] = useState(false);
  const [accountEmailExists, setAccountEmailExists] = useState<boolean | null>(
    null,
  );
  const [checkingAccountEmail, setCheckingAccountEmail] = useState(false);

  const isEligibleAccountCheck = Boolean(
    wantAccount && email && email.includes("@"),
  );
  const effectiveAccountEmailExists = isEligibleAccountCheck
    ? accountEmailExists
    : null;

  useEffect(() => {
    if (!isEligibleAccountCheck) return;
    let active = true;
    const timer = setTimeout(() => {
      setCheckingAccountEmail(true);
      void checkEmailExistsAction(email).then((res) => {
        if (!active) return;
        setAccountEmailExists(res.exists);
        setCheckingAccountEmail(false);
      });
    }, 150);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [isEligibleAccountCheck, email]);

  const handleSwitchAddressMode = (nextMode: "quick" | "detailed") => {
    if (nextMode === addressMode) return;
    if (nextMode === "quick") {
      const synthesized = synthesizePlainAddress({
        streetAddress,
        building,
        floor,
        apartment,
        landmark,
        isAr: ar,
      });
      if (synthesized) {
        setPlainAddress(synthesized);
      }
    } else {
      if (!streetAddress.trim() && plainAddress.trim()) {
        setStreetAddress(plainAddress.trim());
      }
    }
    setAddressMode(nextMode);
  };

  const [governorateCode, setGovernorateCode] = useState(
    defaultAddress?.governorateCode ?? "",
  );
  const [cityCode, setCityCode] = useState(defaultAddress?.cityCode ?? "");
  const [customCity, setCustomCity] = useState(
    defaultAddress && defaultAddress.cityCode === "other"
      ? defaultAddress.city
      : "",
  );

  const handleSelectSavedAddress = (addr: CustomerAddress | "new") => {
    if (addr === "new") {
      setSelectedAddressId("new");
      setStreetAddress("");
      setBuilding("");
      setFloor("");
      setApartment("");
      setLandmark("");
      setPlainAddress("");
      setAddressMode("quick");
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
      const hasGranular = Boolean(
        addr.building || addr.floor || addr.apartment || addr.landmark,
      );
      const combined = hasGranular
        ? synthesizePlainAddress({
            streetAddress: addr.streetAddress,
            building: addr.building,
            floor: addr.floor,
            apartment: addr.apartment,
            landmark: addr.landmark,
            isAr: ar,
          })
        : addr.streetAddress;
      setPlainAddress(combined);
      setAddressMode(hasGranular ? "detailed" : "quick");
      setVerificationToken("");
      setOtpSent(false);

      const nextGov = shippingLocations.find(
        (item) => item.code === addr.governorateCode,
      );
      if (paymentMethod === "cod" && !nextGov?.zone.codEnabled) {
        setPaymentMethod("vodafone_cash");
      }
    }
  };

  const [busy, setBusy] = useState<"otp" | "verify" | "order" | null>(null);
  const [discountInput, setDiscountInput] = useState(initialDiscountCode ?? "");
  const [discountResult, setDiscountResult] = useState<{
    preview: DiscountPreview;
    fingerprint: string;
  } | null>(null);
  const [discountBusy, setDiscountBusy] = useState(false);
  const [discountError, setDiscountError] = useState("");
  const [error, setError] = useState("");

  const hasAutoAppliedDiscountRef = useRef(false);

  useEffect(() => {
    if (
      !initialDiscountCode ||
      hasAutoAppliedDiscountRef.current ||
      !cartItems.length
    ) {
      return;
    }
    const code = normalizeDiscountCode(initialDiscountCode);
    if (!code) return;

    hasAutoAppliedDiscountRef.current = true;
    const controller = new AbortController();

    async function autoApply() {
      try {
        const response = await fetch("/api/checkout/discounts/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            code,
            phone,
            paymentMethod,
            items: cartItems.map((line) => ({
              variantId: line.variantId,
              quantity: line.quantity,
            })),
          }),
        });
        const result = (await response.json()) as DiscountPreview & {
          error?: string;
        };
        if (result && !result.error && result.code) {
          setDiscountInput(result.code);
          setDiscountResult({
            preview: result,
            fingerprint: `${cartItems.map((line) => `${line.variantId}:${line.quantity}`).join("|")}:${paymentMethod}:${phone.replace(/[^\d+]/g, "")}`,
          });
        }
      } catch {
        // Request aborted or failed
      }
    }

    void autoApply();

    return () => {
      controller.abort();
    };
  }, [initialDiscountCode, cartItems, paymentMethod, phone]);
  const subtotal = cartItems.reduce(
    (sum, line) => sum + line.price * line.quantity,
    0,
  );
  const discountFingerprint = `${cartItems.map((line) => `${line.variantId}:${line.quantity}`).join("|")}:${paymentMethod}:${phone.replace(/[^\d+]/g, "")}`;
  const appliedDiscount =
    discountResult?.fingerprint === discountFingerprint &&
    discountResult.preview.code === normalizeDiscountCode(discountInput)
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
    codDeposits === null ? (cartDeposit ?? 0) : (codDeposits[productId] ?? 0);
  const codDeposit = cartItems.reduce(
    (sum, line) =>
      sum + depositFor(line.productId, line.codDeposit) * line.quantity,
    0,
  );
  const productCodAvailable =
    cartItems.length > 0 &&
    cartItems.every((line) => depositFor(line.productId, line.codDeposit) > 0);
  const codAvailable =
    productCodAvailable && Boolean(selectedGovernorate?.zone.codEnabled);

  const copy: Record<string, [string, string]> = {
    invalid_phone: [
      "Enter a valid Egyptian mobile number.",
      "أدخل رقم موبايل مصري صحيح.",
    ],
    invalid_customerName: [
      "Enter your full name (at least 2 characters).",
      "أدخل الاسم بالكامل (حرفان على الأقل).",
    ],
    invalid_email: [
      "Enter a valid email address or leave it empty.",
      "أدخل بريداً إلكترونياً صحيحاً أو اتركه فارغاً.",
    ],
    invalid_governorateCode: [
      "Choose an available delivery governorate.",
      "اختر محافظة توصيل متاحة.",
    ],
    invalid_cityCode: [
      "Choose your city or select Other area.",
      "اختر المدينة أو اختر منطقة أخرى.",
    ],
    invalid_city: ["Enter your city or district.", "أدخل المدينة أو المنطقة."],
    invalid_streetAddress: [
      "Enter a complete street address (at least 5 characters).",
      "أدخل عنوان شارع كامل (٥ أحرف على الأقل).",
    ],
    invalid_codDepositMethod: [
      "Choose Vodafone Cash or InstaPay for the COD deposit.",
      "اختر فودافون كاش أو إنستاباي لدفع مقدم الطلب.",
    ],
    invalid_items: [
      "Your bag contains an unavailable item. Remove it and add it again.",
      "تحتوي الحقيبة على منتج غير متاح. احذفه وأضفه مرة أخرى.",
    ],
    too_many_requests: [
      "Too many attempts. Please wait ten minutes.",
      "محاولات كثيرة. انتظر عشر دقائق ثم حاول مجدداً.",
    ],
    otp_not_configured: [
      "Phone verification is being configured. Please contact us to order.",
      "جارٍ إعداد التحقق بالهاتف. تواصل معنا لإتمام الطلب.",
    ],
    otp_delivery_failed: [
      "The verification message could not be sent.",
      "تعذر إرسال رسالة التحقق.",
    ],
    invalid_code: [
      "That verification code is not correct.",
      "رمز التحقق غير صحيح.",
    ],
    verification_failed: [
      "Verification failed. Please request a new code.",
      "فشل التحقق. اطلب رمزاً جديداً.",
    ],
    verification_expired: [
      "Your verification expired. Please verify the phone again.",
      "انتهت صلاحية التحقق. تحقق من الهاتف مرة أخرى.",
    ],
    insufficient_stock: [
      "One of your selected items just sold out. Please review your bag.",
      "نفدت إحدى القطع المختارة. راجع حقيبتك.",
    ],
    item_unavailable: [
      "A selected colour or size is no longer available. Remove it and add a current option.",
      "اللون أو المقاس المحدد لم يعد متاحاً. احذفه واختر خياراً متاحاً.",
    ],
    cod_deposit_not_configured: [
      "Cash on delivery is not configured for one of these products. Choose another payment method.",
      "الدفع عند الاستلام غير مهيأ لأحد المنتجات. اختر طريقة دفع أخرى.",
    ],
    cod_deposit_method_required: [
      "Choose how you paid the cash-on-delivery deposit.",
      "اختر طريقة دفع مقدم الطلب.",
    ],
    payment_proof_required: [
      "Upload your transfer screenshot.",
      "ارفع صورة إيصال التحويل.",
    ],
    invalid_payment_proof: [
      "Use a JPG, PNG or WebP image up to 5 MB.",
      "استخدم صورة JPG أو PNG أو WebP بحد أقصى ٥ ميجابايت.",
    ],
    paymob_not_configured: [
      "Online payment is not available yet. Choose another method.",
      "الدفع الإلكتروني غير متاح حالياً. اختر طريقة أخرى.",
    ],
    shipping_area_unavailable: [
      "That delivery area is unavailable. Choose another area.",
      "منطقة التوصيل غير متاحة. اختر منطقة أخرى.",
    ],
    cod_unavailable_for_zone: [
      "Cash on delivery is unavailable for this delivery area.",
      "الدفع عند الاستلام غير متاح في منطقة التوصيل هذه.",
    ],
    discount_invalid: [
      "This discount code is not valid.",
      "كود الخصم غير صحيح.",
    ],
    discount_inactive: [
      "This campaign is not active right now.",
      "هذه الحملة غير نشطة حالياً.",
    ],
    discount_expired: [
      "This discount code has expired or has not started yet.",
      "انتهت صلاحية الكود أو لم يبدأ بعد.",
    ],
    discount_minimum_not_met: [
      "Your basket has not reached this code’s minimum order value.",
      "لم تصل السلة إلى الحد الأدنى لهذا الكود.",
    ],
    discount_usage_limit: [
      "This discount code has reached its usage limit.",
      "وصل كود الخصم إلى حد الاستخدام.",
    ],
    discount_customer_limit: [
      "This phone number has already used this code the maximum number of times.",
      "استخدم رقم الهاتف هذا الكود بالحد الأقصى المسموح.",
    ],
    discount_budget_exhausted: [
      "This campaign’s discount budget has been used.",
      "تم استهلاك ميزانية خصومات الحملة.",
    ],
    discount_not_applicable: [
      "This code cannot reduce this order further.",
      "لا يمكن لهذا الكود تخفيض الطلب أكثر.",
    ],
    discount_validation_failed: [
      "The code could not be checked. Please try again.",
      "تعذر التحقق من الكود. حاول مرة أخرى.",
    ],
    checkout_configuration_error: [
      "Checkout is missing its secure server connection. Please contact us while we fix it.",
      "إعداد الاتصال الآمن للدفع غير مكتمل. تواصل معنا لحين إصلاحه.",
    ],
    invalid_order: [
      "Review the highlighted checkout details.",
      "راجع بيانات الطلب المحددة.",
    ],
    proof_upload_failed: [
      "The receipt could not be uploaded. Please try again.",
      "تعذر رفع الإيصال. حاول مرة أخرى.",
    ],
    order_failed: [
      "We could not place the order. Please try again or contact us on WhatsApp.",
      "تعذر إنشاء الطلب. حاول مرة أخرى أو تواصل معنا عبر واتساب.",
    ],
  };
  const showError = (key: string) =>
    setError((copy[key] ?? copy.order_failed)[ar ? 1 : 0]);
  const showResponseError = (result: {
    error?: string;
    fields?: Record<string, string[]>;
  }) => {
    if (result.error === "invalid_order" && result.fields) {
      const firstField = Object.keys(result.fields).find(
        (field) => result.fields?.[field]?.length,
      );
      showError(firstField ? `invalid_${firstField}` : "invalid_order");
      return;
    }
    showError(result.error ?? "order_failed");
  };

  async function requestOtp() {
    setBusy("otp");
    setError("");
    setVerificationToken("");
    const response = await fetch("/api/checkout/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const result = (await response.json()) as { error?: string };
    setBusy(null);
    if (!response.ok) {
      showError(result.error ?? "otp_delivery_failed");
      return;
    }
    setOtpSent(true);
  }

  async function verifyOtp() {
    setBusy("verify");
    setError("");
    const response = await fetch("/api/checkout/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code: otp }),
    });
    const result = (await response.json()) as {
      error?: string;
      token?: string;
    };
    setBusy(null);
    if (!response.ok || !result.token) {
      showError(result.error ?? "verification_failed");
      return;
    }
    setVerificationToken(result.token);
    setOtp("");
  }

  async function applyDiscount() {
    const code = normalizeDiscountCode(discountInput);
    if (!code) {
      setDiscountError(copy.discount_invalid[ar ? 1 : 0]);
      return;
    }
    setDiscountBusy(true);
    setDiscountError("");
    setDiscountResult(null);
    try {
      const response = await fetch("/api/checkout/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          phone,
          paymentMethod,
          items: cartItems.map((line) => ({
            variantId: line.variantId,
            quantity: line.quantity,
          })),
        }),
      });
      const result = (await response.json()) as DiscountPreview & {
        error?: string;
      };
      if (!response.ok || result.error) {
        setDiscountError(
          (copy[result.error ?? "discount_validation_failed"] ??
            copy.discount_validation_failed)[ar ? 1 : 0],
        );
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
    setDiscountInput("");
    setDiscountResult(null);
    setDiscountError("");
  }

  async function placeOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (otpEnabled && !verificationToken) {
      setError(
        ar
          ? "تحقق من رقم الهاتف أولاً."
          : "Verify your phone before placing the order.",
      );
      return;
    }
    if (cartItems.some((line) => !line.variantId)) {
      setError(
        ar
          ? "حدّث حقيبتك بإزالة المنتجات القديمة وإضافتها مرة أخرى."
          : "Refresh your bag by removing and re-adding older items.",
      );
      return;
    }
    if (wantAccount && !isAuthenticated) {
      const trimmedEmail = email.trim();
      if (!trimmedEmail || !trimmedEmail.includes("@")) {
        setError(
          ar
            ? "يرجى كتابة بريد إلكتروني صالح لإنشاء حساب أو ربط طلبك."
            : "Please enter a valid email address to register or link your account.",
        );
        return;
      }
      if (
        !accountPassword ||
        accountPassword.length < (effectiveAccountEmailExists ? 6 : 8)
      ) {
        setError(
          effectiveAccountEmailExists
            ? ar
              ? "يرجى إدخال كلمة المرور الخاصة بحسابك المسجل."
              : "Please enter your password for your existing account."
            : ar
              ? "يجب أن تكون كلمة المرور ٨ أحرف على الأقل."
              : "Password must be at least 8 characters.",
        );
        return;
      }

      if (effectiveAccountEmailExists) {
        setBusy("order");
        try {
          const supabase = createClient();
          const { error: signInErr } = await supabase.auth.signInWithPassword({
            email: trimmedEmail.toLowerCase(),
            password: accountPassword,
          });
          if (signInErr) {
            setBusy(null);
            setError(
              ar
                ? "كلمة المرور غير صحيحة. يرجى التحقق وإعادة المحاولة."
                : "Incorrect password. Please verify your password and try again.",
            );
            return;
          }
        } catch {
          // Fall through if network error
        }
      }
    }
    setBusy("order");
    setError("");
    const form = new FormData(event.currentTarget);
    const effectiveStreet =
      addressMode === "quick"
        ? plainAddress.trim()
        : ((form.get("streetAddress") as string) || streetAddress).trim();
    const effectiveBuilding =
      addressMode === "quick"
        ? ""
        : ((form.get("building") as string) || building).trim();
    const effectiveFloor =
      addressMode === "quick"
        ? ""
        : ((form.get("floor") as string) || floor).trim();
    const effectiveApartment =
      addressMode === "quick"
        ? ""
        : ((form.get("apartment") as string) || apartment).trim();
    const effectiveLandmark =
      addressMode === "quick"
        ? ""
        : ((form.get("landmark") as string) || landmark).trim();

    const payload = {
      verificationToken,
      locale,
      phone,
      customerName: form.get("customerName"),
      email: form.get("email"),
      governorateCode,
      cityCode,
      city:
        cityCode === "other"
          ? customCity
          : (selectedGovernorate?.cities.find((item) => item.code === cityCode)
              ?.nameEn ?? ""),
      streetAddress: effectiveStreet,
      building: effectiveBuilding,
      floor: effectiveFloor,
      apartment: effectiveApartment,
      landmark: effectiveLandmark,
      customerNotes: form.get("customerNotes"),
      paymentMethod,
      codDepositMethod: paymentMethod === "cod" ? codDepositMethod : "",
      discountCode: appliedDiscount?.code ?? "",
      items: cartItems.map((line) => ({
        variantId: line.variantId,
        quantity: line.quantity,
      })),
    };
    const body = new FormData();
    body.set("order", JSON.stringify(payload));
    const proof = form.get("proof");
    if (proof instanceof File && proof.size) body.set("proof", proof);
    let response: Response;
    let result: {
      error?: string;
      fields?: Record<string, string[]>;
      orderNumber?: string;
      trackingToken?: string;
      paymentUrl?: string | null;
      totalMinor?: number;
    };
    try {
      response = await fetch("/api/checkout/orders", { method: "POST", body });
      result = (await response.json()) as typeof result;
    } catch {
      setBusy(null);
      showError("order_failed");
      return;
    }
    setBusy(null);
    if (!response.ok || !result.orderNumber || !result.trackingToken) {
      showResponseError(result);
      return;
    }
    if (
      wantAccount &&
      !isAuthenticated &&
      email &&
      accountPassword &&
      result.orderNumber &&
      result.trackingToken
    ) {
      try {
        if (effectiveAccountEmailExists) {
          await claimOrderWithPasswordAction({
            orderNumber: result.orderNumber,
            trackingToken: result.trackingToken,
            email: email.trim(),
            password: accountPassword,
            locale,
          });
        } else {
          await createAccountAndClaimOrderAction({
            orderNumber: result.orderNumber,
            trackingToken: result.trackingToken,
            email: email.trim(),
            password: accountPassword,
            fullName: customerName.trim(),
            phone: phone.trim(),
            locale,
          });
        }
      } catch (claimErr) {
        console.warn(
          "[checkout] Account registration/linking failed non-fatally",
          claimErr,
        );
      }
    }
    if (saveNewAddress && isAuthenticated) {
      const targetGov = shippingLocations.find(
        (item) => item.code === governorateCode,
      );
      const targetCity =
        cityCode === "other"
          ? customCity
          : (targetGov?.cities.find((item) => item.code === cityCode)?.nameEn ??
            "");
      createCustomerAddressAction({
        label: newAddressLabel,
        recipientName: customerName.trim(),
        phone: phone.trim(),
        governorateCode,
        cityCode,
        city: targetCity,
        streetAddress: effectiveStreet,
        building: effectiveBuilding || null,
        floor: effectiveFloor || null,
        apartment: effectiveApartment || null,
        landmark: effectiveLandmark || null,
        isDefault: (savedAddresses?.length ?? 0) === 0,
      }).catch((err) =>
        console.warn("[checkout] Failed to auto-save address", err),
      );
    }
    try {
      const saved = JSON.parse(
        localStorage.getItem("scrub-vibe-order-tokens") ?? "{}",
      ) as Record<string, string>;
      saved[result.orderNumber] = result.trackingToken;
      localStorage.setItem("scrub-vibe-order-tokens", JSON.stringify(saved));
    } catch {
      /* The authenticated account can still open its order. */
    }
    trackStoreEvent("purchase", {
      metadata: {
        orderNumber: result.orderNumber,
        value: result.totalMinor ?? shippingQuote?.totalMinor ?? subtotal,
        productIds: cartItems.map((item) => item.variantId),
      },
    });
    clearCart();
    if (result.paymentUrl) window.location.assign(result.paymentUrl);
    else router.push(`/${locale}/track/${result.orderNumber}` as Route);
  }

  if (!cartItems.length)
    return (
      <main className="mx-auto min-h-[65vh] max-w-2xl px-5 py-24 text-center">
        <Package className="mx-auto" size={36} strokeWidth={1.2} />
        <h1 className="mt-5 font-serif text-5xl">
          {ar ? "حقيبتك فارغة" : "Your bag is empty"}
        </h1>
        <Link
          href={`/${locale}/shop`}
          className="mt-8 inline-block bg-[#073b36] px-7 py-4 text-xs font-bold uppercase tracking-[.14em] text-white"
        >
          {ar ? "تسوق الآن" : "Shop now"}
        </Link>
      </main>
    );

  const paymentOptions: {
    id: PaymentMethod;
    title: string;
    detail: string;
    icon: React.ComponentType<PaymentIconProps>;
    disabled?: boolean;
  }[] = [
    {
      id: "cod",
      title: ar ? "الدفع عند الاستلام" : "Cash on delivery",
      detail: codAvailable
        ? ar
          ? `ادفع مقدماً ${formatMoney(codDeposit, locale)} والباقي عند الاستلام.`
          : `Pay a ${formatMoney(codDeposit, locale)} deposit, then the balance on delivery.`
        : !selectedGovernorate
          ? ar
            ? "اختر المحافظة أولاً للتحقق من الإتاحة."
            : "Choose a governorate to check availability."
          : !selectedGovernorate.zone.codEnabled
            ? ar
              ? "غير متاح في منطقة التوصيل المحددة."
              : "Unavailable in the selected delivery zone."
            : ar
              ? "غير متاح حتى يحدد المسؤول مقدم كل منتج."
              : "Unavailable until every product has a deposit configured.",
      icon: Package,
      disabled: !codAvailable,
    },
    ...(payments.paymob
      ? [
          {
            id: "paymob" as const,
            title: ar ? "بطاقة أو محفظة إلكترونية" : "Card or mobile wallet",
            detail: ar
              ? "دفع آمن عبر Paymob، بما في ذلك المحافظ المتاحة."
              : "Secure Paymob checkout for cards and enabled wallets.",
            icon: CreditCard,
          },
        ]
      : []),
    {
      id: "vodafone_cash",
      title: "Vodafone Cash",
      detail: payments.vodafoneNumber
        ? ar
          ? `حوّل إلى ${payments.vodafoneNumber} ثم ارفع صورة الإيصال.`
          : `Transfer to ${payments.vodafoneNumber}, then upload the receipt.`
        : ar
          ? "اطلب بيانات التحويل عبر واتساب، ثم ارفع صورة الإيصال."
          : "Get the transfer details on WhatsApp, then upload the receipt.",
      icon: VodafoneCashIcon,
    },
    {
      id: "instapay",
      title: "InstaPay",
      detail: payments.instapayAddress
        ? ar
          ? `حوّل إلى ${payments.instapayAddress} ثم ارفع صورة الإيصال.`
          : `Transfer to ${payments.instapayAddress}, then upload the receipt.`
        : ar
          ? "اطلب بيانات التحويل عبر واتساب، ثم ارفع صورة الإيصال."
          : "Get the transfer details on WhatsApp, then upload the receipt.",
      icon: InstaPayIcon,
    },
  ];
  const manualPayment =
    paymentMethod === "vodafone_cash" || paymentMethod === "instapay";
  const proofRequired = manualPayment || paymentMethod === "cod";
  const transferMethod =
    paymentMethod === "cod" ? codDepositMethod : paymentMethod;
  const manualDestinationConfigured =
    transferMethod === "vodafone_cash"
      ? Boolean(payments.vodafoneNumber)
      : transferMethod === "instapay"
        ? Boolean(payments.instapayAddress)
        : true;
  const transferDestination =
    transferMethod === "vodafone_cash"
      ? payments.vodafoneNumber
      : transferMethod === "instapay"
        ? payments.instapayAddress
        : null;

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-6 md:px-10 md:py-16">
      <p className="eyebrow text-[#0e7468]">
        {ar ? "دفع آمن ومحمي" : "SECURE CHECKOUT"}
      </p>
      <h1 className="mt-3 font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[var(--text-strong)]">
        {ar ? "إتمام الطلب" : "Complete your order"}
      </h1>
      <form
        onSubmit={placeOrder}
        className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]"
      >
        <div className="grid gap-8">
          {/* Step 1: Contact Details */}
          <section className="rounded-xs border border-[var(--border-subtle)] bg-white p-6 shadow-xs sm:p-8">
            <div className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-full bg-[#073b36] text-xs font-bold text-white">
                1
              </span>
              <h2 className="font-serif text-2xl text-[var(--text-strong)]">
                {ar ? "بيانات التواصل" : "Contact details"}
              </h2>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-xs font-bold text-[var(--text-muted)]">
                {ar ? "الاسم بالكامل" : "Full name"}
                <input
                  name="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className={inputClass}
                  required
                  minLength={2}
                  autoComplete="name"
                />
              </label>
              <label className="grid gap-2 text-xs font-bold text-[var(--text-muted)]">
                {ar ? "البريد الإلكتروني (اختياري)" : "Email (optional)"}
                <input
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  autoComplete="email"
                />
              </label>
              <div className="sm:col-span-2">
                <label className="grid gap-2 text-xs font-bold text-[var(--text-muted)]">
                  {ar ? "رقم الموبايل المصري" : "Egyptian mobile number"}
                  <span className="flex gap-2">
                    <input
                      name="phone"
                      value={phone}
                      onChange={(event) => {
                        setPhone(event.target.value);
                        setVerificationToken("");
                        setOtpSent(false);
                      }}
                      className={inputClass}
                      inputMode="tel"
                      placeholder="01xxxxxxxxx"
                      required
                      autoComplete="tel"
                      disabled={otpEnabled && Boolean(verificationToken)}
                    />
                    {otpEnabled && (
                      <button
                        type="button"
                        onClick={requestOtp}
                        disabled={Boolean(busy) || Boolean(verificationToken)}
                        className="min-w-32 rounded-xs bg-[#0e7468] px-4 text-[10px] font-bold uppercase tracking-[.1em] text-white disabled:opacity-50"
                      >
                        {busy === "otp" ? (
                          <Loader2 className="mx-auto animate-spin" size={16} />
                        ) : verificationToken ? (
                          ar ? (
                            "تم التحقق"
                          ) : (
                            "Verified"
                          )
                        ) : ar ? (
                          "إرسال الرمز"
                        ) : (
                          "Send OTP"
                        )}
                      </button>
                    )}
                  </span>
                </label>
                {otpEnabled && otpSent && !verificationToken && (
                  <div className="mt-3 flex gap-2">
                    <input
                      value={otp}
                      onChange={(event) => setOtp(event.target.value)}
                      className={inputClass}
                      inputMode="numeric"
                      placeholder={ar ? "رمز التحقق" : "Verification code"}
                      maxLength={8}
                    />
                    <button
                      type="button"
                      onClick={verifyOtp}
                      disabled={busy === "verify" || otp.length < 4}
                      className="min-w-32 rounded-xs border border-[#0e7468] px-4 text-[10px] font-bold uppercase tracking-[.1em] text-[#073b36] disabled:opacity-50"
                    >
                      {busy === "verify" ? (
                        <Loader2 className="mx-auto animate-spin" size={16} />
                      ) : ar ? (
                        "تحقق"
                      ) : (
                        "Verify"
                      )}
                    </button>
                  </div>
                )}
                {otpEnabled && verificationToken && (
                  <p className="mt-3 flex items-center gap-2 text-xs font-bold text-[#0e7468]">
                    <CheckCircle2 size={15} />
                    {ar ? "تم التحقق من رقم الهاتف." : "Phone number verified."}
                  </p>
                )}
                {!otpEnabled && (
                  <p className="mt-3 text-xs text-[var(--text-muted)]">
                    {ar
                      ? "التحقق برمز الهاتف غير مطلوب حالياً."
                      : "Phone OTP verification is not currently required."}
                  </p>
                )}
              </div>

              {!isAuthenticated && (
                <div className="sm:col-span-2 rounded-xs border border-[#0e7468]/20 bg-[#f4f8f6] p-4 transition-all">
                  <label className="flex cursor-pointer items-start gap-3 select-none">
                    <input
                      type="checkbox"
                      checked={wantAccount}
                      onChange={(e) => setWantAccount(e.target.checked)}
                      className="mt-0.5 size-4 accent-[#0e7468] rounded-xs"
                    />
                    <div className="flex-1">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-[#073b36]">
                        <Sparkles size={14} className="text-[#0e7468]" />
                        {ar
                          ? "حفظ بياناتي وإنشاء حساب لمتابعة طلباتي القادمة"
                          : "Save my details & create an account for future orders"}
                      </span>
                      <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                        {ar
                          ? "سيتم ربط هذا الطلب بحسابك فوراً وحفظ عنوانك للتوصيل السريع."
                          : "This order will be instantly linked to your account and your address saved."}
                      </p>
                    </div>
                  </label>

                  {wantAccount && (
                    <div className="mt-4 border-t border-[#0e7468]/15 pt-3 space-y-3">
                      {checkingAccountEmail ? (
                        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                          <Loader2
                            size={13}
                            className="animate-spin text-[#0e7468]"
                          />
                          <span>
                            {ar
                              ? "جارٍ التحقق من البريد…"
                              : "Checking account status…"}
                          </span>
                        </div>
                      ) : effectiveAccountEmailExists ? (
                        <div className="rounded-xs border border-amber-500/30 bg-amber-50/90 p-2.5 text-xs text-amber-950">
                          <p className="font-semibold flex items-center gap-1.5 text-[#073b36]">
                            <KeyRound size={13} className="text-[#0e7468]" />
                            {ar
                              ? "لديك حساب بالفعل بهذا البريد الإلكتروني!"
                              : "An account already exists with this email!"}
                          </p>
                          <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">
                            {ar
                              ? "أدخل كلمة المرور الخاصة بك للتحقق وربط الطلب بحسابك تلقائياً."
                              : "Enter your password to verify and link this order to your account automatically."}
                          </p>
                        </div>
                      ) : (
                        <div className="text-[11px] text-[var(--text-muted)]">
                          {ar
                            ? "أنشئ كلمة مرور (٨ أحرف على الأقل) لحسابك الجديد لحفظ بياناتك."
                            : "Create a password (min 8 characters) to save your details for future orders."}
                        </div>
                      )}

                      <div>
                        <label className="grid gap-1 text-[11px] font-bold text-[var(--text-muted)]">
                          {effectiveAccountEmailExists
                            ? ar
                              ? "كلمة المرور الخاصة بحسابك"
                              : "Your account password"
                            : ar
                              ? "تعيين كلمة مرور جديدة"
                              : "Set a password"}
                          <div className="relative">
                            <input
                              type={showAccountPassword ? "text" : "password"}
                              value={accountPassword}
                              onChange={(e) =>
                                setAccountPassword(e.target.value)
                              }
                              placeholder={
                                effectiveAccountEmailExists
                                  ? "••••••••"
                                  : ar
                                    ? "٨ أحرف على الأقل"
                                    : "Minimum 8 characters"
                              }
                              autoComplete={
                                effectiveAccountEmailExists
                                  ? "current-password"
                                  : "new-password"
                              }
                              className={`${inputClass} pe-9`}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowAccountPassword(!showAccountPassword)
                              }
                              className="absolute inset-y-0 end-0 flex items-center pe-3 text-[var(--text-muted)] hover:text-[var(--text-strong)]"
                              aria-label={
                                showAccountPassword
                                  ? "Hide password"
                                  : "Show password"
                              }
                            >
                              {showAccountPassword ? (
                                <EyeOff size={15} />
                              ) : (
                                <Eye size={15} />
                              )}
                            </button>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Step 2: Delivery Address */}
          <section className="rounded-xs border border-[var(--border-subtle)] bg-white p-6 shadow-xs sm:p-8">
            <div className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-full bg-[#073b36] text-xs font-bold text-white">
                2
              </span>
              <h2 className="font-serif text-2xl text-[var(--text-strong)]">
                {ar ? "عنوان التوصيل" : "Delivery address"}
              </h2>
            </div>
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
              <label className="grid gap-2 text-xs font-bold text-[var(--text-muted)]">
                {ar ? "المحافظة" : "Governorate"}
                <select
                  name="governorateCode"
                  className={inputClass}
                  required
                  value={governorateCode}
                  onChange={(event) => {
                    const next = shippingLocations.find(
                      (item) => item.code === event.target.value,
                    );
                    setGovernorateCode(event.target.value);
                    setCityCode("");
                    setCustomCity("");
                    if (paymentMethod === "cod" && !next?.zone.codEnabled)
                      setPaymentMethod("vodafone_cash");
                  }}
                >
                  <option value="" disabled>
                    {ar ? "اختر المحافظة" : "Choose governorate"}
                  </option>
                  {shippingLocations.map((item) => (
                    <option key={item.code} value={item.code}>
                      {ar ? item.nameAr : item.nameEn}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-xs font-bold text-[var(--text-muted)]">
                {ar ? "المدينة / المنطقة" : "City / district"}
                <select
                  name="cityCode"
                  className={inputClass}
                  required
                  value={cityCode}
                  disabled={!selectedGovernorate}
                  onChange={(event) => {
                    setCityCode(event.target.value);
                    setCustomCity("");
                  }}
                >
                  <option value="" disabled>
                    {ar ? "اختر المدينة" : "Choose city"}
                  </option>
                  {selectedGovernorate?.cities.map((city) => (
                    <option key={city.code} value={city.code}>
                      {ar ? city.nameAr : city.nameEn}
                    </option>
                  ))}
                  <option value="other">
                    {ar ? "منطقة أخرى" : "Other area"}
                  </option>
                </select>
              </label>
              {cityCode === "other" && (
                <label className="grid gap-2 text-xs font-bold sm:col-span-2 text-[var(--text-muted)]">
                  {ar ? "اكتب المدينة أو المنطقة" : "Enter city or district"}
                  <input
                    name="city"
                    className={inputClass}
                    required
                    minLength={2}
                    maxLength={100}
                    value={customCity}
                    onChange={(event) => setCustomCity(event.target.value)}
                  />
                </label>
              )}
              {selectedGovernorate && (
                <div className="rounded-xs border border-[#0e7468]/20 bg-[#f0f5f3] p-4 text-xs leading-relaxed text-[var(--text-strong)] sm:col-span-2">
                  <strong>
                    {ar
                      ? selectedGovernorate.zone.nameAr
                      : selectedGovernorate.zone.nameEn}
                  </strong>
                  <span className="ms-2">
                    {ar
                      ? `التوصيل المتوقع خلال ${selectedGovernorate.zone.deliveryMinDays}–${selectedGovernorate.zone.deliveryMaxDays} أيام عمل.`
                      : `Estimated delivery in ${selectedGovernorate.zone.deliveryMinDays}–${selectedGovernorate.zone.deliveryMaxDays} business days.`}
                  </span>
                  {selectedGovernorate.zone.freeShippingThresholdMinor !==
                    null && (
                    <span className="mt-1 block font-semibold text-[#0e7468]">
                      {ar
                        ? `شحن أساسي مجاني للطلبات من ${formatMoney(selectedGovernorate.zone.freeShippingThresholdMinor, locale)}.`
                        : `Free base shipping from ${formatMoney(selectedGovernorate.zone.freeShippingThresholdMinor, locale)}.`}
                    </span>
                  )}
                </div>
              )}
              {/* Address Mode Segmented Control */}
              <div className="sm:col-span-2">
                <div className="rounded-xs border border-[var(--border-subtle)] bg-[var(--surface-canvas)] p-3.5">
                  <div className="mb-2.5 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-[.14em] text-[var(--text-muted)]">
                      {ar ? "طريقة كتابة العنوان" : "Address Format Preference"}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {ar ? "اختر ما يناسبك" : "Select preferred format"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSwitchAddressMode("quick")}
                      className={`flex items-center justify-center gap-2 rounded-xs py-2.5 px-3 text-xs font-bold transition-all ${
                        addressMode === "quick"
                          ? "bg-[#073b36] text-white shadow-xs"
                          : "border border-[var(--border-subtle)] bg-white text-[var(--text-secondary)] hover:border-[#0e7468] hover:text-[var(--text-strong)]"
                      }`}
                    >
                      <Zap
                        size={14}
                        className={
                          addressMode === "quick"
                            ? "text-[#81c5b8]"
                            : "text-neutral-400"
                        }
                      />
                      <span>
                        {ar
                          ? "عنوان سريع (نص موحد)"
                          : "Quick Address (Single field)"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSwitchAddressMode("detailed")}
                      className={`flex items-center justify-center gap-2 rounded-xs py-2.5 px-3 text-xs font-bold transition-all ${
                        addressMode === "detailed"
                          ? "bg-[#073b36] text-white shadow-xs"
                          : "border border-[var(--border-subtle)] bg-white text-[var(--text-secondary)] hover:border-[#0e7468] hover:text-[var(--text-strong)]"
                      }`}
                    >
                      <SlidersHorizontal
                        size={14}
                        className={
                          addressMode === "detailed"
                            ? "text-[#81c5b8]"
                            : "text-neutral-400"
                        }
                      />
                      <span>
                        {ar
                          ? "تفصيلي (حقول مقسمة)"
                          : "Detailed (Separate fields)"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {addressMode === "quick" ? (
                <div className="sm:col-span-2">
                  <label className="grid gap-2 text-xs font-bold text-[var(--text-muted)]">
                    <span className="flex items-center justify-between">
                      <span>
                        {ar
                          ? "العنوان بالتفصيل (في مكان واحد)"
                          : "Full address details (single field)"}
                      </span>
                      <span
                        className={`text-[10px] font-mono ${
                          plainAddress.length > 280
                            ? "font-bold text-[var(--color-accent)]"
                            : "text-[var(--text-muted)]"
                        }`}
                      >
                        {plainAddress.length}/300 {ar ? "حرف" : "chars"}
                      </span>
                    </span>
                    <textarea
                      name="streetAddress"
                      value={plainAddress}
                      onChange={(e) => setPlainAddress(e.target.value)}
                      className="min-h-28 w-full rounded-xs border border-[var(--border-subtle)] bg-white p-4 text-sm leading-relaxed text-[var(--text-strong)] outline-none transition focus:border-[#0e7468] focus:ring-2 focus:ring-[#0e7468]/20 placeholder:text-xs placeholder:text-neutral-400"
                      required
                      minLength={5}
                      maxLength={300}
                      placeholder={
                        ar
                          ? "اكتب الشارع والمبنى والدور والعيادة/الشقة وأي علامة مميزة...\nمثال: شارع مصطفى النحاس، برج الأطباء عمارة ١٥، الدور الرابع، عيادة د. أحمد، بجوار مسجد السلام"
                          : "Enter street, building, floor, clinic/apt & landmark...\ne.g. 15 Mustafa El-Nahas St, Doctors Tower, 4th floor, Clinic 402, next to El-Salam Mosque"
                      }
                    />
                  </label>
                  <p className="mt-2 text-[11px] leading-normal text-[var(--text-muted)]">
                    {ar
                      ? "💡 يمكنك كتابة أو لصق عنوانك بالكامل في هذا الحقل بكل سهولة دون الحاجة لتعبئة خانات متعددة."
                      : "💡 You can type or paste your complete address here at once without needing to fill multiple separate fields."}
                  </p>
                </div>
              ) : (
                <>
                  <label className="grid gap-2 text-xs font-bold sm:col-span-2 text-[var(--text-muted)]">
                    {ar ? "اسم الشارع والعنوان" : "Street address"}
                    <input
                      name="streetAddress"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      className={inputClass}
                      required
                      minLength={5}
                      maxLength={300}
                      placeholder={
                        ar ? "اسم الشارع والمنطقة" : "Street name & area"
                      }
                      autoComplete="street-address"
                    />
                  </label>
                  <label className="grid gap-2 text-xs font-bold text-[var(--text-muted)]">
                    {ar ? "المبنى / البرج" : "Building / Tower"}
                    <input
                      name="building"
                      value={building}
                      onChange={(e) => setBuilding(e.target.value)}
                      placeholder={ar ? "رقم أو اسم المبنى" : "Bldg # or name"}
                      maxLength={50}
                      className={inputClass}
                    />
                  </label>
                  <label className="grid gap-2 text-xs font-bold text-[var(--text-muted)]">
                    {ar ? "الدور / الطابق" : "Floor"}
                    <input
                      name="floor"
                      value={floor}
                      onChange={(e) => setFloor(e.target.value)}
                      placeholder={ar ? "مثال: الرابع" : "e.g. 4th"}
                      maxLength={30}
                      className={inputClass}
                    />
                  </label>
                  <label className="grid gap-2 text-xs font-bold text-[var(--text-muted)]">
                    {ar ? "العيادة / الشقة" : "Clinic / Apt"}
                    <input
                      name="apartment"
                      value={apartment}
                      onChange={(e) => setApartment(e.target.value)}
                      placeholder={
                        ar ? "رقم العيادة أو الشقة" : "Clinic or apt #"
                      }
                      maxLength={50}
                      className={inputClass}
                    />
                  </label>
                  <label className="grid gap-2 text-xs font-bold text-[var(--text-muted)]">
                    {ar ? "علامة مميزة (اختياري)" : "Landmark (optional)"}
                    <input
                      name="landmark"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder={
                        ar ? "بجوار، أمام، خلف..." : "Near, opposite, behind..."
                      }
                      maxLength={200}
                      className={inputClass}
                    />
                  </label>
                </>
              )}
              <label className="grid gap-2 text-xs font-bold sm:col-span-2 text-[var(--text-muted)]">
                {ar ? "ملاحظات إضافية على الطلب" : "Order notes"}
                <textarea
                  name="customerNotes"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="min-h-24 w-full rounded-xs border border-[var(--border-subtle)] bg-white p-4 text-sm text-[var(--text-strong)] outline-none focus:border-[#0e7468]"
                  maxLength={1000}
                />
              </label>
            </div>
          </section>

          {/* Step 3: Payment Method */}
          <section className="rounded-xs border border-[var(--border-subtle)] bg-white p-6 shadow-xs sm:p-8">
            <div className="flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-full bg-[#073b36] text-xs font-bold text-white">
                3
              </span>
              <h2 className="font-serif text-2xl text-[var(--text-strong)]">
                {ar ? "طريقة الدفع" : "Payment method"}
              </h2>
            </div>
            <div className="mt-6 grid gap-3">
              {paymentOptions.map(
                ({ id, title, detail, icon: Icon, disabled }) => (
                  <label
                    key={id}
                    className={`flex items-start gap-4 rounded-xs border p-4 transition ${
                      disabled
                        ? "cursor-not-allowed bg-neutral-50 opacity-50"
                        : "cursor-pointer hover:border-[#0e7468]"
                    } ${
                      paymentMethod === id
                        ? "border-[#0e7468] bg-[#f0f5f3] ring-1 ring-[#0e7468]"
                        : "border-[var(--border-subtle)] bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={id}
                      checked={paymentMethod === id}
                      disabled={disabled}
                      onChange={() => setPaymentMethod(id)}
                      className="mt-1 accent-[#0e7468]"
                    />
                    <Icon size={24} className="shrink-0" />
                    <span>
                      <strong className="block text-sm font-bold text-[var(--text-strong)]">
                        {title}
                      </strong>
                      <span className="mt-1 block text-xs leading-relaxed text-[var(--text-muted)]">
                        {detail}
                      </span>
                    </span>
                  </label>
                ),
              )}
            </div>

            {paymentMethod === "cod" && codAvailable && (
              <div className="mt-6 rounded-xs border border-[#0e7468]/20 bg-[#f0f5f3] p-4 text-xs">
                <strong className="text-sm font-bold text-[var(--text-strong)]">
                  {ar
                    ? `المقدم المطلوب: ${formatMoney(codDeposit, locale)}`
                    : `Required deposit: ${formatMoney(codDeposit, locale)}`}
                </strong>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {ar
                    ? `المتبقي عند الاستلام: ${formatMoney(Math.max(0, (shippingQuote?.totalMinor ?? pricingSubtotal) - codDeposit), locale)}`
                    : `Balance due on delivery: ${formatMoney(Math.max(0, (shippingQuote?.totalMinor ?? pricingSubtotal) - codDeposit), locale)}`}
                </p>
                <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  {ar ? "طريقة دفع المقدم" : "Deposit payment method"}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <DepositMethodButton
                    selected={codDepositMethod === "vodafone_cash"}
                    onClick={() => setCodDepositMethod("vodafone_cash")}
                    label="Vodafone Cash"
                    icon={VodafoneCashIcon}
                  />
                  <DepositMethodButton
                    selected={codDepositMethod === "instapay"}
                    onClick={() => setCodDepositMethod("instapay")}
                    label="InstaPay"
                    icon={InstaPayIcon}
                  />
                </div>
                {transferDestination && (
                  <p className="mt-3 text-xs font-bold text-[#073b36]">
                    {ar
                      ? `حوّل المقدم إلى الرقم / العنوان: ${transferDestination}`
                      : `Transfer the deposit to: ${transferDestination}`}
                  </p>
                )}
              </div>
            )}

            {proofRequired && (
              <div className="mt-6 grid gap-4">
                {!manualDestinationConfigured && (
                  <p className="rounded-xs border border-[#0e7468]/25 bg-[#f0f5f3] p-4 text-xs leading-relaxed text-[var(--text-strong)]">
                    {ar
                      ? "قبل التحويل، يرجى طلب تفاصيل التحويل المحدثة من فريق العمل عبر واتساب."
                      : "Before transferring, please request updated transfer details on WhatsApp."}{" "}
                    <a
                      href={paymentHelpUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-[#0e7468] underline"
                    >
                      {ar ? "فتح محادثة واتساب" : "Open WhatsApp"}
                    </a>
                  </p>
                )}
                <label className="grid gap-2 text-xs font-bold text-[var(--text-muted)]">
                  {paymentMethod === "cod"
                    ? ar
                      ? "صورة إيصال تحويل المقدم"
                      : "Deposit transfer receipt screenshot"
                    : ar
                      ? "صورة إيصال التحويل الكامل"
                      : "Transfer receipt screenshot"}
                  <input
                    name="proof"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    required
                    className="rounded-xs border border-dashed border-[#0e7468] bg-[#f0f5f3] p-5 text-xs text-[var(--text-strong)]"
                  />
                  <span className="font-normal text-[var(--text-muted)]">
                    {ar
                      ? "صيغ JPG أو PNG أو WebP — بحد أقصى ٥ ميجابايت. يبدأ تجهيز الطلب فور مراجعة الإيصال."
                      : "JPG, PNG, or WebP — max 5 MB. Fulfilment begins after receipt review."}
                  </span>
                </label>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar Order Summary */}
        <aside className="h-fit rounded-xs border border-[var(--border-subtle)] bg-white p-6 shadow-xs lg:sticky lg:top-24">
          <h2 className="font-serif text-2xl text-[var(--text-strong)]">
            {ar ? "ملخص الطلب" : "Order summary"}
          </h2>
          <div className="mt-5 max-h-80 divide-y divide-[var(--border-subtle)] overflow-auto pe-1">
            {cartItems.map((line) => (
              <div
                key={line.key}
                className="grid grid-cols-[56px_1fr_auto] gap-3 py-3"
              >
                <div className="relative aspect-[3/4] overflow-hidden rounded-xs border border-[var(--border-subtle)] bg-[#ebe9e4]">
                  <Image
                    src={line.image.src}
                    alt={line.image.alt[locale]}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <strong className="line-clamp-1 text-xs font-semibold text-[var(--text-strong)]">
                    {line.title[locale]}
                  </strong>
                  <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                    {line.colourName[locale]} · {line.size} · ×{line.quantity}
                  </p>
                </div>
                <strong className="text-xs font-bold text-[var(--text-strong)]">
                  {formatMoney(line.price * line.quantity, locale)}
                </strong>
              </div>
            ))}
          </div>

          {/* Discount code */}
          <div className="mt-5 border-t border-[var(--border-subtle)] pt-5">
            <label
              htmlFor="discount-code"
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.14em] text-[var(--text-muted)]"
            >
              <BadgePercent size={15} />
              {ar ? "كود الخصم" : "Discount code"}
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="discount-code"
                value={discountInput}
                onChange={(event) => {
                  setDiscountInput(event.target.value.toUpperCase());
                  setDiscountError("");
                }}
                maxLength={32}
                className="h-11 min-w-0 flex-1 rounded-xs border border-[var(--border-subtle)] px-3 font-mono text-xs uppercase outline-none focus:border-[#0e7468]"
                placeholder={ar ? "أدخل الكود" : "ENTER CODE"}
              />
              {appliedDiscount ? (
                <button
                  type="button"
                  onClick={removeDiscount}
                  className="flex h-11 items-center gap-1.5 rounded-xs border border-[var(--border-subtle)] px-3 text-[10px] font-bold uppercase text-[var(--text-muted)] hover:text-[#a5472f]"
                >
                  <X size={14} />
                  {ar ? "إزالة" : "Remove"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={applyDiscount}
                  disabled={discountBusy || !discountInput.trim()}
                  className="flex h-11 min-w-24 items-center justify-center rounded-xs bg-[#073b36] px-4 text-[10px] font-bold uppercase tracking-[.1em] text-white hover:bg-[#0e7468] disabled:opacity-50"
                >
                  {discountBusy ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : ar ? (
                    "تطبيق"
                  ) : (
                    "Apply"
                  )}
                </button>
              )}
            </div>
            {appliedDiscount && (
              <p className="mt-2 text-xs font-bold text-[#0e7468]">
                {ar
                  ? `تم تطبيق ${appliedDiscount.code}: وفرت ${formatMoney(appliedDiscount.discountMinor, locale)}`
                  : `${appliedDiscount.code} applied: you save ${formatMoney(appliedDiscount.discountMinor, locale)}`}
              </p>
            )}
            {discountResult && !appliedDiscount && (
              <p className="mt-2 text-xs text-amber-700">
                {ar
                  ? "تغيرت بيانات السلة أو الدفع. أعد تطبيق الكود."
                  : "Cart or payment changed. Please re-apply code."}
              </p>
            )}
            {discountError && (
              <p
                role="alert"
                className="mt-2 text-xs font-semibold text-[#a5472f]"
              >
                {discountError}
              </p>
            )}
          </div>

          {/* Pricing breakdown */}
          <dl className="mt-5 space-y-2.5 border-t border-[var(--border-subtle)] pt-4 text-xs">
            <div className="flex justify-between text-[var(--text-muted)]">
              <dt>{ar ? "المنتجات" : "Items subtotal"}</dt>
              <dd className="font-semibold text-[var(--text-strong)]">
                {formatMoney(
                  appliedDiscount?.subtotalMinor ?? subtotal,
                  locale,
                )}
              </dd>
            </div>
            {appliedDiscount && (
              <div className="flex justify-between font-bold text-[#0e7468]">
                <dt>
                  {ar
                    ? `خصم ${appliedDiscount.code}`
                    : `${appliedDiscount.code} discount`}
                </dt>
                <dd>−{formatMoney(appliedDiscount.discountMinor, locale)}</dd>
              </div>
            )}
            <div className="flex justify-between text-[var(--text-muted)]">
              <dt>{ar ? "الشحن الأساسي" : "Base shipping"}</dt>
              <dd className="font-semibold text-[var(--text-strong)]">
                {shippingQuote
                  ? shippingQuote.baseMinor
                    ? formatMoney(shippingQuote.baseMinor, locale)
                    : ar
                      ? "مجاني"
                      : "Free"
                  : ar
                    ? "اختر المحافظة"
                    : "Select governorate"}
              </dd>
            </div>
            {shippingQuote?.discountMinor ? (
              <div className="flex justify-between text-[#0e7468]">
                <dt>{ar ? "خصم الشحن" : "Shipping discount"}</dt>
                <dd>−{formatMoney(shippingQuote.discountMinor, locale)}</dd>
              </div>
            ) : null}
            {shippingQuote?.codSurchargeMinor ? (
              <div className="flex justify-between text-[var(--text-muted)]">
                <dt>{ar ? "رسوم الدفع عند الاستلام" : "COD service fee"}</dt>
                <dd className="font-semibold text-[var(--text-strong)]">
                  {formatMoney(shippingQuote.codSurchargeMinor, locale)}
                </dd>
              </div>
            ) : null}
            {paymentMethod === "cod" && codAvailable && (
              <>
                <div className="flex justify-between border-t border-dashed border-[var(--border-subtle)] pt-2 font-bold text-[#0e7468]">
                  <dt>{ar ? "المقدم المطلوب" : "Deposit due"}</dt>
                  <dd>{formatMoney(codDeposit, locale)}</dd>
                </div>
                <div className="flex justify-between font-bold text-[#a5472f]">
                  <dt>{ar ? "المتبقي عند الاستلام" : "Due on delivery"}</dt>
                  <dd>
                    {formatMoney(
                      Math.max(
                        0,
                        (shippingQuote?.totalMinor ?? pricingSubtotal) -
                          codDeposit,
                      ),
                      locale,
                    )}
                  </dd>
                </div>
              </>
            )}
            <div className="flex justify-between border-t border-[var(--border-subtle)] pt-3 text-sm font-bold text-[var(--text-strong)]">
              <dt>{ar ? "الإجمالي الكلي" : "Total amount"}</dt>
              <dd>
                {formatMoney(
                  shippingQuote?.totalMinor ?? pricingSubtotal,
                  locale,
                )}
              </dd>
            </div>
          </dl>

          <label className="mt-5 flex items-start gap-2.5 text-[11px] leading-relaxed text-[var(--text-muted)]">
            <input
              type="checkbox"
              required
              className="mt-0.5 accent-[#0e7468]"
            />
            <span>
              {ar
                ? "أؤكد صحة بيانات الشحن والتواصل وأوافق على سياسة الاستبدال."
                : "I confirm these delivery details and accept the store exchange policy."}
            </span>
          </label>
          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xs border border-[#a5472f]/30 bg-[#a5472f]/10 p-3 text-xs font-semibold text-[#a5472f]"
            >
              {error}
            </p>
          )}
          <button
            disabled={
              Boolean(busy) ||
              discountBusy ||
              Boolean(discountInput.trim() && !appliedDiscount) ||
              (otpEnabled && !verificationToken) ||
              !shippingQuote ||
              !cityCode ||
              (paymentMethod === "cod" && !codAvailable)
            }
            className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-xs bg-[#073b36] text-xs font-bold uppercase tracking-[.14em] text-white shadow-xs transition hover:bg-[#0e7468] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === "order" ? (
              <Loader2 className="animate-spin" size={17} />
            ) : (
              <LockKeyhole size={16} />
            )}
            {ar ? "تأكيد الطلب الآن" : "Place secure order"}
          </button>
          <p className="mt-3 text-center text-[10px] text-[var(--text-muted)]">
            {ar
              ? "مدفوعات محمية ومراجعة يدوياً لضمان سلامة كل طلب."
              : "All transactions are secured and verified."}
          </p>
        </aside>
      </form>
    </main>
  );
}

function DepositMethodButton({
  selected,
  onClick,
  label,
  icon: Icon,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  icon: React.ComponentType<PaymentIconProps>;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex items-center gap-2 rounded-xs border px-3 py-2.5 text-start text-xs font-bold transition ${
        selected
          ? "border-[#0e7468] bg-[#f0f5f3] text-[#073b36]"
          : "border-[var(--border-subtle)] bg-white text-[var(--text-muted)] hover:border-[#0e7468]"
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );
}

function VodafoneCashIcon({ size = 24, className }: PaymentIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 36 36"
      width={size}
      height={size}
      className={`shrink-0 rounded-full shadow-xs ${className ?? ""}`}
    >
      <circle cx="18" cy="18" r="18" fill="#ffffff" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M36 18c0 9.941-8.059 18-18 18S0 27.941 0 18 8.059 0 18 0c2.746 0 5.35.615 7.678 1.715-.31-.097-.796-.133-1.262-.133-3.746.013-7.877 1.615-10.892 4.112-3.09 2.565-5.509 6.88-5.497 11.361.021 6.778 5.167 11 10.113 10.983 6.11-.02 9.722-5.04 9.706-9.615-.015-4.576-2.503-7.883-7.984-9.218a1.871 1.871 0 0 1-.022-.293c-.011-3.456 2.592-6.502 5.864-7.185C31.791 4.614 36 10.816 36 18z"
        fill="#e60000"
      />
    </svg>
  );
}

function InstaPayIcon({ size = 24, className }: PaymentIconProps) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-white p-0.5 shadow-xs ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/images/payments/instapay.png"
        alt="InstaPay"
        width={size}
        height={size}
        className="size-full object-contain"
        unoptimized
      />
    </span>
  );
}
