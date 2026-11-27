"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";

import { Logo } from "./logo";
import { isActive, navLinks } from "./nav-links";

type NavProps = {
  /** Signed-in user, shown as an avatar. Without it, the nav shows a "Log in" link. */
  user?: { name: string } | null;
  /** Forces the current page (design system page only). Defaults to the URL. */
  currentPath?: string;
  className?: string;
};

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber";

/** Main navigation bar (Figma: Nav). The active tab follows the current URL. */
export function Nav({ user, currentPath, className }: NavProps) {
  const t = useTranslations("nav");
  // Path without the language: /fr/browse → /browse.
  const urlPath = usePathname();
  const pathname = currentPath ?? urlPath;

  return (
    <header
      className={["border-b border-white/8 bg-[rgba(10,13,31,0.55)] backdrop-blur-[8px]", className]
        .filter(Boolean)
        .join(" ")}
    >
      <nav
        aria-label={t("label")}
        className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-5 gap-y-3 px-4 py-4 sm:h-[72px] sm:flex-nowrap sm:px-10 sm:py-0"
      >
        <Link href="/" aria-label={t("logoLabel")} className={`shrink-0 rounded-xl ${focusRing}`}>
          <Logo />
        </Link>

        <ul className="order-last flex w-full shrink-0 gap-0.5 overflow-x-auto rounded-full border border-white/10 bg-white/5 p-1 sm:order-none sm:w-auto">
          {navLinks.map(({ href, label }) => {
            const active = isActive(href, pathname);
            return (
              <li key={href} className="flex-1 sm:flex-none">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "block rounded-full px-3.5 py-2 text-center text-sm font-medium whitespace-nowrap transition-colors motion-reduce:transition-none",
                    focusRing,
                    active ? "text-night bg-white" : "text-muted hover:text-text hover:bg-white/8",
                  ].join(" ")}
                >
                  {t(label)}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/browse"
            aria-label={t("search")}
            className={`text-text grid size-10 place-items-center rounded-full border border-white/10 bg-white/7 transition-colors hover:bg-white/12 motion-reduce:transition-none ${focusRing}`}
          >
            <Search aria-hidden="true" size={18} strokeWidth={2.2} />
          </Link>

          {user ? (
            <Link
              href="/account"
              aria-label={t("account", { name: user.name })}
              className={`from-red to-amber grid size-10 place-items-center rounded-full bg-linear-[103deg] to-70% text-[15px] font-bold text-white ${focusRing}`}
            >
              <span aria-hidden="true">{initial(user.name)}</span>
            </Link>
          ) : (
            <Link
              href="/sign-in"
              className={`text-night grid h-10 place-items-center rounded-full bg-white px-4 text-sm font-bold ${focusRing}`}
            >
              {t("logIn")}
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}

function initial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}
