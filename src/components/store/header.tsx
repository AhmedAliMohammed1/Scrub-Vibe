"use client";

import Link from "next/link";
import { Heart, Menu, Search, ShoppingBag, UserRound } from "lucide-react";
import { copy, type Locale } from "@/lib/i18n";
import { useShop } from "./cart-provider";
import { trackStoreEvent } from "@/lib/analytics";

export function Header({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const { cart, wishlist } = useShop();
  const other = locale === "en" ? "ar" : "en";
  return (
    <>
      <div className="bg-neutral-950 px-4 py-2 text-center text-[10px] font-medium uppercase tracking-[.18em] text-white">
        {t.freeShipping}
      </div>
      <header className="relative z-20 border-b border-black/10 bg-[#f5f7f5]/95 backdrop-blur">
        <div className="mx-auto flex h-17 max-w-[1600px] items-center justify-between px-4 md:px-8">
          <details className="group xl:hidden">
            <summary
              className="grid size-10 list-none place-items-center marker:hidden"
              aria-label="Open menu"
            >
              <Menu size={21} />
            </summary>
            <nav className="absolute inset-x-0 top-full border-y border-black/10 bg-[#f5f7f5] px-5 py-5 shadow-lg">
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
                    className="text-xs font-bold uppercase tracking-[.13em]"
                  >
                    {item}
                  </Link>
                ))}
                <Link
                  href="https://www.instagram.com/scrubvibe_egy/"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackStoreEvent("instagram_click")}
                  className="text-xs font-bold uppercase tracking-[.13em]"
                >
                  {t.nav[4]}
                </Link>
                <Link
                  href={`/${locale}#quality`}
                  className="text-xs font-bold uppercase tracking-[.13em]"
                >
                  {t.nav[5]}
                </Link>
                <Link
                  href={`/${locale}/shop?sale=1`}
                  className="text-xs font-bold uppercase tracking-[.13em] text-[#0e7468]"
                >
                  {t.nav[6]}
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
                className="text-[11px] font-semibold uppercase tracking-[.13em] hover:opacity-55"
              >
                {item}
              </Link>
            ))}
          </nav>
          <Link
            href={`/${locale}`}
            className="absolute start-1/2 -translate-x-1/2 text-[25px] font-black tracking-[-.07em]"
            aria-label="Scrub Vibe home"
          >
            <span className="tracking-[-.06em]">SCRUB</span>
            <span className="ms-1 font-light tracking-[-.05em] text-[#0e7468]">
              VIBE
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href={`/${locale}/shop#catalog-search`} aria-label="Search">
              <Search size={19} />
            </Link>
            <Link
              href={`/${locale}/account`}
              className="hidden sm:block"
              aria-label="Account"
            >
              <UserRound size={19} />
            </Link>
            <Link
              href={`/${locale}/wishlist`}
              className="relative"
              aria-label={`Wishlist with ${wishlist.length} items`}
            >
              <Heart size={19} />
              {wishlist.length > 0 && (
                <span className="counter">{wishlist.length}</span>
              )}
            </Link>
            <Link
              href={`/${locale}/cart`}
              className="relative"
              aria-label={`Cart with ${cart} items`}
            >
              <ShoppingBag size={19} />
              {cart > 0 && <span className="counter">{cart}</span>}
            </Link>
            <Link
              href={`/${other}`}
              className="ms-1 border-s border-black/20 ps-4 text-[11px] font-bold uppercase"
            >
              {other}
            </Link>
          </div>
        </div>
        <nav className="mx-auto hidden max-w-[1600px] justify-center gap-8 border-t border-black/5 py-3 lg:flex">
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
