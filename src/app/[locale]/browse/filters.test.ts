import { describe, expect, it } from "vitest";

import { browseQuery, filtersKey, parseBrowseParams } from "./filters";

describe("parseBrowseParams", () => {
  it("reads the search and the filters from the URL", () => {
    expect(parseBrowseParams({ q: "  frieren ", type: "anime", genre: "slice-of-life" })).toEqual({
      query: "frieren",
      type: "ANIME",
      genre: "Slice of Life",
    });
  });

  it("ignores unknown or broken values", () => {
    expect(parseBrowseParams({ q: ["a", "b"], type: "movie", genre: "hentai" })).toEqual({
      query: "a",
      type: undefined,
      genre: undefined,
    });
    expect(parseBrowseParams({ q: "x".repeat(300) }).query).toHaveLength(100);
  });
});

describe("browseQuery", () => {
  const filters = parseBrowseParams({ q: "frieren", type: "manga", genre: "fantasy" });

  it("keeps the other filters when one changes", () => {
    expect(browseQuery(filters, { type: "ANIME" })).toEqual({
      q: "frieren",
      type: "anime",
      genre: "fantasy",
    });
  });

  it("removes a filter set to undefined", () => {
    expect(browseQuery(filters, { genre: undefined, type: undefined })).toEqual({ q: "frieren" });
  });
});

describe("filtersKey", () => {
  it("changes with any filter", () => {
    const base = parseBrowseParams({ q: "frieren" });
    expect(filtersKey(base)).toBe("q=frieren");
    expect(filtersKey({ ...base, genre: "Drama" })).toBe("q=frieren&genre=drama");
  });
});
