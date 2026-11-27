import "server-only";

import { anilistRequest, type AniListRequestOptions } from "./client";

/** The AniList account behind a token, in the shape Better Auth expects (MRK-32). */
export type AniListUserInfo = {
  id: string;
  name: string;
  image: string | undefined;
  /** AniList never shares the email address: Miraiko keeps the one of the Miraiko account. */
  email: null;
  emailVerified: false;
};

type ViewerData = {
  Viewer?: { id: number; name: string; avatar?: { medium?: string | null } | null } | null;
};

const VIEWER_QUERY = "query { Viewer { id name avatar { medium } } }";

/**
 * Reads the AniList account that owns `accessToken` (GraphQL `Viewer` query).
 * Returns null when AniList refuses the token or does not answer as expected.
 * Never cached: it runs once, when the user links AniList.
 */
export async function fetchAniListViewer(
  accessToken: string,
  options: Omit<AniListRequestOptions, "accessToken"> = {},
): Promise<AniListUserInfo | null> {
  let data: ViewerData | null;
  try {
    data = await anilistRequest<ViewerData>(VIEWER_QUERY, {}, { ...options, accessToken });
  } catch {
    return null;
  }

  const viewer = data?.Viewer;
  if (!viewer) return null;

  return {
    id: String(viewer.id),
    name: viewer.name,
    image: viewer.avatar?.medium ?? undefined,
    email: null,
    emailVerified: false,
  };
}
