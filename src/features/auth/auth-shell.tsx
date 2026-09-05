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
    <main className="mx-auto grid min-h-[70vh] max-w-[1200px] items-center gap-12 px-5 py-16 md:grid-cols-[.8fr_1.2fr] md:px-10 md:py-24">
      <section>
        <p className="eyebrow text-[#a6432b]">{eyebrow}</p>
        <h1 className="mt-4 max-w-md font-serif text-5xl leading-none md:text-7xl">
          {title}
        </h1>
        <p className="mt-6 max-w-sm text-sm leading-7 text-neutral-600">
          {body}
        </p>
      </section>
      <section className="border border-black/10 bg-white/35 p-6 shadow-[0_24px_80px_rgba(45,38,28,.08)] md:p-10">
        {children}
      </section>
    </main>
  );
}
