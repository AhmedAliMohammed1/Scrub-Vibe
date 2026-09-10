"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Search,
  Shield,
  ShoppingBag,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import { copy, type Locale } from "@/lib/i18n";
import { useShop } from "./cart-provider";
import { trackStoreEvent } from "@/lib/analytics";
import { signOutAction } from "@/features/auth/actions";
import type { ViewerAccess } from "@/server/auth/roles";

export function Header({
  locale,
  viewer,
}: {
  locale: Locale;
  viewer: ViewerAccess;
}) {
  const pathname = usePathname();
  const t = copy[locale];
  const { cart, wishlist } = useShop();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const other = locale === "en" ? "ar" : "en";
  const ar = locale === "ar";

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileNavOpen(false);
  }

  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (!mobileNavOpen) return;
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalStyle;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileNavOpen]);

  const labels = ar
    ? {
        menu: "فتح القائمة الرئيسية",
        close: "إغلاق القائمة",
        home: "الصفحة الرئيسية لسكراب فايب",
        search: "بحث في المتجر",
        account: "حسابي والطلبات",
        signIn: "تسجيل الدخول",
        signOut: "تسجيل الخروج",
        admin: "لوحة الإدارة",
        wishlist: `قائمة الأمنيات: ${wishlist.length}`,
        cart: `حقيبة التسوق: ${cart}`,
        categories: "الأقسام",
        support: "المساعدة والتواصل",
        whatsapp: "محادثة عبر واتساب",
        track: "تتبع طلبك",
      }
    : {
        menu: "Open navigation menu",
        close: "Close menu",
        home: "Scrub Vibe home",
        search: "Search catalog",
        account: "My account",
        signIn: "Sign In",
        signOut: "Sign Out",
        admin: "Admin Dashboard",
        wishlist: `Wishlist (${wishlist.length})`,
        cart: `Bag (${cart})`,
        categories: "Collections",
        support: "Help & Inquiries",
        whatsapp: "Chat on WhatsApp",
        track: "Track order",
      };

  if (pathname.includes("/admin")) return null;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[#f6f7f4]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-3 sm:h-18 sm:px-6 lg:px-8">
          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="grid size-11 place-items-center rounded-sm text-[var(--text-strong)] hover:bg-black/5 xl:hidden"
            aria-label={labels.menu}
            aria-expanded={mobileNavOpen}
          >
            <Menu size={22} strokeWidth={1.8} aria-hidden="true" />
          </button>

          {/* Desktop primary navigation */}
          <nav
            className="hidden items-center gap-7 xl:flex"
            aria-label="Primary navigation"
          >
            {t.nav.slice(0, 4).map((item, i) => {
              const href = (
                i === 0
                  ? `/${locale}/shop?category=new`
                  : i === 1
                    ? `/${locale}/shop?category=women`
                    : i === 2
                      ? `/${locale}/shop?category=men`
                      : `/${locale}/shop?q=lab+coat`
              ) as Route;
              const isActive = pathname === href;
              return (
                <Link
                  key={item}
                  href={href}
                  className={`py-2 text-[11px] font-bold uppercase tracking-[.14em] transition-colors ${
                    isActive
                      ? "text-[#0e7468]"
                      : "text-[var(--text-strong)] hover:text-[#0e7468]"
                  }`}
                >
                  {item}
                </Link>
              );
            })}
          </nav>

          {/* Logo brand mark */}
          <Link
            href={`/${locale}`}
            className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-lg font-black tracking-[-.04em] sm:text-2xl"
            aria-label={labels.home}
          >
            <span className="text-[#073b36]">SCRUB</span>
            <span className="ms-1.5 font-light text-[#0e7468]">VIBE</span>
          </Link>

          {/* Utility actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search */}
            <Link
              href={`/${locale}/shop#catalog-search`}
              className="grid size-9 place-items-center rounded-xs text-[var(--text-strong)] hover:bg-black/5 sm:size-10"
              aria-label={labels.search}
            >
              <Search size={19} strokeWidth={1.8} aria-hidden="true" />
            </Link>

            {/* Sign In / My Account Button */}
            <Link
              href={`/${locale}/account` as Route}
              className="flex h-9 items-center gap-1.5 rounded-xs border border-[var(--border-subtle)] bg-white px-2 text-[11px] font-bold uppercase tracking-wider text-[var(--text-strong)] shadow-2xs transition-all hover:border-[#0e7468] hover:text-[#0e7468] active:scale-[0.98] sm:px-2.5"
              aria-label={
                viewer.isAuthenticated ? labels.account : labels.signIn
              }
              title={viewer.isAuthenticated ? labels.account : labels.signIn}
            >
              <UserRound size={15} strokeWidth={2} aria-hidden="true" />
              <span className="hidden min-[480px]:inline">
                {viewer.isAuthenticated ? labels.account : labels.signIn}
              </span>
            </Link>

            {viewer.isAuthenticated && (
              <form action={signOutAction}>
                <input type="hidden" name="locale" value={locale} />
                <button
                  type="submit"
                  className="flex size-9 items-center justify-center rounded-xs border border-[var(--border-subtle)] bg-white text-[var(--text-strong)] shadow-2xs hover:border-[#0e7468] hover:text-[#0e7468] sm:size-10 xl:w-auto xl:gap-1.5 xl:px-2.5"
                  aria-label={labels.signOut}
                  title={labels.signOut}
                >
                  <LogOut size={15} strokeWidth={2} aria-hidden="true" />
                  <span className="hidden text-[10px] font-bold uppercase tracking-wider xl:inline">
                    {labels.signOut}
                  </span>
                </button>
              </form>
            )}

            {/* Admin Dashboard button (visible on screens >= md) */}
            {viewer.canAccessAdmin && (
              <Link
                href={`/${locale}/admin` as Route}
                className="hidden h-9 items-center gap-1.5 rounded-xs bg-[#073b36] px-2.5 text-[10px] font-bold uppercase tracking-[.12em] text-white shadow-2xs transition-all hover:bg-[#0e7468] active:scale-[0.98] md:flex"
                title={labels.admin}
              >
                <LayoutDashboard size={13} strokeWidth={2} aria-hidden="true" />
                <span>{labels.admin}</span>
              </Link>
            )}

            {/* Wishlist */}
            <Link
              href={`/${locale}/wishlist`}
              className="relative grid size-9 place-items-center rounded-xs text-[var(--text-strong)] hover:bg-black/5 sm:size-10"
              aria-label={labels.wishlist}
            >
              <Heart size={19} strokeWidth={1.8} aria-hidden="true" />
              {wishlist.length > 0 && (
                <span className="counter">{wishlist.length}</span>
              )}
            </Link>

            {/* Cart */}
            <Link
              href={`/${locale}/cart`}
              className="relative grid size-9 place-items-center rounded-xs text-[var(--text-strong)] hover:bg-black/5 sm:size-10"
              aria-label={labels.cart}
            >
              <ShoppingBag size={19} strokeWidth={1.8} aria-hidden="true" />
              {cart > 0 && <span className="counter">{cart}</span>}
            </Link>

            {/* Language switch */}
            <Link
              href={`/${other}` as Route}
              className="ms-0.5 flex h-9 items-center rounded-xs border-s border-black/15 ps-2 text-[11px] font-bold uppercase text-[var(--text-strong)] hover:text-[#0e7468] sm:ms-1 sm:ps-3"
            >
              {other === "ar" ? "العربية" : "EN"}
            </Link>
          </div>
        </div>

        {/* Secondary desktop bar */}
        <nav className="mx-auto hidden max-w-[1440px] items-center justify-between border-t border-black/5 px-6 py-2.5 lg:flex">
          <div className="flex items-center gap-7">
            {t.nav.slice(4).map((item, i) => (
              <Link
                key={item}
                href={
                  i === 0
                    ? "https://www.instagram.com/scrubvibe_egy/"
                    : i === 1
                      ? `/${locale}#quality`
                      : i === 2
                        ? `/${locale}/shop?sale=1`
                        : `/${locale}/shop`
                }
                target={i === 0 ? "_blank" : undefined}
                rel={i === 0 ? "noreferrer" : undefined}
                onClick={
                  i === 0 ? () => trackStoreEvent("instagram_click") : undefined
                }
                className={i === 2 ? "nav-sale" : "nav-secondary"}
              >
                {item}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-5 text-xs">
            <Link
              href={`/${locale}/account` as Route}
              className="flex items-center gap-1.5 font-semibold text-neutral-600 transition-colors hover:text-[#0e7468]"
            >
              <Truck size={14} />
              <span>{labels.track}</span>
            </Link>
            {viewer.canAccessAdmin && (
              <>
                <span className="text-neutral-300">·</span>
                <Link
                  href={`/${locale}/admin` as Route}
                  className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#073b36] transition-colors hover:text-[#0e7468]"
                >
                  <Shield size={13} aria-hidden="true" />
                  <span>{labels.admin}</span>
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity xl:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Content */}
      <aside
        className={`fixed inset-y-0 start-0 z-50 flex w-[85%] max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ease-out xl:hidden ${
          mobileNavOpen
            ? "translate-x-0"
            : ar
              ? "translate-x-full"
              : "-translate-x-full"
        }`}
        aria-label="Mobile navigation"
        aria-hidden={!mobileNavOpen}
        inert={!mobileNavOpen}
      >
        {/* Drawer Header */}
        <div className="flex h-16 items-center justify-between border-b border-[var(--border-subtle)] px-5">
          <Link
            href={`/${locale}`}
            onClick={() => setMobileNavOpen(false)}
            className="text-lg font-black tracking-[-.04em]"
          >
            <span className="text-[#073b36]">SCRUB</span>
            <span className="ms-1.5 font-light text-[#0e7468]">VIBE</span>
          </Link>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="grid size-10 place-items-center rounded-sm hover:bg-black/5"
            aria-label={labels.close}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* Drawer Links */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {/* Account access */}
          <div className="mb-6 space-y-2.5 border-b border-[var(--border-subtle)] pb-5">
            <Link
              href={`/${locale}/account` as Route}
              onClick={() => setMobileNavOpen(false)}
              className="flex items-center justify-between rounded-xs border border-[var(--border-subtle)] bg-[var(--surface-canvas)] p-3 transition-colors hover:border-[#0e7468]"
            >
              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-xs bg-[#073b36] text-white">
                  <UserRound size={17} strokeWidth={2} />
                </div>
                <div>
                  <strong className="block text-xs font-bold text-[var(--text-primary)]">
                    {viewer.isAuthenticated
                      ? labels.account
                      : ar
                        ? "تسجيل الدخول / حسابي"
                        : "Sign In / My Account"}
                  </strong>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {ar
                      ? "متابعة الطلبات وتفاصيل الحساب"
                      : "Orders, addresses & profile"}
                  </span>
                </div>
              </div>
              <ChevronRight
                size={16}
                className="text-neutral-400 rtl:rotate-180"
              />
            </Link>

            {viewer.isAuthenticated && (
              <form action={signOutAction}>
                <input type="hidden" name="locale" value={locale} />
                <button
                  type="submit"
                  className="flex min-h-11 w-full items-center gap-2.5 rounded-xs border border-[var(--border-subtle)] bg-white px-3 text-xs font-bold uppercase tracking-wider text-[var(--text-strong)] hover:border-[#0e7468] hover:text-[#0e7468]"
                >
                  <LogOut size={16} aria-hidden="true" />
                  {labels.signOut}
                </button>
              </form>
            )}

            {viewer.canAccessAdmin && (
              <Link
                href={`/${locale}/admin` as Route}
                onClick={() => setMobileNavOpen(false)}
                className="group flex items-center justify-between rounded-xs border border-[#073b36]/25 bg-[#073b36]/5 p-3 transition-colors hover:bg-[#073b36] hover:text-white"
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard
                    size={16}
                    className="text-[#073b36] group-hover:text-white"
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#073b36] group-hover:text-white">
                    {ar ? "لوحة الإدارة والتحكم" : "Admin Dashboard"}
                  </span>
                </div>
                <span className="rounded-xs bg-[#073b36]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#073b36] group-hover:bg-white group-hover:text-[#073b36]">
                  {ar ? "المشرفين" : "Staff"}
                </span>
              </Link>
            )}
          </div>

          <p className="eyebrow text-[#0e7468]">{labels.categories}</p>
          <nav className="mt-4 grid gap-1">
            {t.nav.slice(0, 4).map((item, i) => (
              <Link
                key={item}
                href={
                  (i === 0
                    ? `/${locale}/shop?category=new`
                    : i === 1
                      ? `/${locale}/shop?category=women`
                      : i === 2
                        ? `/${locale}/shop?category=men`
                        : `/${locale}/shop?q=lab+coat`) as Route
                }
                onClick={() => setMobileNavOpen(false)}
                className="flex min-h-12 items-center border-b border-black/5 text-sm font-bold tracking-[.06em] text-[var(--text-strong)] hover:text-[#0e7468]"
              >
                {item}
              </Link>
            ))}
            <Link
              href={`/${locale}/shop?sale=1` as Route}
              onClick={() => setMobileNavOpen(false)}
              className="flex min-h-12 items-center border-b border-black/5 text-sm font-bold tracking-[.06em] text-[#0e7468]"
            >
              {t.nav[6]}
            </Link>
            <Link
              href={`/${locale}#quality` as Route}
              onClick={() => setMobileNavOpen(false)}
              className="flex min-h-12 items-center border-b border-black/5 text-sm font-bold tracking-[.06em] text-[var(--text-strong)] hover:text-[#0e7468]"
            >
              {t.nav[5]}
            </Link>
          </nav>

          <p className="eyebrow mt-8 text-[#0e7468]">{labels.support}</p>
          <div className="mt-4 grid gap-2">
            <Link
              href={`/${locale}/account` as Route}
              onClick={() => setMobileNavOpen(false)}
              className="flex min-h-11 items-center gap-3 text-xs font-semibold text-[var(--text-strong)] hover:text-[#0e7468]"
            >
              <Truck size={17} strokeWidth={1.8} aria-hidden="true" />
              {labels.track}
            </Link>
            <Link
              href={`/${locale}/account/returns` as Route}
              onClick={() => setMobileNavOpen(false)}
              className="flex min-h-11 items-center gap-3 text-xs font-semibold text-[var(--text-strong)] hover:text-[#0e7468]"
            >
              <Shield size={17} strokeWidth={1.8} aria-hidden="true" />
              {ar ? "الاسترجاع والاستبدال" : "Returns & Exchanges"}
            </Link>
            <Link
              href={`/${locale}/shop#catalog-search` as Route}
              onClick={() => setMobileNavOpen(false)}
              className="flex min-h-11 items-center gap-3 text-xs font-semibold text-[var(--text-strong)] hover:text-[#0e7468]"
            >
              <Search size={17} strokeWidth={1.8} aria-hidden="true" />
              {labels.search}
            </Link>
            <a
              href="https://wa.me/201096733209"
              target="_blank"
              rel="noreferrer"
              className="flex min-h-11 items-center gap-3 text-xs font-semibold text-[#073b36] hover:text-[#0e7468]"
            >
              <MessageCircle size={17} strokeWidth={1.8} aria-hidden="true" />
              {labels.whatsapp}
            </a>
            <a
              href="https://www.instagram.com/scrubvibe_egy/"
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                trackStoreEvent("instagram_click");
                setMobileNavOpen(false);
              }}
              className="flex min-h-11 items-center gap-3 text-xs font-semibold text-[var(--text-strong)] hover:text-[#0e7468]"
            >
              <span>📷</span>
              {t.nav[4]}
            </a>
          </div>
        </div>

        {/* Drawer Footer with Language Selector */}
        <div className="border-t border-[var(--border-subtle)] bg-[var(--surface-canvas)] p-5">
          <Link
            href={`/${other}` as Route}
            onClick={() => setMobileNavOpen(false)}
            className="flex min-h-12 w-full items-center justify-center rounded-xs border border-[var(--border-subtle)] bg-white text-xs font-bold uppercase tracking-[.14em] text-[var(--text-strong)] hover:border-[#0e7468]"
          >
            {other === "ar" ? "تغيير إلى اللغة العربية" : "Switch to English"}
          </Link>
        </div>
      </aside>
    </>
  );
}
