"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Keeps the site menu at the top of the screen on the Browse page, so the user can change
 * page without scrolling back up. Publishes its height as the --nav-h CSS variable: the
 * sticky search bar sits just under it, on phones (two rows) as on computers (one row).
 */
export function StickyNav({ children }: { children: ReactNode }) {
  const nav = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = nav.current;
    if (!element) return;
    const root = document.documentElement;
    const update = () => root.style.setProperty("--nav-h", `${element.offsetHeight}px`);
    update();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(element);
    return () => {
      observer?.disconnect();
      root.style.removeProperty("--nav-h");
    };
  }, []);

  // Above the search bar (z-20) and the window over the cards (z-10).
  return (
    <div ref={nav} className="sticky top-0 z-30">
      {children}
    </div>
  );
}
