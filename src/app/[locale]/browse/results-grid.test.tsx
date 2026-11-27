import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { MediaSummary } from "@/lib/anilist/catalog";
import { renderWithIntl } from "@/test/render";

import { loadMoreResults } from "./actions";
import { AmbientPage } from "./ambient";
import { cardSubtitle, titleHref } from "./cards";
import { ResultsGrid } from "./results-grid";

vi.mock("./actions", () => ({ loadMoreResults: vi.fn() }));

function media(id: number, title: string): MediaSummary {
  return {
    id,
    type: "ANIME",
    title,
    nativeTitle: null,
    format: "TV",
    status: "FINISHED",
    year: 2023,
    length: 12,
    averageScore: 80,
    coverUrl: `https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/${id}.jpg`,
    bannerUrl: null,
    coverColor: "#e4a15d",
    genres: [],
    isAdult: false,
  };
}

/** Lets the test say when the end of the list "comes into view". */
let showEnd: () => void = () => {};

class FakeIntersectionObserver {
  constructor(private callback: IntersectionObserverCallback) {}
  observe() {
    showEnd = () =>
      this.callback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      );
  }
  disconnect() {}
}

const filters = { query: "frieren" };

describe("ResultsGrid", () => {
  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
    vi.mocked(loadMoreResults).mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the first page as linked cards", () => {
    renderWithIntl(
      <ResultsGrid
        initial={{ items: [media(1, "Frieren")], page: 1, hasNextPage: false }}
        filters={filters}
      />,
    );
    expect(screen.getByRole("link", { name: /Frieren/ })).toHaveAttribute("href", "/en/anime/1");
    expect(screen.getByText("TV · 2023")).toBeInTheDocument();
    expect(screen.getByText("That's everything.")).toBeInTheDocument();
  });

  it("loads the next page when the end of the list comes into view, without duplicates", async () => {
    vi.mocked(loadMoreResults).mockResolvedValue({
      items: [media(2, "Mushishi"), media(3, "Natsume")],
      hasNextPage: false,
    });
    renderWithIntl(
      <ResultsGrid
        initial={{ items: [media(1, "Frieren"), media(2, "Mushishi")], page: 1, hasNextPage: true }}
        filters={filters}
      />,
    );

    await act(async () => showEnd());

    expect(loadMoreResults).toHaveBeenCalledWith(filters, 2);
    expect(screen.getAllByRole("link")).toHaveLength(3);
    expect(screen.getByRole("link", { name: /Natsume/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Load more" })).not.toBeInTheDocument();
  });

  it("explains an AniList limit and lets the user try again", async () => {
    vi.mocked(loadMoreResults).mockResolvedValueOnce({
      problem: { kind: "rateLimited", retryAfterSeconds: 30 },
    });
    renderWithIntl(
      <ResultsGrid
        initial={{ items: [media(1, "Frieren")], page: 1, hasNextPage: true }}
        filters={filters}
      />,
    );

    await act(async () => showEnd());
    expect(screen.getByRole("status")).toHaveTextContent("Try again in 30 seconds");

    vi.mocked(loadMoreResults).mockResolvedValueOnce({
      items: [media(4, "Mob Psycho")],
      hasNextPage: true,
    });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Try again" })));

    expect(screen.getByRole("link", { name: /Mob Psycho/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Load more" })).toBeInTheDocument();
  });
});

describe("ResultsGrid and the page background", () => {
  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts on the first cover, then keeps the hovered one", () => {
    renderWithIntl(
      <AmbientPage>
        <ResultsGrid
          initial={{
            items: [media(1, "Frieren"), media(2, "Mushishi")],
            page: 1,
            hasNextPage: false,
          }}
          filters={filters}
        />
      </AmbientPage>,
    );
    const lastCover = () =>
      [...screen.getByTestId("ambient").querySelectorAll("[data-cover]")]
        .at(-1)
        ?.getAttribute("data-cover");

    expect(lastCover()).toContain("/1.jpg");

    fireEvent.pointerEnter(screen.getByRole("link", { name: /Mushishi/ }).closest("div")!);
    // Regression: the first cover used to come back right after every change.
    expect(lastCover()).toContain("/2.jpg");
  });
});

describe("card helpers", () => {
  it("links anime and manga to their own pages", () => {
    expect(titleHref({ id: 1, type: "ANIME" })).toBe("/anime/1");
    expect(titleHref({ id: 2, type: "MANGA" })).toBe("/manga/2");
  });

  it("skips unknown formats and missing years", () => {
    const label = (format: string) => format.toLowerCase();
    expect(cardSubtitle({ format: "MOVIE", year: null }, label)).toBe("movie");
    expect(cardSubtitle({ format: "WEIRD", year: 2001 }, label)).toBe("2001");
  });
});
