import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

/**
 * Locale-aware replacements for next/link and next/navigation: links keep the current
 * language (/fr/browse), and usePathname returns the path without it (/browse).
 * Use these everywhere instead of the Next.js versions.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
