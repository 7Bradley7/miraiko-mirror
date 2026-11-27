import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";
import * as rootParams from "next/root-params";

import { routing } from "./routing";

/**
 * Language and messages of the current request. The language comes from the [locale]
 * segment of the URL; code that runs outside a page (emails) passes it explicitly.
 */
export default getRequestConfig(async ({ locale }) => {
  if (!locale) {
    const value = await rootParams.locale();
    if (!hasLocale(routing.locales, value)) notFound();
    locale = value;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
