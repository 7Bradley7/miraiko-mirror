import "server-only";

import { cacheLife } from "next/cache";

import {
  getMedia,
  MEDIA_GENRES,
  searchMedia,
  type MediaDetails,
  type MediaGenre,
  type MediaPage,
  type MediaType,
  type SearchMediaInput,
} from "./media";

/**
 * Cached AniList catalogue, for pages (MRK-19). Pages read the catalogue from here, never
 * from ./media.ts directly.
 *
 * Temporary cache only (ADR-1, AniList's terms): an entry is refreshed in the background
 * after an hour and deleted after a day without visits. Nothing is ever copied into
 * Miraiko's database.
 *
 * `use cache: remote` shares the cache between all the server instances (on Vercel, each
 * request can land on a different one), so popular searches don't use up AniList's request
 * limit. The user's token is never part of these calls: the catalogue is public on AniList,
 * and a token in the arguments would end up in the cache key.
 *
 * Errors (AniListRateLimitError, AniListError) are never cached: the next visit tries again.
 */

// Pages build their filters and cards from these, without importing ./media.ts.
export { MEDIA_GENRES };
export type { MediaDetails, MediaGenre, MediaPage, MediaSummary, MediaType } from "./media";

/** Refreshed after an hour, deleted after a day without visits. */
const CATALOG_CACHE = { stale: 300, revalidate: 3600, expire: 86_400 } as const;

/** Longest search text sent to AniList. */
export const MAX_SEARCH_LENGTH = 100;

/** Last page a user can reach, so nobody pages through the whole catalogue. */
export const MAX_SEARCH_PAGE = 50;

/**
 * Searches the catalogue, or lists the trending titles when the text is empty. The text is
 * cleaned up first ("  Frieren " and "frieren" share one cache entry), and unknown types,
 * genres and pages are ignored.
 */
export async function searchCatalog({
  query,
  type,
  genre,
  page = 1,
}: SearchMediaInput): Promise<MediaPage> {
  const search = query.trim().replace(/\s+/g, " ").toLowerCase().slice(0, MAX_SEARCH_LENGTH);
  return cachedSearch(
    search,
    isMediaType(type) ? type : null,
    isMediaGenre(genre) ? genre : null,
    Number.isInteger(page) && page >= 1 && page <= MAX_SEARCH_PAGE ? page : 1,
  );
}

/** Reads one title. Returns null when it does not exist or is an adult title. */
export async function getCatalogMedia(id: number): Promise<MediaDetails | null> {
  if (!Number.isInteger(id) || id < 1) return null;
  return cachedMedia(id);
}

export function isMediaType(value: unknown): value is MediaType {
  return value === "ANIME" || value === "MANGA";
}

export function isMediaGenre(value: unknown): value is MediaGenre {
  return MEDIA_GENRES.includes(value as MediaGenre);
}

async function cachedSearch(
  query: string,
  type: MediaType | null,
  genre: MediaGenre | null,
  page: number,
) {
  "use cache: remote";
  cacheLife(CATALOG_CACHE);
  return searchMedia({ query, type: type ?? undefined, genre: genre ?? undefined, page });
}

async function cachedMedia(id: number) {
  "use cache: remote";
  cacheLife(CATALOG_CACHE);
  return getMedia(id);
}
