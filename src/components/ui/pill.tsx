import type { ComponentProps } from "react";

type PillProps = ComponentProps<"span">;

/** Small rounded label: genre, tag, filter (Figma: Pill). */
export function Pill({ className, ...props }: PillProps) {
  return (
    <span
      className={[
        "text-text inline-flex items-center rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-[13px] leading-[1.45] whitespace-nowrap",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
