"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, Search, ShoppingBag, UserRound } from "lucide-react";
import { copy, type Locale } from "@/lib/i18n";
import { useShop } from "./cart-provider";
import { trackStoreEvent } from "@/lib/analytics";

export function Header({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const t = copy[locale];
  const { cart, wishlist } = useShop();
  const other = locale === "en" ? "ar" : "en";
  const labels =
    locale === "ar"
      ? {
          menu: "فتح القائمة",
          home: "الصفحة الرئيسية لسكراب فايب",
          search: "بحث",
          account: "الحساب",
          wishlist: `قائمة الأمنيات: ${wishlist.length}`,
          cart: `السلة: ${cart}`,
        }
      : {
          menu: "Open menu",
          home: "Scrub Vibe home",
          search: "Search",
          account: "Account",
          wishlist: `Wishlist with ${wishlist.length} items`,
          cart: `Cart with ${cart} item${cart === 1 ? "" : "s"}`,
        };
  if (pathname.includes("/admin")) return null;
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[#f6f7f4]/96 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-3 sm:h-18 sm:px-5 lg:px-8">
          <details className="group xl:hidden">
            <summary
              className="grid size-11 list-none place-items-center marker:hidden hover:bg-black/5"
              aria-label={labels.menu}
            >
              <Menu size={21} />
            </summary>
            <nav className="absolute inset-x-0 top-full border-y border-black/10 bg-[#f6f7f4] px-5 py-6 shadow-[0_18px_40px_rgba(7,59,54,.12)]">
              <div className="grid gap-4">
                {t.nav.slice(0, 4).map((item, i) => (
                  <Link
                    key={item}
                    href={
                      i === 0
                        ? `/${locale}/shop?category=new`
                        : i === 1
                          ? `/${locale}/shop?category=women`
                          : i === 2
                            ? `/${locale}/shop?category=men`
                            : `/${locale}/shop?q=lab+coat`
                    }
                    className="flex min-h-11 items-center border-b border-black/8 text-xs font-bold uppercase tracking-[.13em]"
                  >
                    {item}
                  </Link>
                ))}
                <Link
                  href="https://www.instagram.com/scrubvibe_egy/"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackStoreEvent("instagram_click")}
                  className="flex min-h-11 items-center border-b border-black/8 text-xs font-bold uppercase tracking-[.13em]"
                >
                  {t.nav[4]}
                </Link>
                <Link
                  href={`/${locale}#quality`}
                  className="flex min-h-11 items-center border-b border-black/8 text-xs font-bold uppercase tracking-[.13em]"
                >
                  {t.nav[5]}
                </Link>
                <Link
                  href={`/${locale}/shop?sale=1`}
                  className="flex min-h-11 items-center text-xs font-bold uppercase tracking-[.13em] text-[#0e7468]"
                >
                  {t.nav[6]}
                </Link>
                <Link href={`/${locale}/shop#catalog-search`} className="flex min-h-11 items-center gap-2 border-t border-black/8 text-xs font-bold uppercase tracking-[.13em]">
                  <Search size={16} aria-hidden="true" />{labels.search}
                </Link>
              </div>
            </nav>
          </details>
          <nav
            className="hidden items-center gap-6 xl:flex"
            aria-label="Primary navigation"
          >
            {t.nav.slice(0, 4).map((item, i) => (
              <Link
                key={item}
                href={
                  i === 0
                    ? `/${locale}/shop?category=new`
                    : i === 1
                      ? `/${locale}/shop?category=women`
                      : i === 2
                        ? `/${locale}/shop?category=men`
                        : `/${locale}/shop?q=lab+coat`
                }
                className="py-3 text-[11px] font-semibold uppercase tracking-[.13em] hover:text-[#0e7468]"
              >
                {item}
              </Link>
            ))}
          </nav>
          <Link
            href={`/${locale}`}
            className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[17px] font-black tracking-[-.07em] sm:text-[24px]"
            aria-label={labels.home}
          >
            <span className="tracking-[-.06em]">SCRUB</span>
            <span className="ms-1 font-light tracking-[-.05em] text-[#0e7468]">
              VIBE
            </span>
          </Link>
          <div className="flex items-center gap-0.5 sm:gap-2">
            <Link
              href={`/${locale}/shop#catalog-search`}
              className="hidden size-10 place-items-center hover:bg-black/5 min-[400px]:grid"
              aria-label={labels.search}
            >
              <Search size={19} aria-hidden="true" />
            </Link>
            <Link
              href={`/${locale}/account`}
              className="hidden size-10 place-items-center hover:bg-black/5 sm:grid"
              aria-label={labels.account}
            >
              <UserRound size={19} aria-hidden="true" />
            </Link>
            <Link
              href={`/${locale}/wishlist`}
              className="relative grid size-10 place-items-center hover:bg-black/5"
              aria-label={labels.wishlist}
            >
              <Heart size={19} aria-hidden="true" />
              {wishlist.length > 0 && (
                <span className="counter">{wishlist.length}</span>
              )}
            </Link>
            <Link
              href={`/${locale}/cart`}
              className="relative grid size-10 place-items-center hover:bg-black/5"
              aria-label={labels.cart}
            >
              <ShoppingBag size={19} aria-hidden="true" />
              {cart > 0 && <span className="counter">{cart}</span>}
            </Link>
            <Link
              href={`/${other}`}
              className="ms-0.5 flex h-9 items-center border-s border-black/20 ps-2 text-[10px] font-bold uppercase sm:ms-1 sm:ps-3"
            >
              {other}
            </Link>
          </div>
        </div>
        <nav className="mx-auto hidden max-w-[1440px] justify-center gap-8 border-t border-black/5 py-2.5 lg:flex">
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
        </nav>
      </header>
    </>
  );
}
