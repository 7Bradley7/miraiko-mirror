import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

import { LocaleSwitcher } from "./locale-switcher";
import { Logo } from "./logo";

/** Columns of the footer. Titles and labels are keys of the "footer" messages. */
export const footerColumns = [
  {
    title: "explore",
    links: [
      { href: "/browse", label: "catalogue" },
      { href: "/for-you", label: "forYou" },
      { href: "/my-list", label: "myList" },
    ],
  },
  {
    title: "support",
    links: [
      { href: "/plus", label: "plus" },
      { href: "/donate", label: "donate" },
      { href: "/contact", label: "contact" },
    ],
  },
  {
    title: "legal",
    links: [
      { href: "/terms", label: "terms" },
      { href: "/privacy", label: "privacy" },
      { href: "/cookies", label: "cookies" },
      { href: "/legal", label: "legalNotice" },
    ],
  },
] as const;

/** Site footer (Figma: Footer), with the language choice. */
export function Footer({ className }: { className?: string }) {
  const t = useTranslations("footer");
  return (
    <footer
      className={["border-t border-white/8 bg-[rgba(10,13,31,0.7)]", className]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 pt-10 pb-12 sm:grid-cols-3 sm:px-10 lg:grid-cols-[1fr_200px_200px_200px]">
        <div className="flex flex-col items-start gap-2.5 sm:col-span-3 lg:col-span-1">
          <Logo />
          <p className="text-subtle text-[13px] leading-[1.45]">
            {t("tagline")}
            <br />
            {t.rich("poweredBy", {
              link: (chunks) => (
                <a
                  href="https://anilist.co"
                  className="hover:text-text focus-visible:outline-amber underline-offset-2 hover:underline focus-visible:outline-2"
                >
                  {chunks}
                </a>
              ),
            })}
          </p>
          <LocaleSwitcher className="mt-2" />
        </div>

        {footerColumns.map((column) => (
          <nav key={column.title} aria-label={t(column.title)}>
            <h2 className="text-muted text-[13px] leading-[1.45]">{t(column.title)}</h2>
            <ul className="mt-2 flex flex-col gap-2">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-text hover:text-red-hi focus-visible:outline-amber rounded text-[15px] leading-[1.55] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none"
                  >
                    {t(link.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
    </footer>
  );
}
