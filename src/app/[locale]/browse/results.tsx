import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

import { Mascot } from "@/components/ui/mascot";
import { searchCatalog } from "@/lib/anilist/catalog";
import { describeAniListError } from "@/lib/anilist/errors";

import { gridClassName } from "./cards";
import type { BrowseFilters } from "./filters";
import { ResultsGrid } from "./results-grid";

/**
 * Results of the Browse page: the first page is read on the server through the cached
 * AniList data layer (MRK-19), the next ones load with the infinite scroll.
 * Shows a clear message when AniList is busy or down, instead of an error page.
 */
export async function BrowseResults({ filters }: { filters: BrowseFilters }) {
  const t = await getTranslations("browse");

  let result;
  try {
    result = await searchCatalog(filters);
  } catch (error) {
    const problem = describeAniListError(error);
    if (!problem) throw error;
    return (
      <Notice pose="sleep">
        {problem.kind === "rateLimited"
          ? t("rateLimited", { seconds: problem.retryAfterSeconds })
          : t("unavailable")}
      </Notice>
    );
  }

  const heading = filters.query ? t("resultsFor", { query: filters.query }) : t("resultsTrending");

  if (result.items.length === 0) {
    return (
      <section aria-label={heading}>
        <Notice pose="search">
          {filters.query ? t("noResults", { query: filters.query }) : t("noResultsFilters")}
        </Notice>
      </section>
    );
  }

  return (
    <section aria-labelledby="browse-results-heading" className="flex flex-col gap-6">
      <h2
        id="browse-results-heading"
        // Leaves room for the sticky search bar when the page scrolls back to the results.
        className="font-display scroll-mt-44 text-3xl text-white uppercase"
      >
        {heading}
      </h2>
      <ResultsGrid initial={result} filters={filters} />
    </section>
  );
}

function Notice({ pose, children }: { pose: "search" | "sleep"; children: string }) {
  return (
    <div
      role="status"
      className="flex flex-col items-center gap-4 rounded-2xl border border-white/8 bg-white/3 px-6 py-12 text-center"
    >
      <Mascot pose={pose} width={110} />
      <p className="text-muted max-w-md text-[17px] leading-[1.6]">{children}</p>
    </div>
  );
}

/** Placeholder cards while AniList answers. */
export function ResultsSkeleton() {
  const t = useTranslations("browse");
  return (
    <div role="status" className="flex flex-col gap-6">
      <span className="sr-only">{t("loading")}</span>
      <div aria-hidden="true" className="h-8 w-56 rounded-lg bg-white/6" />
      <ul aria-hidden="true" className={gridClassName}>
        {Array.from({ length: 12 }, (_, index) => (
          <li
            key={index}
            className="aspect-[3/4] animate-pulse rounded-2xl bg-white/6 motion-reduce:animate-none"
          />
        ))}
      </ul>
    </div>
  );
}
