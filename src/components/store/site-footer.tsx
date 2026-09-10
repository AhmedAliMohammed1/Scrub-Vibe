"use client";

import Link from "next/link";
import type { Route } from "next";
import { Instagram, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import type { ViewerAccess } from "@/server/auth/roles";

export function SiteFooter({
  locale,
  viewer,
}: {
  locale: Locale;
  viewer: ViewerAccess;
}) {
  const pathname = usePathname();
  if (pathname.includes("/admin")) return null;
  const ar = locale === "ar";

  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[#073b36] text-white">
      <div className="page-shell grid gap-10 py-14 md:grid-cols-[1.3fr_0.8fr_0.9fr] md:py-20">
        {/* Brand Column */}
        <div>
          <Link
            href={`/${locale}`}
            className="text-2xl font-black tracking-[-.04em]"
            aria-label={ar ? "سكراب فايب الرئيسية" : "Scrub Vibe home"}
          >
            SCRUB <span className="font-light text-[#81c5b8]">VIBE</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/75">
            {ar
              ? "ملابس وأردية طبية عالية الجودة، مصنوعة في مصنعنا بمصر خصيصاً للأطباء وطواقم الرعاية الصحية لتوفير الراحة والثقة والتحمل في أصعب الشيفتات."
              : "Egyptian-manufactured medical scrubs and apparel, precision-tailored in our factory for healthcare practitioners demanding comfort, durability, and dignity on every shift."}
          </p>
          <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-[#81c5b8]">
            <ShieldCheck size={16} aria-hidden="true" />
            <span>
              {ar
                ? "صناعة مصرية ١٠٠٪ · استبدال واسترجاع سهل"
                : "100% Made in Egypt · Guaranteed Fit & Simple Exchange"}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav aria-label={ar ? "روابط المتجر" : "Shop links"}>
          <p className="eyebrow text-[#81c5b8]">
            {ar ? "تسوق المتجر" : "Shop"}
          </p>
          <div className="mt-4 grid gap-2.5 text-sm text-white/75">
            <Link
              href={`/${locale}/shop?category=women`}
              className="transition-colors hover:text-white"
            >
              {ar ? "سكراب حريمي" : "Female scrubs"}
            </Link>
            <Link
              href={`/${locale}/shop?category=men`}
              className="transition-colors hover:text-white"
            >
              {ar ? "سكراب رجالي" : "Male scrubs"}
            </Link>
            <Link
              href={`/${locale}/shop?q=lab+coat`}
              className="transition-colors hover:text-white"
            >
              {ar ? "بالطو طبي ولاب كوت" : "Lab coats"}
            </Link>
            <Link
              href={`/${locale}/shop?sale=1`}
              className="transition-colors hover:text-white text-[#81c5b8]"
            >
              {ar ? "العروض الخاصة" : "Special offers"}
            </Link>
            <Link
              href={`/${locale}/account`}
              className="transition-colors hover:text-white"
            >
              {viewer.isAuthenticated
                ? ar
                  ? "حسابي"
                  : "My account"
                : ar
                  ? "تسجيل الدخول"
                  : "Sign in"}
            </Link>
            <Link
              href={`/${locale}/account` as Route}
              className="transition-colors hover:text-white"
            >
              {ar ? "تتبع الطلبات" : "Track an order"}
            </Link>
            {viewer.canAccessAdmin && (
              <Link
                href={`/${locale}/admin` as Route}
                className="font-medium text-[#81c5b8] transition-colors hover:text-white"
              >
                {ar ? "لوحة إدارة المتجر (Admin)" : "Store Admin Dashboard"}
              </Link>
            )}
          </div>
        </nav>

        {/* Contact & Support */}
        <div>
          <p className="eyebrow text-[#81c5b8]">
            {ar ? "خدمة العملاء والتواصل" : "Support"}
          </p>
          <div className="mt-4 grid gap-3 text-sm text-white/75">
            <a
              href="tel:01096733209"
              className="flex min-h-10 items-center gap-3 transition-colors hover:text-white"
            >
              <Phone
                size={16}
                className="shrink-0 text-[#81c5b8]"
                aria-hidden="true"
              />
              <span>01096733209</span>
            </a>
            <a
              href="mailto:scrubvibe30@gmail.com"
              className="flex min-h-10 items-center gap-3 transition-colors hover:text-white"
            >
              <Mail
                size={16}
                className="shrink-0 text-[#81c5b8]"
                aria-hidden="true"
              />
              <span>scrubvibe30@gmail.com</span>
            </a>
            <a
              href="https://www.instagram.com/scrubvibe_egy/"
              target="_blank"
              rel="noreferrer"
              className="flex min-h-10 items-center gap-3 transition-colors hover:text-white"
            >
              <Instagram
                size={16}
                className="shrink-0 text-[#81c5b8]"
                aria-hidden="true"
              />
              <span>@scrubvibe_egy</span>
            </a>
            <div className="flex items-center gap-3 text-xs text-white/60">
              <MapPin
                size={16}
                className="shrink-0 text-[#81c5b8]"
                aria-hidden="true"
              />
              <span>
                {ar
                  ? "توصيل لجميع محافظات مصر الـ ٢٧"
                  : "Door-to-door delivery across all 27 Egypt governorates"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 bg-[#052824]">
        <div className="page-shell flex flex-col gap-3 py-5 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 SCRUB VIBE EGYPT · ALL RIGHTS RESERVED</span>
          <span>
            {ar
              ? "صُنع في مصر · مصمم لراحة الأطباء والكوادر الطبية"
              : "Made in Egypt · Designed for Healthcare Professionals"}
          </span>
        </div>
      </div>
    </footer>
  );
}
