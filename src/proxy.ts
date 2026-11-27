import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

/**
 * Sends every visitor to a URL with a language: /browse → /en/browse or /fr/browse,
 * chosen from the language cookie, then the browser's languages, then English.
 */
export default createMiddleware(routing);

export const config = {
  // Everything except the API, Next.js and Vercel internals, and files (anything with a dot).
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
