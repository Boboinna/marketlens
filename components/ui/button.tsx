import type { ButtonHTMLAttributes } from "react";

export const buttonClass = (variant: "primary" | "ghost" = "primary", full = false) =>
  `inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-[15px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
    variant === "primary" ? "bg-tx text-bg hover:bg-white" : "border border-[#3a434e] text-tx hover:bg-s2"
  } ${full ? "w-full" : ""}`;

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost"; full?: boolean };

export function Button({ variant = "primary", full, className = "", ...p }: Props) {
  return <button {...p} className={`${buttonClass(variant, full)} ${className}`} />;
}
