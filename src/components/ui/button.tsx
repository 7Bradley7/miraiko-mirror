import type { ComponentProps } from "react";

import { Link } from "@/i18n/navigation";

export type ButtonVariant = "primary" | "red" | "glass";

const base =
  "inline-flex h-12 items-center justify-center gap-2 rounded-[14px] px-[22px] text-[15px] font-bold whitespace-nowrap transition-[background-color,box-shadow,transform] duration-150 select-none active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none motion-reduce:active:translate-y-0";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-white text-night hover:bg-text",
  red: "bg-red text-white shadow-[0_10px_14px_rgba(255,59,59,0.4)] hover:bg-red-hi",
  glass:
    "border border-white/16 bg-white/10 text-white backdrop-blur-[6px] hover:border-white/24 hover:bg-white/15",
};

/** Class names of a button, for elements that must look like one. */
export function buttonClassName(variant: ButtonVariant = "primary", className?: string) {
  return [base, variants[variant], className].filter(Boolean).join(" ");
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
};

/** Action button (Figma: Button — Primary, Red, Glass). */
export function Button({ variant = "primary", className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClassName(variant, className)} {...props} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
};

/** Link styled as a button, for navigation (never for actions). */
export function ButtonLink({ variant = "primary", className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClassName(variant, className)} {...props} />;
}
