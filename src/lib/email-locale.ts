import { hasLocale } from "next-intl";

import { routing, type AppLocale } from "@/i18n/routing";

/** First segment of a path when it is one of our languages: "/fr/account" → "fr". */
function localeOfPath(path: string | null | undefined): AppLocale | undefined {
  const segment = path?.split("/")[1];
  return segment && hasLocale(routing.locales, segment) ? segment : undefined;
}

/**
 * Language of an email sent by Better Auth. Emails are sent from the /api/auth route, which
 * has no [locale] segment, so the language is found, in order, from:
 * 1. the page the link in the email opens (its callbackURL, e.g. /fr/reset-password);
 * 2. the page the request came from (the Referer header, e.g. /fr/sign-in);
 * 3. the browser's preferred languages;
 * 4. English.
 */
export function emailLocale({ url, request }: { url?: string; request?: Request }): AppLocale {
  if (url) {
    const link = new URL(url);
    const fromCallback = localeOfPath(link.searchParams.get("callbackURL"));
    if (fromCallback) return fromCallback;
  }

  const referer = request?.headers.get("referer");
  if (referer) {
    const fromReferer = localeOfPath(new URL(referer).pathname);
    if (fromReferer) return fromReferer;
  }

  const accepted = request?.headers.get("accept-language") ?? "";
  for (const part of accepted.split(",")) {
    const language = part.split(";")[0]?.trim().slice(0, 2).toLowerCase();
    if (language && hasLocale(routing.locales, language)) return language;
  }

  return routing.defaultLocale;
}
