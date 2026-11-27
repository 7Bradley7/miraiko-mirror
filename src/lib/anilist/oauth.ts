/**
 * AniList as an OAuth provider for Better Auth (MRK-32).
 *
 * Miraiko is an AniList client (decision ADR-1): every Miraiko account must be linked to an
 * AniList account, and the user's list stays on AniList. AniList is only used to *link* an
 * account, never to create one: AniList does not share the user's email address.
 *
 * This file only holds constants, so client components can import it. The AniList account
 * behind a token is read in ./viewer.ts, through the AniList client (./client.ts).
 *
 * Docs: https://docs.anilist.co/guide/auth/authorization-code
 */

export const ANILIST_PROVIDER_ID = "anilist";

export const ANILIST_AUTHORIZATION_URL = "https://anilist.co/api/v2/oauth/authorize";
export const ANILIST_TOKEN_URL = "https://anilist.co/api/v2/oauth/token";
