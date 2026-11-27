"use client";

import Image from "next/image";
import { useRef, type PointerEvent } from "react";

import { Link } from "@/i18n/navigation";

type HoloCardProps = {
  /** Page of the title. */
  href: string;
  title: string;
  /** Second line, e.g. "Fantasy · Romance". */
  subtitle?: string;
  /** Badge in the top-left corner, e.g. "97% match". */
  match?: string;
  /** Cover image (3:4). Decorative: the title is already in the card. */
  coverSrc: string;
  /** Loads the cover early: use for the first cards visible on screen. */
  preload?: boolean;
  /**
   * Loads the cover straight from its site, without Next.js image optimisation. For AniList
   * covers: they are already small, and Miraiko keeps no copy of AniList data.
   */
  unoptimized?: boolean;
  className?: string;
};

/** Largest rotation, in degrees, when the pointer reaches an edge of the card. */
const MAX_TILT = 12;

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/**
 * Title card that comes alive on hover and keyboard focus (Figma: HoloCard). The rainbow
 * foil of the mockups was removed (too much, according to the first tests).
 * It fills its parent's width with a 3:4 ratio (210 × 280 in the mockups).
 *
 * Like a booster pack, the card lifts and comes closer on hover and focus, then turns
 * in 3D to follow the pointer, with the glare under the pointer. It settles back
 * slightly when pressed. The movement is off for touch and when the user asks for
 * reduced motion.
 */
export function HoloCard({
  href,
  title,
  subtitle,
  match,
  coverSrc,
  preload = false,
  unoptimized = false,
  className,
}: HoloCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null);

  // Updates CSS variables directly: no React render on every pointer move.
  function followPointer(event: PointerEvent<HTMLAnchorElement>) {
    const card = cardRef.current;
    if (!card || event.pointerType === "touch") return;
    const box = card.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width; // 0 = left edge, 1 = right edge
    const y = (event.clientY - box.top) / box.height; // 0 = top edge, 1 = bottom edge

    card.style.setProperty("--glare-x", `${x * 100}%`);
    card.style.setProperty("--glare-y", `${y * 100}%`);

    if (prefersReducedMotion()) return;
    // The side under the pointer leans away from the viewer.
    card.style.setProperty("--rotate-x", `${((0.5 - y) * 2 * MAX_TILT).toFixed(2)}deg`);
    card.style.setProperty("--rotate-y", `${((x - 0.5) * 2 * MAX_TILT).toFixed(2)}deg`);
  }

  function reset() {
    const card = cardRef.current;
    if (!card) return;
    for (const name of ["--glare-x", "--glare-y", "--rotate-x", "--rotate-y"]) {
      card.style.removeProperty(name);
    }
  }

  return (
    <Link
      ref={cardRef}
      href={href}
      onPointerMove={followPointer}
      onPointerLeave={reset}
      style={{ perspective: "900px" }}
      className={[
        "group/holo relative block aspect-[3/4] w-full rounded-2xl hover:z-10 focus-visible:z-10",
        "focus-visible:outline-amber focus-visible:outline-2 focus-visible:outline-offset-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        className={[
          "bg-night absolute inset-0 overflow-hidden rounded-2xl outline-1 -outline-offset-1 outline-transparent",
          "shadow-[0_16px_18px_rgba(0,0,0,0.45)] transition-[transform,box-shadow,outline-color] duration-200 ease-out",
          "[transform:translateY(var(--lift,0px))_scale(var(--zoom,1))_rotateX(var(--rotate-x,0deg))_rotateY(var(--rotate-y,0deg))]",
          "group-hover/holo:shadow-[0_28px_32px_rgba(255,59,59,0.38)] group-hover/holo:outline-white/35 group-hover/holo:[--lift:-8px] group-hover/holo:[--zoom:1.06]",
          "group-focus-visible/holo:shadow-[0_28px_32px_rgba(255,59,59,0.38)] group-focus-visible/holo:[--lift:-8px] group-focus-visible/holo:[--zoom:1.06]",
          "group-active/holo:[--zoom:1.03]",
          "motion-reduce:[transform:none] motion-reduce:transition-none",
        ].join(" ")}
      >
        <Image
          src={coverSrc}
          alt=""
          fill
          sizes="(min-width: 640px) 210px, 50vw"
          preload={preload}
          unoptimized={unoptimized}
          className="object-cover"
        />

        {/* Veil: keeps the title readable on any cover. */}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[54%] bg-linear-to-b from-[rgba(5,6,15,0)] via-[rgba(5,6,15,0.94)] via-60% to-[rgba(5,6,15,0.97)]"
        />

        {/* Glare that follows the pointer. */}
        <span
          aria-hidden="true"
          className="absolute inset-0 opacity-0 mix-blend-overlay transition-opacity duration-300 group-hover/holo:opacity-100 group-focus-visible/holo:opacity-100 motion-reduce:transition-none"
          style={{
            backgroundImage:
              "radial-gradient(circle 130px at var(--glare-x, 70%) var(--glare-y, 25%), rgba(255,255,255,0.8), rgba(255,255,255,0))",
          }}
        />

        {match && (
          <span className="text-mint absolute top-2.5 left-2.5 rounded-full bg-[rgba(5,6,15,0.72)] px-2 py-[3px] font-mono text-[11px] font-medium">
            {match}
          </span>
        )}

        <span className="absolute inset-x-3 bottom-3 flex flex-col gap-[3px]">
          <span className="font-display text-2xl leading-[0.92] text-white uppercase">{title}</span>
          {subtitle && <span className="text-muted text-[13px] leading-[1.45]">{subtitle}</span>}
        </span>
      </span>
    </Link>
  );
}
