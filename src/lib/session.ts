import "server-only";

import { getLocale } from "next-intl/server";
import { headers } from "next/headers";
import { cache } from "react";

import { redirect } from "@/i18n/navigation";
import { ANILIST_PROVIDER_ID } from "@/lib/anilist/oauth";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  /** True once the user has linked an AniList account (mandatory onboarding, MRK-32). */
  aniListLinked: boolean;
  /** Better Auth id of the AniList link, needed to unlink it. Null when not linked. */
  aniListAccountId: string | null;
};

/**
 * Data access layer for the signed-in user: reads and checks the session on the server,
 * then returns only what the UI needs. Redirects to the sign-in page (in the current
 * language) when signed out. Reads the request, so it must be called inside a <Suspense>.
 * Cached for the request: several components of one page can call it for one database read.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    // `return`: TypeScript does not see that next-intl's redirect never returns.
    return redirect({ href: "/sign-in", locale: await getLocale() });
  }

  const { id, name, email } = session.user;
  const aniListAccount = await db.account.findFirst({
    where: { userId: id, providerId: ANILIST_PROVIDER_ID },
    select: { id: true },
  });
  return {
    id,
    name,
    email,
    aniListLinked: aniListAccount !== null,
    aniListAccountId: aniListAccount?.id ?? null,
  };
});

/**
 * Same as getCurrentUser, for every page of the site itself (recommendations, lists,
 * search…): users who have not linked AniList yet are sent to the onboarding first.
 * Miraiko is an AniList client, so nothing works without an AniList account (ADR-1).
 */
export async function requireAniListUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user.aniListLinked) {
    return redirect({ href: "/onboarding", locale: await getLocale() });
  }
  return user;
}
