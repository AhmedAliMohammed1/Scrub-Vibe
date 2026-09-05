"use client";

import Link from "next/link";
import { Heart, Menu, Search, ShoppingBag, UserRound } from "lucide-react";
import { copy, type Locale } from "@/lib/i18n";
import { useShop } from "./cart-provider";

export function Header({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const { cart, wishlist } = useShop();
  const other = locale === "en" ? "ar" : "en";
  return (
    <>
      <div className="bg-neutral-950 px-4 py-2 text-center text-[10px] font-medium uppercase tracking-[.18em] text-white">
        {t.freeShipping}
      </div>
      <header className="relative z-20 border-b border-black/10 bg-[#f6f2ea]/95 backdrop-blur">
        <div className="mx-auto flex h-17 max-w-[1600px] items-center justify-between px-4 md:px-8">
          <button className="md:hidden" aria-label="Open menu">
            <Menu size={21} />
          </button>
          <nav
            className="hidden items-center gap-6 md:flex"
            aria-label="Primary navigation"
          >
            {t.nav.slice(0, 4).map((item, i) => (
              <Link
                key={item}
                href={`/${locale}/shop?category=${["new", "women", "men", "kids"][i]}`}
                className="text-[11px] font-semibold uppercase tracking-[.13em] hover:opacity-55"
              >
                {item}
              </Link>
            ))}
          </nav>
          <Link
            href={`/${locale}`}
            className="absolute start-1/2 -translate-x-1/2 text-[25px] font-black tracking-[-.07em]"
            aria-label="NOVA home"
          >
            NOVA<span className="text-[#a6432b]">.</span>
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
                  ? `/${locale}/shop?category=accessories`
                  : i === 2
                    ? `/${locale}/shop?sale=1`
                    : `/${locale}/shop`
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
