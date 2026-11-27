import { defineRouting } from "next-intl/routing";

/** Languages of the site. Every URL starts with one of them: /en/…, /fr/…. */
export const routing = defineRouting({
  locales: ["en", "fr"],
  defaultLocale: "en",
});

export type AppLocale = (typeof routing.locales)[number];
