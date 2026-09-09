"use client";

import Link from "next/link";
import { Instagram, Mail, MapPin, Phone } from "lucide-react";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";

export function SiteFooter({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  if (pathname.includes("/admin")) return null;
  const ar = locale === "ar";
  return (
    <footer className="border-t border-[var(--border-subtle)] bg-[var(--brand-950)] text-white">
      <div className="page-shell grid gap-10 py-12 md:grid-cols-[1.2fr_.8fr_.8fr] md:py-16">
        <div>
          <Link href={`/${locale}`} className="text-2xl font-black tracking-[-.07em]" aria-label={ar ? "سكراب فايب الرئيسية" : "Scrub Vibe home"}>
            SCRUB <span className="font-light text-[#81c5b8]">VIBE</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/70">
            {ar ? "ملابس طبية مصرية مصممة للراحة والحركة والثقة في كل شيفت." : "Egyptian-made medical clothing designed for comfort, movement and confidence on every shift."}
          </p>
        </div>
        <nav aria-label={ar ? "روابط التسوق" : "Shop links"}>
          <p className="eyebrow text-[#81c5b8]">{ar ? "تسوق" : "Shop"}</p>
          <div className="mt-4 grid gap-3 text-sm text-white/75">
            <Link href={`/${locale}/shop?category=women`} className="hover:text-white">{ar ? "سكراب حريمي" : "Female scrubs"}</Link>
            <Link href={`/${locale}/shop?category=men`} className="hover:text-white">{ar ? "سكراب رجالي" : "Male scrubs"}</Link>
            <Link href={`/${locale}/shop?q=lab+coat`} className="hover:text-white">{ar ? "بالطو طبي" : "Lab coats"}</Link>
            <Link href={`/${locale}/account`} className="hover:text-white">{ar ? "حسابي وطلباتي" : "Account & orders"}</Link>
          </div>
        </nav>
        <div>
          <p className="eyebrow text-[#81c5b8]">{ar ? "تواصل معنا" : "Contact"}</p>
          <div className="mt-4 grid gap-3 text-sm text-white/75">
            <a href="tel:01096733209" className="flex min-h-11 items-center gap-3 hover:text-white"><Phone size={16} aria-hidden="true" />01096733209</a>
            <a href="mailto:scrubvibe30@gmail.com" className="flex min-h-11 items-center gap-3 hover:text-white"><Mail size={16} aria-hidden="true" />scrubvibe30@gmail.com</a>
            <a href="https://www.instagram.com/scrubvibe_egy/" target="_blank" rel="noreferrer" className="flex min-h-11 items-center gap-3 hover:text-white"><Instagram size={16} aria-hidden="true" />@scrubvibe_egy</a>
            <span className="flex items-center gap-3"><MapPin size={16} aria-hidden="true" />{ar ? "توصيل لجميع محافظات مصر" : "Delivery across Egypt"}</span>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="page-shell flex flex-col gap-2 py-5 text-xs text-white/55 sm:flex-row sm:justify-between">
          <span>© 2026 SCRUB VIBE EGYPT</span>
          <span>{ar ? "صُنع في مصر · مصمم للمحترفين" : "Made in Egypt · Designed for professionals"}</span>
        </div>
      </div>
    </footer>
  );
}
