"use client";

import { AlertCircle, RotateCcw } from "lucide-react";
import { useParams } from "next/navigation";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const params = useParams<{ locale?: string }>();
  const ar = params.locale === "ar";
  return (
    <main className="page-shell grid min-h-[65vh] place-items-center py-16 text-center">
      <div className="max-w-lg">
        <AlertCircle className="mx-auto text-[#a5472f]" size={34} strokeWidth={1.5} aria-hidden="true" />
        <p className="eyebrow mt-5 text-[#a5472f]">{ar ? "حدث خطأ" : "SOMETHING WENT WRONG"}</p>
        <h1 className="mt-3 text-balance font-serif text-5xl">{ar ? "لم نتمكن من تحميل هذه الصفحة" : "We couldn’t load this page."}</h1>
        <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">{ar ? "حاول مرة أخرى. ستظل بيانات حقيبتك محفوظة." : "Please try again. Your bag information will stay safely saved."}</p>
        <button type="button" onClick={reset} className="mx-auto mt-7 flex min-h-12 items-center gap-2 bg-[#073b36] px-7 text-xs font-bold uppercase tracking-[.14em] text-white hover:bg-[#0e7468]"><RotateCcw size={15} aria-hidden="true" />{ar ? "حاول مرة أخرى" : "Try again"}</button>
      </div>
    </main>
  );
}
