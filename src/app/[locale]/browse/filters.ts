import type { MediaGenre, MediaType } from "@/lib/anilist/catalog";

/**
 * Search and filters of the Browse page, kept in the URL (/browse?q=frieren&type=anime&
 * genre=fantasy) so a search can be shared, bookmarked and reloaded. More results load
 * with the infinite scroll, so the page number is not in the URL.
 * Anything unknown in the URL is ignored.
 */

export type BrowseFilters = {
  query: string;
  type?: MediaType;
  genre?: MediaGenre;
};

type SearchParams = Record<string, string | string[] | undefined>;

/** Type filter: URL value → AniList type. */
export const TYPE_OPTIONS = [
  { slug: "anime", type: "ANIME", label: "anime" },
  { slug: "manga", type: "MANGA", label: "manga" },
] as const satisfies readonly { slug: string; type: MediaType; label: string }[];

/** Genre filter: URL value → AniList genre. `label` is a key of the "browse.genres" messages. */
export const GENRE_OPTIONS = [
  { slug: "action", genre: "Action", label: "action" },
  { slug: "adventure", genre: "Adventure", label: "adventure" },
  { slug: "comedy", genre: "Comedy", label: "comedy" },
  { slug: "drama", genre: "Drama", label: "drama" },
  { slug: "fantasy", genre: "Fantasy", label: "fantasy" },
  { slug: "mystery", genre: "Mystery", label: "mystery" },
  { slug: "romance", genre: "Romance", label: "romance" },
  { slug: "sci-fi", genre: "Sci-Fi", label: "sciFi" },
  { slug: "slice-of-life", genre: "Slice of Life", label: "sliceOfLife" },
  { slug: "sports", genre: "Sports", label: "sports" },
] as const satisfies readonly { slug: string; genre: MediaGenre; label: string }[];

/** Longest search text kept from the URL (the AniList client cuts it the same way). */
const MAX_QUERY_LENGTH = 100;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/** Reads the filters from the page's search params. */
export function parseBrowseParams(params: SearchParams): BrowseFilters {
  return {
    query: first(params.q).trim().slice(0, MAX_QUERY_LENGTH),
    type: TYPE_OPTIONS.find((option) => option.slug === first(params.type))?.type,
    genre: GENRE_OPTIONS.find((option) => option.slug === first(params.genre))?.genre,
  };
}

/** Search params of a link to the Browse page: the current filters with some of them changed. */
export function browseQuery(
  filters: BrowseFilters,
  changes: Partial<BrowseFilters>,
): Record<string, string> {
  const next = { ...filters, ...changes };
  const query: Record<string, string> = {};
  if (next.query) query.q = next.query;
  const type = TYPE_OPTIONS.find((option) => option.type === next.type);
  if (type) query.type = type.slug;
  const genre = GENRE_OPTIONS.find((option) => option.genre === next.genre);
  if (genre) query.genre = genre.slug;
  return query;
}

/** One string per combination of filters: a new search starts the results over. */
export function filtersKey(filters: BrowseFilters): string {
  return new URLSearchParams(browseQuery(filters, {})).toString();
}
