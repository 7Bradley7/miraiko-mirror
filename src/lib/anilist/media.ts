import "server-only";

import { anilistRequest, type AniListRequestOptions } from "./client";

/**
 * AniList catalogue (animes and mangas): search and title pages (MRK-19).
 *
 * These functions return Miraiko's own shapes (`MediaSummary`, `MediaDetails`), so the rest of
 * the site never depends on AniList's GraphQL schema. They are not cached: the cached
 * versions, used by pages, are in ./catalog.ts.
 */

export type MediaType = "ANIME" | "MANGA";

export type MediaSummary = {
  id: number;
  type: MediaType;
  /** English title when AniList has one, otherwise the romaji title. */
  title: string;
  /** Original title (usually Japanese), shown under the main title. */
  nativeTitle: string | null;
  format: string | null;
  status: string | null;
  year: number | null;
  /** Number of episodes (anime) or chapters (manga), when known. */
  length: number | null;
  /** Average AniList score, out of 100. */
  averageScore: number | null;
  coverUrl: string | null;
  /** Wide AniList banner (about 1900 × 400), when the title has one. */
  bannerUrl: string | null;
  /** Main colour of the cover (hex), used by the "Ambilight" effect. */
  coverColor: string | null;
  genres: string[];
  isAdult: boolean;
};

export type MediaDetails = MediaSummary & {
  /** Description as sent by AniList (may contain simple HTML such as <br> and <i>). */
  description: string | null;
  romajiTitle: string | null;
  studios: string[];
  siteUrl: string;
};

export type MediaPage = {
  items: MediaSummary[];
  page: number;
  hasNextPage: boolean;
};

/** Genres offered as filters (AniList's exact names). */
export const MEDIA_GENRES = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Sports",
] as const;

export type MediaGenre = (typeof MEDIA_GENRES)[number];

export type SearchMediaInput = {
  /** Text to search. Empty: the trending titles, to browse without searching. */
  query: string;
  /** Anime or manga. Leave it out for both. */
  type?: MediaType;
  genre?: MediaGenre;
  page?: number;
};

/** Results per search page. */
export const SEARCH_PAGE_SIZE = 20;

const MEDIA_SUMMARY_FIELDS = `
  id
  type
  title { romaji english native }
  format
  status
  seasonYear
  startDate { year }
  episodes
  chapters
  averageScore
  coverImage { large color }
  bannerImage
  genres
  isAdult
`;

const SEARCH_QUERY = `
  query SearchMedia(
    $search: String
    $type: MediaType
    $genre: String
    $sort: [MediaSort]
    $page: Int
    $perPage: Int
  ) {
    Page(page: $page, perPage: $perPage) {
      pageInfo { currentPage hasNextPage }
      media(search: $search, type: $type, genre: $genre, isAdult: false, sort: $sort) {
        ${MEDIA_SUMMARY_FIELDS}
      }
    }
  }
`;

const MEDIA_QUERY = `
  query MediaDetails($id: Int) {
    Media(id: $id) {
      ${MEDIA_SUMMARY_FIELDS}
      description(asHtml: true)
      siteUrl
      studios(isMain: true) { nodes { name } }
    }
  }
`;

type AniListMedia = {
  id: number;
  type: MediaType;
  title: { romaji: string | null; english: string | null; native: string | null };
  format: string | null;
  status: string | null;
  seasonYear: number | null;
  startDate: { year: number | null } | null;
  episodes: number | null;
  chapters: number | null;
  averageScore: number | null;
  coverImage: { large: string | null; color: string | null } | null;
  bannerImage: string | null;
  genres: string[] | null;
  isAdult: boolean | null;
};

type AniListMediaDetails = AniListMedia & {
  description: string | null;
  siteUrl: string;
  studios: { nodes: { name: string }[] } | null;
};

/**
 * Searches AniList's catalogue, or lists the trending titles when there is no text.
 * Adult titles are never returned.
 */
export async function searchMedia(
  { query, type, genre, page = 1 }: SearchMediaInput,
  options?: AniListRequestOptions,
): Promise<MediaPage> {
  const search = query.trim();
  // Only the filters in use are sent.
  const variables: Record<string, unknown> = {
    // With text: AniList's matches, most popular first ("attack" → Attack on Titan, not
    // "Attack!!"). AniList matches whole words, with a little tolerance for typos: it
    // cannot find "Frieren" from "fr" (and Miraiko keeps no copy of the catalogue to do it).
    sort: search ? ["POPULARITY_DESC"] : ["TRENDING_DESC", "POPULARITY_DESC"],
    page,
    perPage: SEARCH_PAGE_SIZE,
  };
  if (search) variables.search = search;
  if (type) variables.type = type;
  if (genre) variables.genre = genre;

  const data = await anilistRequest<{
    Page: { pageInfo: { currentPage: number; hasNextPage: boolean }; media: AniListMedia[] };
  }>(SEARCH_QUERY, variables, options);

  return {
    items: (data?.Page.media ?? []).map(toMediaSummary),
    page: data?.Page.pageInfo.currentPage ?? page,
    hasNextPage: data?.Page.pageInfo.hasNextPage ?? false,
  };
}

/** Reads one title. Returns null when it does not exist or is an adult title. */
export async function getMedia(
  id: number,
  options?: AniListRequestOptions,
): Promise<MediaDetails | null> {
  const data = await anilistRequest<{ Media: AniListMediaDetails | null }>(
    MEDIA_QUERY,
    { id },
    options,
  );
  const media = data?.Media;
  if (!media || media.isAdult) return null;

  return {
    ...toMediaSummary(media),
    description: media.description,
    romajiTitle: media.title.romaji,
    studios: media.studios?.nodes.map((studio) => studio.name) ?? [],
    siteUrl: media.siteUrl,
  };
}

function toMediaSummary(media: AniListMedia): MediaSummary {
  return {
    id: media.id,
    type: media.type,
    title: media.title.english ?? media.title.romaji ?? media.title.native ?? `#${media.id}`,
    nativeTitle: media.title.native,
    format: media.format,
    status: media.status,
    year: media.seasonYear ?? media.startDate?.year ?? null,
    length: (media.type === "ANIME" ? media.episodes : media.chapters) ?? null,
    averageScore: media.averageScore,
    coverUrl: media.coverImage?.large ?? null,
    bannerUrl: media.bannerImage ?? null,
    coverColor: media.coverImage?.color ?? null,
    genres: media.genres ?? [],
    isAdult: media.isAdult ?? false,
  };
}
