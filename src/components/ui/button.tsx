import * as React from "react";
import { cn } from "@/lib/utils";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "outline" | "ghost";
};
export function Button({ className, variant = "solid", ...props }: Props) {
  return (
    <button
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 px-5 text-[11px] font-semibold uppercase tracking-[.16em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 disabled:opacity-45",
        variant === "solid" && "bg-neutral-950 text-white hover:bg-neutral-800",
        variant === "outline" &&
          "border border-current bg-transparent hover:bg-black/5",
        variant === "ghost" && "bg-transparent hover:bg-black/5",
        className,
      )}
      {...props}
    />
  );
}
