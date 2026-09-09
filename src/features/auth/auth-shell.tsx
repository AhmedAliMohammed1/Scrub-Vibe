import type { ReactNode } from "react";

export function AuthShell({
  eyebrow,
  title,
  body,
  children,
}: {
  eyebrow: string;
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto grid min-h-[72vh] max-w-[1200px] gap-0 px-5 py-10 md:grid-cols-[.9fr_1.1fr] md:px-10 md:py-20">
      <section className="flex flex-col justify-end border border-[var(--border-subtle)] md:border-e-0 rounded-t-xs md:rounded-tr-none md:rounded-s-xs bg-[#073b36] p-7 text-white shadow-subtle md:p-12">
        <p className="eyebrow text-[#81c5b8]">{eyebrow}</p>
        <h1 className="mt-4 max-w-md text-balance font-serif text-5xl leading-[1.08] md:text-7xl">
          {title}
        </h1>
        <p className="mt-6 max-w-sm text-sm leading-7 text-white/75">
          {body}
        </p>
      </section>
      <section className="flex items-center border border-[var(--border-subtle)] rounded-b-xs md:rounded-bl-none md:rounded-e-xs bg-[var(--surface-raised)] p-6 shadow-subtle md:p-12">
        <div className="w-full">
        {children}
        </div>
      </section>
    </main>
  );
}
