"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

import { HoloCard } from "@/components/ui/holo-card";
import type { MediaPage, MediaSummary } from "@/lib/anilist/catalog";
import type { AniListProblem } from "@/lib/anilist/errors";

import { loadMoreResults } from "./actions";
import { AmbientCard, isAniListCover, useAmbientCover } from "./ambient";
import { cardSubtitle, gridClassName, titleHref } from "./cards";
import type { BrowseFilters } from "./filters";

/** Cards whose cover loads first (first row on a large screen). */
const PRELOADED_COVERS = 6;

/** Start loading the next page this far before the end of the list. */
const LOAD_AHEAD = "800px";

type ResultsGridProps = {
  /** First page, read on the server. */
  initial: MediaPage;
  filters: BrowseFilters;
};

/**
 * Grid of results with infinite scroll: the next page loads on its own when the end of the
 * list comes near. A "Load more" button does the same, for keyboards and screen readers,
 * and to try again after an AniList error.
 */
export function ResultsGrid({ initial, filters }: ResultsGridProps) {
  const t = useTranslations("browse");
  const setCover = useAmbientCover();
  const [items, setItems] = useState<MediaSummary[]>(initial.items);
  const [page, setPage] = useState(initial.page);
  const [hasNextPage, setHasNextPage] = useState(initial.hasNextPage);
  const [loading, setLoading] = useState(false);
  const [problem, setProblem] = useState<AniListProblem | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const busy = useRef(false);

  // Before any hover, the background takes the first result's cover. Runs only when the
  // results arrive (setCover never changes): running again later would bring the first
  // cover back over the one the user is hovering.
  const firstResult = initial.items[0];
  useEffect(() => {
    if (firstResult && isAniListCover(firstResult.coverUrl)) {
      setCover({
        src: firstResult.coverUrl,
        bannerSrc: firstResult.bannerUrl,
        color: firstResult.coverColor,
      });
    }
  }, [firstResult, setCover]);

  // New search or filter while scrolled down: go back to the first results, under the
  // sticky bar, instead of staying at the bottom of a shorter list.
  useEffect(() => {
    const heading = document.getElementById("browse-results-heading");
    if (heading && heading.getBoundingClientRect().top < 0) {
      const smooth = !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      heading.scrollIntoView({ block: "start", behavior: smooth ? "smooth" : "auto" });
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (busy.current || !hasNextPage) return;
    busy.current = true;
    setLoading(true);
    setProblem(null);
    try {
      const result = await loadMoreResults(filters, page + 1);
      if ("problem" in result) {
        setProblem(result.problem);
        return;
      }
      setItems((current) => {
        // AniList's order can shift between two pages: never show a title twice.
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...result.items.filter((item) => !seen.has(item.id))];
      });
      setPage(page + 1);
      setHasNextPage(result.hasNextPage);
    } catch {
      setProblem({ kind: "unavailable" });
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }, [filters, page, hasNextPage]);

  useEffect(() => {
    const target = sentinel.current;
    if (!target || !hasNextPage || problem || typeof IntersectionObserver === "undefined") {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadMore();
      },
      { rootMargin: LOAD_AHEAD },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMore, hasNextPage, problem]);

  return (
    <>
      <ul className={gridClassName}>
        {items.map((item, index) => (
          <li key={item.id}>
            <AmbientCard cover={item.coverUrl} banner={item.bannerUrl} color={item.coverColor}>
              <HoloCard
                href={titleHref(item)}
                title={item.title}
                subtitle={cardSubtitle(item, (format) => t(`formats.${format}`))}
                coverSrc={item.coverUrl ?? "/covers/missing.svg"}
                unoptimized
                preload={index < PRELOADED_COVERS}
              />
            </AmbientCard>
          </li>
        ))}
        {loading &&
          Array.from({ length: 6 }, (_, index) => (
            <li
              key={`loading-${index}`}
              aria-hidden="true"
              className="aspect-[3/4] animate-pulse rounded-2xl bg-white/6 motion-reduce:animate-none"
            />
          ))}
      </ul>

      <div ref={sentinel} className="flex flex-col items-center gap-3 pt-4" aria-live="polite">
        {loading && <p className="sr-only">{t("loading")}</p>}
        {problem && (
          <p role="status" className="text-muted max-w-md text-center text-[15px]">
            {problem.kind === "rateLimited"
              ? t("rateLimited", { seconds: problem.retryAfterSeconds })
              : t("unavailable")}
          </p>
        )}
        {hasNextPage && !loading && (
          <button
            type="button"
            onClick={() => void loadMore()}
            className="text-text focus-visible:outline-amber rounded-full border border-white/10 bg-white/4 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none"
          >
            {problem ? t("retry") : t("loadMore")}
          </button>
        )}
        {!hasNextPage && items.length > 0 && (
          <p className="text-subtle font-mono text-xs">{t("endOfResults")}</p>
        )}
      </div>
    </>
  );
}
