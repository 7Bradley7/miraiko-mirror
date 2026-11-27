type LogoProps = {
  size?: "sm" | "lg";
  className?: string;
};

/**
 * Miraiko logo: the red 次 ("next") mark and the wordmark (Figma: Logo/Miraiko, Logo/Miraiko Large).
 * The text "Miraiko" stays readable by screen readers; the kanji mark is decorative.
 */
export function Logo({ size = "sm", className }: LogoProps) {
  const large = size === "lg";
  return (
    <span
      className={["inline-flex items-center", large ? "flex-col gap-3.5" : "gap-2.5", className]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        aria-hidden="true"
        className={[
          "bg-red font-kanji grid place-items-center leading-none text-white shadow-[0_6px_18px_rgba(255,59,59,0.45)]",
          large
            ? "size-[120px] rounded-[34px] text-[68px]"
            : "h-[34px] w-[34px] rounded-[10px] text-[19px]",
        ].join(" ")}
      >
        次
      </span>
      <span
        className={[
          "font-display leading-none text-white uppercase",
          large ? "text-[64px] tracking-[0.1em]" : "text-[26px] tracking-[0.06em]",
        ].join(" ")}
      >
        Miraiko
      </span>
    </span>
  );
}
