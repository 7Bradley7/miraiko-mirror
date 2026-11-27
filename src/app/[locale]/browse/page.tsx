import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense, type ReactNode } from "react";

import { Footer } from "@/components/ui/footer";
import { Mascot } from "@/components/ui/mascot";
import { Nav } from "@/components/ui/nav";
import { Link } from "@/i18n/navigation";
import { requireAniListUser } from "@/lib/session";

import { AmbientPage } from "./ambient";
import {
  browseQuery,
  filtersKey,
  GENRE_OPTIONS,
  parseBrowseParams,
  TYPE_OPTIONS,
  type BrowseFilters,
} from "./filters";
import { BrowseResults, ResultsSkeleton } from "./results";
import { SearchBar } from "./search-bar";
import { StickyBar } from "./sticky-bar";
import { StickyNav } from "./sticky-nav";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("browse");
  // Only for signed-in users with AniList linked: nothing for search engines here.
  return { title: t("title"), robots: { index: false, follow: false } };
}

/**
 * Browse page (MRK-20, Figma: 02 Browse): search AniList's catalogue, filter by type and
 * genre. Without a search, it shows the trending titles. Miraiko is an AniList client
 * (ADR-1): the page is for signed-in users with AniList linked.
 */
export default function BrowsePage({ searchParams }: PageProps<"/[locale]/browse">) {
  const t = useTranslations("browse");
  return (
    <AmbientPage>
      {/* The session is read at request time: the nav and results stream in behind it. */}
      <StickyNav>
        <Suspense fallback={<Nav />}>
          <BrowseNav />
        </Suspense>
      </StickyNav>

      <main className="mx-auto w-full max-w-[1440px] px-4 pb-16 sm:px-10">
        {/* Above the window over the cards (z-10), so the title and the mascot scroll away
            normally instead of vanishing when the search bar sticks. */}
        <header className="relative z-[15] flex min-h-[min(46vh,420px)] items-end gap-8 pt-14">
          <div className="flex flex-1 flex-col gap-2.5 pb-6">
            <p className="text-amber font-mono text-xs tracking-[0.12em] uppercase">
              {t("eyebrow")}
            </p>
            <h1 className="font-display text-7xl leading-[0.84] text-white uppercase sm:text-[104px]">
              {t("heading")}
            </h1>
            <p className="text-muted max-w-[620px] text-[17px] leading-[1.6]">{t("intro")}</p>
          </div>
          <Mascot pose="search" width={190} className="hidden shrink-0 md:block" preload />
        </header>

        <Suspense fallback={<ResultsSkeleton />}>
          <BrowseSection searchParams={searchParams} />
        </Suspense>
      </main>

      <Footer />
    </AmbientPage>
  );
}

async function BrowseNav() {
  const user = await requireAniListUser();
  return <Nav user={{ name: user.name }} />;
}

async function BrowseSection({
  searchParams,
}: {
  searchParams: PageProps<"/[locale]/browse">["searchParams"];
}) {
  await requireAniListUser();
  const filters = parseBrowseParams(await searchParams);

  return (
    <>
      <BrowseControls filters={filters} />
      {/* A new search shows the placeholder cards again while AniList answers. */}
      <Suspense key={filtersKey(filters)} fallback={<ResultsSkeleton />}>
        <BrowseResults filters={filters} />
      </Suspense>
    </>
  );
}

function BrowseControls({ filters }: { filters: BrowseFilters }) {
  const t = useTranslations("browse");
  return (
    // Stays at the top of the screen while the cards scroll.
    <StickyBar>
      <div className="flex flex-col gap-3.5">
        <SearchBar defaultValue={filters.query} />

        {/* One scrollable row on phones, so the bar stays short; wraps on larger screens. */}
        <div className="-mx-4 flex [scrollbar-width:none] items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          <div
            role="group"
            aria-label={t("typeLabel")}
            className="flex shrink-0 gap-2 sm:shrink sm:flex-wrap"
          >
            <Chip active={!filters.type} href={browseQuery(filters, { type: undefined })}>
              {t("types.all")}
            </Chip>
            {TYPE_OPTIONS.map((option) => (
              <Chip
                key={option.slug}
                active={filters.type === option.type}
                href={browseQuery(filters, { type: option.type })}
              >
                {t(`types.${option.label}`)}
              </Chip>
            ))}
          </div>

          <span aria-hidden="true" className="mx-1 hidden h-[22px] w-px bg-white/12 sm:block" />

          <div
            role="group"
            aria-label={t("genreLabel")}
            className="flex shrink-0 gap-2 sm:shrink sm:flex-wrap"
          >
            {GENRE_OPTIONS.map((option) => {
              const active = filters.genre === option.genre;
              return (
                <Chip
                  key={option.slug}
                  active={active}
                  // Clicking the active genre again removes the filter.
                  href={browseQuery(filters, { genre: active ? undefined : option.genre })}
                >
                  {t(`genres.${option.label}`)}
                </Chip>
              );
            })}
          </div>
        </div>
      </div>
    </StickyBar>
  );
}

function Chip({
  active,
  href,
  children,
}: {
  active: boolean;
  href: Record<string, string>;
  children: ReactNode;
}) {
  return (
    <Link
      href={{ pathname: "/browse", query: href }}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={[
        "rounded-full border px-3.5 py-2 text-[13.5px] leading-none font-medium whitespace-nowrap transition-colors motion-reduce:transition-none",
        "focus-visible:outline-amber focus-visible:outline-2 focus-visible:outline-offset-2",
        active
          ? "text-night border-white bg-white"
          : "text-muted hover:text-text border-white/10 bg-white/4 group-data-[stuck=true]/bar:bg-[rgba(10,13,31,0.55)] group-data-[stuck=true]/bar:backdrop-blur-md hover:bg-white/10",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}
