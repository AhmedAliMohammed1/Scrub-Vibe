import { ArrowRight } from "lucide-react";
import type { Locale } from "@/lib/i18n";

export function Newsletter({ locale }: { locale: Locale }) {
  return (
    <section className="bg-[#1e211a] px-5 py-20 text-center text-white">
      <p className="eyebrow text-white/60">NOVA NOTES</p>
      <h2 className="mx-auto mt-4 max-w-xl font-serif text-4xl md:text-5xl">
        {locale === "ar"
          ? "رسائل قليلة. أفكار جيدة فقط."
          : "Fewer emails. Better ideas."}
      </h2>
      <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-white/65">
        {locale === "ar"
          ? "سجل لمعرفة الإصدارات الجديدة والقصص والعروض الخاصة."
          : "Sign up for considered updates on new releases, stories, and private offers."}
      </p>
      <form className="mx-auto mt-8 flex max-w-md border-b border-white/50">
        <label htmlFor="email" className="sr-only">
          Email
        </label>
        <input
          id="email"
          type="email"
          placeholder={
            locale === "ar" ? "بريدك الإلكتروني" : "Your email address"
          }
          className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-white/45"
        />
        <button aria-label="Subscribe">
          <ArrowRight className="rtl:rotate-180" />
        </button>
      </form>
    </section>
  );
}
