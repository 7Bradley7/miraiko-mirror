"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";

/**
 * Language choice: reloads the same page in the other language (/en/browse → /fr/browse).
 * next-intl remembers the choice in a cookie for the next visits.
 */
export function LocaleSwitcher({ className }: { className?: string }) {
  const t = useTranslations("localeSwitcher");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(next: AppLocale) {
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <div
      role="group"
      aria-label={t("label")}
      className={[
        "inline-flex gap-0.5 rounded-full border border-white/10 bg-white/5 p-1",
        pending && "opacity-60",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {routing.locales.map((value) => (
        <button
          key={value}
          type="button"
          lang={value}
          aria-pressed={value === locale}
          disabled={pending}
          onClick={() => value !== locale && choose(value)}
          className="text-muted hover:text-text aria-pressed:text-night focus-visible:outline-amber rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 aria-pressed:bg-white motion-reduce:transition-none"
        >
          {t(value)}
        </button>
      ))}
    </div>
  );
}
