"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { useBackdropWindow } from "./ambient";

/** Space left between the cards and the bottom of the stuck bar. */
const WINDOW_MARGIN = 16;

/**
 * Keeps the search and the filters of the Browse page on screen while the cards scroll.
 *
 * Once stuck, the bar stays transparent, under the sticky menu with some room above it, so
 * the banner stays visible between the menu and the bar. The page then shows the banner again over
 * the cards, from the top of the screen down to just under the bar (see AmbientPage): the
 * cards disappear under the bar instead of showing through it.
 */
export function StickyBar({ children }: { children: ReactNode }) {
  const marker = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  const setWindow = useBackdropWindow();

  // Stuck when the marker just above the bar has gone above the bar's sticky position
  // (which depends on the menu's height, so it is read again on every check).
  useEffect(() => {
    const target = marker.current;
    const element = bar.current;
    if (!target || !element) return;
    const check = () => {
      const top = parseFloat(getComputedStyle(element).top) || 0;
      setStuck(target.getBoundingClientRect().top < top);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);

  // While stuck, the window goes down to just under the bar, even if the bar changes size.
  useEffect(() => {
    const element = bar.current;
    if (!stuck || !element) {
      setWindow(null);
      return;
    }
    const update = () => setWindow(element.getBoundingClientRect().bottom + WINDOW_MARGIN);
    update();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(element);
    window.addEventListener("resize", update);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", update);
      setWindow(null);
    };
  }, [stuck, setWindow]);

  return (
    <>
      <div ref={marker} aria-hidden="true" className="h-px" />
      <div
        ref={bar}
        data-stuck={stuck}
        // Above the window (z-10), so the bar stays visible over it.
        // Under the sticky menu (--nav-h, see StickyNav), with room above to see the banner.
        className="group/bar sticky top-[calc(var(--nav-h,72px)+0.75rem)] z-20 pt-2.5 pb-7 data-[stuck=true]:pb-0 sm:top-[calc(var(--nav-h,72px)+min(24vh,230px))]"
      >
        {children}
      </div>
    </>
  );
}
