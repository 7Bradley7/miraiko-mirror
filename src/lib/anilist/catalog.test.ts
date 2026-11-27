// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import { getCatalogMedia, MAX_SEARCH_LENGTH, MAX_SEARCH_PAGE, searchCatalog } from "./catalog";
import { getMedia, searchMedia } from "./media";

// Outside Next.js, "use cache" is a plain string and cacheLife has nothing to configure.
vi.mock("next/cache", () => ({ cacheLife: vi.fn() }));
vi.mock("./media", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./media")>()),
  searchMedia: vi.fn(async () => ({ items: [], page: 1, hasNextPage: false })),
  getMedia: vi.fn(async () => null),
}));

beforeEach(() => {
  vi.mocked(searchMedia).mockClear();
  vi.mocked(getMedia).mockClear();
});

describe("searchCatalog", () => {
  it("cleans the search up, so the same search shares one cache entry", async () => {
    await searchCatalog({ query: "  Frieren   Beyond ", type: "ANIME" });
    expect(searchMedia).toHaveBeenCalledWith({
      query: "frieren beyond",
      type: "ANIME",
      genre: undefined,
      page: 1,
    });
  });

  it("cuts very long searches and ignores invalid pages", async () => {
    await searchCatalog({ query: "a".repeat(500), type: "MANGA", page: -3 });
    expect(searchMedia).toHaveBeenCalledWith({
      query: "a".repeat(MAX_SEARCH_LENGTH),
      type: "MANGA",
      genre: undefined,
      page: 1,
    });

    await searchCatalog({ query: "frieren", page: MAX_SEARCH_PAGE + 1 });
    expect(searchMedia).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }));
  });

  it("ignores unknown types and genres from the URL", async () => {
    await searchCatalog({
      query: "",
      type: "MOVIE" as never,
      genre: "Hentai" as never,
    });
    expect(searchMedia).toHaveBeenCalledWith({
      query: "",
      type: undefined,
      genre: undefined,
      page: 1,
    });
  });

  it("keeps a known genre", async () => {
    await searchCatalog({ query: "", genre: "Slice of Life" });
    expect(searchMedia).toHaveBeenCalledWith(expect.objectContaining({ genre: "Slice of Life" }));
  });
});

describe("getCatalogMedia", () => {
  it("does not ask AniList for an invalid id", async () => {
    expect(await getCatalogMedia(Number.NaN)).toBeNull();
    expect(await getCatalogMedia(0)).toBeNull();
    expect(getMedia).not.toHaveBeenCalled();
  });

  it("reads a valid id", async () => {
    await getCatalogMedia(154587);
    expect(getMedia).toHaveBeenCalledWith(154587);
  });
});
