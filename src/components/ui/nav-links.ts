// Kept out of nav.tsx: a "use client" module only exposes components to Server Components,
// so plain values like this list must live in a regular module.

/** Tabs of the main navigation. `label` is a key of the "nav" messages. */
export const navLinks = [
  { href: "/", label: "home" },
  { href: "/browse", label: "browse" },
  { href: "/for-you", label: "forYou" },
  { href: "/my-list", label: "myList" },
] as const;

/** True when `href` is the current page or one of its sub-pages (paths without the language). */
export function isActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
