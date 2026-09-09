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
      <section className="flex flex-col justify-end bg-[#073b36] p-7 text-white md:p-12">
        <p className="eyebrow text-[#81c5b8]">{eyebrow}</p>
        <h1 className="mt-4 max-w-md text-balance font-serif text-5xl leading-none md:text-7xl">
          {title}
        </h1>
        <p className="mt-6 max-w-sm text-sm leading-7 text-white/70">
          {body}
        </p>
      </section>
      <section className="flex items-center border border-black/10 bg-white p-6 md:p-12">
        <div className="w-full">
        {children}
        </div>
      </section>
    </main>
  );
}
