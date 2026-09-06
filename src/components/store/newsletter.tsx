"use client";

import { ArrowRight } from "lucide-react";
import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { trackStoreEvent } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/client";

export function Newsletter({ locale }: { locale: Locale }) {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);
  return (
    <section className="bg-[#073b36] px-5 py-20 text-center text-white">
      <p className="eyebrow text-white/60">SCRUB VIBE NOTES</p>
      <h2 className="mx-auto mt-4 max-w-xl font-serif text-4xl md:text-5xl">
        {locale === "ar"
          ? "ابقَ قريباً من أحدث التصميمات."
          : "Fresh fits for your next shift."}
      </h2>
      <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-white/65">
        {locale === "ar"
          ? "سجل لمعرفة التصميمات الجديدة والألوان والعروض الخاصة."
          : "Sign up for new scrub designs, colours and private offers."}
      </p>
      <form
        className="mx-auto mt-8 flex max-w-md border-b border-white/50"
        onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          setError(false);
          const form = new FormData(event.currentTarget);
          const email = String(form.get("email") ?? "");
          const { error: subscriptionError } = await createClient().rpc(
            "subscribe_newsletter",
            { p_email: email, p_locale: locale },
          );
          setPending(false);
          if (subscriptionError) {
            setError(true);
            return;
          }
          trackStoreEvent("newsletter_signup");
          setSubmitted(true);
          event.currentTarget.reset();
        }}
      >
        <label htmlFor="email" className="sr-only">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder={
            locale === "ar" ? "بريدك الإلكتروني" : "Your email address"
          }
          className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-white/45"
        />
        <button aria-label="Subscribe" disabled={pending}>
          <ArrowRight className="rtl:rotate-180" />
        </button>
      </form>
      {submitted && (
        <p className="mt-4 text-xs text-white/75" role="status">
          {locale === "ar"
            ? "شكراً! سنخبرك بأحدث التصميمات."
            : "Thank you — you’ll hear about our newest designs."}
        </p>
      )}
      {error && (
        <p className="mt-4 text-xs text-[#ffd2c7]" role="alert">
          {locale === "ar"
            ? "تعذر التسجيل الآن. يرجى المحاولة مرة أخرى."
            : "We couldn’t subscribe you just now. Please try again."}
        </p>
      )}
    </section>
  );
}
