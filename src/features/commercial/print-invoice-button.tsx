"use client";

import { Printer } from "lucide-react";

export function PrintInvoiceButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden inline-flex min-h-11 items-center gap-2 border border-black px-5 text-xs font-bold uppercase tracking-[.1em]"
    >
      <Printer size={16} />
      {label}
    </button>
  );
}
