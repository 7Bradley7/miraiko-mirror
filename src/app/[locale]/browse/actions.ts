"use server";

import { MAX_SEARCH_PAGE, searchCatalog, type MediaSummary } from "@/lib/anilist/catalog";
import { describeAniListError, type AniListProblem } from "@/lib/anilist/errors";
import { requireAniListUser } from "@/lib/session";

import type { BrowseFilters } from "./filters";

export type MoreResults =
  { items: MediaSummary[]; hasNextPage: boolean } | { problem: AniListProblem };

/**
 * Next page of results, for the infinite scroll of the Browse page. Same rules as the page:
 * signed-in users with AniList linked only. The arguments come from the browser: the
 * AniList client cleans the search and ignores unknown filters and pages.
 */
export async function loadMoreResults(filters: BrowseFilters, page: number): Promise<MoreResults> {
  await requireAniListUser();
  try {
    const result = await searchCatalog({
      query: String(filters?.query ?? ""),
      type: filters?.type,
      genre: filters?.genre,
      page,
    });
    // searchCatalog falls back to page 1 for a page out of range: never send it twice.
    if (result.page !== page) return { items: [], hasNextPage: false };
    return {
      items: result.items,
      hasNextPage: result.hasNextPage && page < MAX_SEARCH_PAGE,
    };
  } catch (error) {
    const problem = describeAniListError(error);
    if (!problem) throw error;
    return { problem };
  }
}
