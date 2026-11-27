import type { ComponentProps } from "react";

type BubbleProps = ComponentProps<"p">;

/**
 * Speech bubble for the mascot (Figma: Bubble). Its tail is the bottom-right corner,
 * so place it above and to the left of Miraiko. Wrap a word in
 * `<em>` to highlight it in red.
 */
export function Bubble({ className, ...props }: BubbleProps) {
  return (
    <p
      className={[
        "text-night [&_em]:text-red inline-block rounded-[18px] rounded-br-[4px] bg-white px-[18px] py-3 text-[17px] font-bold shadow-[0_14px_17px_rgba(255,59,59,0.35)] [&_em]:not-italic",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
