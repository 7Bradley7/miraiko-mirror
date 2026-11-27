// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { getMedia, SEARCH_PAGE_SIZE, searchMedia } from "./media";

const frieren = {
  id: 154587,
  type: "ANIME",
  title: {
    romaji: "Sousou no Frieren",
    english: "Frieren: Beyond Journey's End",
    native: "葬送のフリーレン",
  },
  format: "TV",
  status: "FINISHED",
  seasonYear: 2023,
  startDate: { year: 2023 },
  episodes: 28,
  chapters: null,
  averageScore: 91,
  coverImage: {
    large: "https://img.anili.st/frieren.jpg",
    color: "#d6e4a1",
  },
  bannerImage: null,
  genres: ["Adventure", "Drama", "Fantasy"],
  isAdult: false,
};

function answer(data: unknown) {
  return vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ data }), { status: 200 }));
}

describe("searchMedia", () => {
  it("asks AniList for one page of non-adult results of the given type", async () => {
    const fetchImpl = answer({
      Page: { pageInfo: { currentPage: 2, hasNextPage: true }, media: [frieren] },
    });

    const result = await searchMedia({ query: " frieren ", type: "ANIME", page: 2 }, { fetchImpl });

    const { query, variables } = JSON.parse(String(fetchImpl.mock.calls[0]![1]?.body));
    expect(variables).toEqual({
      search: "frieren",
      type: "ANIME",
      sort: ["POPULARITY_DESC"],
      page: 2,
      perPage: SEARCH_PAGE_SIZE,
    });
    expect(query).toContain("isAdult: false");
    expect(result).toEqual({
      page: 2,
      hasNextPage: true,
      items: [
        {
          id: 154587,
          type: "ANIME",
          title: "Frieren: Beyond Journey's End",
          nativeTitle: "葬送のフリーレン",
          format: "TV",
          status: "FINISHED",
          year: 2023,
          length: 28,
          averageScore: 91,
          coverUrl: "https://img.anili.st/frieren.jpg",
          bannerUrl: null,
          coverColor: "#d6e4a1",
          genres: ["Adventure", "Drama", "Fantasy"],
          isAdult: false,
        },
      ],
    });
  });

  it("uses the romaji title and the chapters for a manga without an English title", async () => {
    const manga = {
      ...frieren,
      type: "MANGA",
      title: { romaji: "Sousou no Frieren", english: null, native: "葬送のフリーレン" },
      episodes: null,
      chapters: 140,
    };
    const fetchImpl = answer({
      Page: { pageInfo: { currentPage: 1, hasNextPage: false }, media: [manga] },
    });

    const { items } = await searchMedia({ query: "frieren", type: "MANGA" }, { fetchImpl });

    expect(items[0]).toMatchObject({ title: "Sousou no Frieren", length: 140 });
  });

  it("lists the trending titles when there is no text, with only the filters in use", async () => {
    const fetchImpl = answer({
      Page: { pageInfo: { currentPage: 1, hasNextPage: true }, media: [frieren] },
    });

    const { items } = await searchMedia({ query: "  ", genre: "Fantasy" }, { fetchImpl });

    const { variables } = JSON.parse(String(fetchImpl.mock.calls[0]![1]?.body));
    expect(variables).toEqual({
      genre: "Fantasy",
      sort: ["TRENDING_DESC", "POPULARITY_DESC"],
      page: 1,
      perPage: SEARCH_PAGE_SIZE,
    });
    expect(items).toHaveLength(1);
  });
});

describe("getMedia", () => {
  it("returns the title page details", async () => {
    const fetchImpl = answer({
      Media: {
        ...frieren,
        description: "An elf mage…",
        bannerImage: "https://img.anili.st/banner.jpg",
        siteUrl: "https://anilist.co/anime/154587",
        studios: { nodes: [{ name: "MADHOUSE" }] },
      },
    });

    expect(await getMedia(154587, { fetchImpl })).toMatchObject({
      id: 154587,
      title: "Frieren: Beyond Journey's End",
      romajiTitle: "Sousou no Frieren",
      description: "An elf mage…",
      bannerUrl: "https://img.anili.st/banner.jpg",
      studios: ["MADHOUSE"],
      siteUrl: "https://anilist.co/anime/154587",
    });
  });

  it("hides adult titles", async () => {
    const fetchImpl = answer({
      Media: {
        ...frieren,
        isAdult: true,
        description: null,
        bannerImage: null,
        siteUrl: "",
        studios: null,
      },
    });
    expect(await getMedia(1, { fetchImpl })).toBeNull();
  });

  it("returns null for a title AniList does not know", async () => {
    const fetchImpl = vi.fn<typeof fetch>(
      async () =>
        new Response(
          JSON.stringify({ data: { Media: null }, errors: [{ message: "Not Found." }] }),
          {
            status: 404,
          },
        ),
    );
    expect(await getMedia(999_999_999, { fetchImpl })).toBeNull();
  });
});
