import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AmbientCard, AmbientPage, ambientReducer, isAniListCover, safeColor } from "./ambient";

const frieren = "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/frieren.jpg";
const mushishi = "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/mushishi.jpg";
const banner = "https://s4.anilist.co/file/anilistcdn/media/anime/banner/frieren.jpg";

describe("safeColor", () => {
  it("only lets plain hex colours through", () => {
    expect(safeColor("#e4a15d")).toBe("#e4a15d");
    expect(safeColor("red; background: url(x)")).toBeNull();
    expect(safeColor(null)).toBeNull();
  });
});

describe("isAniListCover", () => {
  it("only accepts covers from AniList's CDN", () => {
    expect(isAniListCover(frieren)).toBe(true);
    expect(isAniListCover("https://evil.example/cover.jpg")).toBe(false);
    expect(isAniListCover(null)).toBe(false);
  });
});

describe("ambientReducer (crossfade)", () => {
  const empty = { layers: [], shownKey: null, nextKey: 0 };
  const show = (src: string) => ({ type: "show" as const, cover: { src, color: null } });

  it("shows a new title only once its image has loaded", () => {
    let state = ambientReducer(empty, show(frieren));
    expect(state.shownKey).toBeNull();
    state = ambientReducer(state, { type: "loaded", key: 0 });
    expect(state.shownKey).toBe(0);
  });

  it("keeps the shown title while the next one loads, then removes it after the fade", () => {
    let state = ambientReducer(empty, show(frieren));
    state = ambientReducer(state, { type: "loaded", key: 0 });
    state = ambientReducer(state, show(mushishi));
    expect(state.layers.map((layer) => layer.src)).toEqual([frieren, mushishi]);
    expect(state.shownKey).toBe(0);

    state = ambientReducer(state, { type: "loaded", key: 1 });
    expect(state.shownKey).toBe(1);
    expect(state.layers).toHaveLength(2); // both visible during the crossfade

    state = ambientReducer(state, { type: "fadedIn", key: 1 });
    expect(state.layers.map((layer) => layer.src)).toEqual([mushishi]);
  });

  it("drops a title still loading when another one is hovered, and ignores late loads", () => {
    let state = ambientReducer(empty, show(frieren));
    state = ambientReducer(state, show(mushishi));
    expect(state.layers.map((layer) => layer.src)).toEqual([mushishi]);
    state = ambientReducer(state, { type: "loaded", key: 0 });
    expect(state.shownKey).toBeNull();
  });

  it("does not change anything when the shown title reports its load again", () => {
    let state = ambientReducer(empty, show(frieren));
    state = ambientReducer(state, { type: "loaded", key: 0 });
    // Regression: a new state here made the page render forever.
    expect(ambientReducer(state, { type: "loaded", key: 0 })).toBe(state);
  });

  it("ignores the same title twice", () => {
    const state = ambientReducer(empty, show(frieren));
    expect(ambientReducer(state, show(frieren))).toBe(state);
  });
});

describe("AmbientPage", () => {
  it("fades the hovered title's banner in once loaded; no image for titles without one", async () => {
    render(
      <AmbientPage>
        <AmbientCard cover={frieren} banner={banner} color={null}>
          <button type="button">Frieren</button>
        </AmbientCard>
        <AmbientCard cover={mushishi} color={null}>
          <button type="button">Mushishi</button>
        </AmbientCard>
      </AmbientPage>,
    );
    const hero = screen.getByTestId("ambient-hero");
    const background = screen.getByTestId("ambient");

    fireEvent.focus(screen.getByRole("button", { name: "Frieren" }));
    const bannerLayer = hero.querySelector('[data-hero="banner"]')!;
    expect(bannerLayer.querySelector("img")).toHaveAttribute("src", banner);
    expect(bannerLayer).toHaveClass("opacity-0");

    // next/image reports the load once the image is decoded, a moment later.
    fireEvent.load(bannerLayer.querySelector("img")!);
    await waitFor(() => expect(bannerLayer).toHaveClass("opacity-100"));
    expect(background.querySelector("[data-cover]")).toHaveAttribute("data-shown", "true");

    // Mushishi has no banner: only its colours, shown right away, and no image at the top.
    fireEvent.pointerEnter(screen.getByRole("button", { name: "Mushishi" }).parentElement!);
    const noBanner = hero.querySelector('[data-hero="none"]')!;
    await waitFor(() => expect(noBanner).toHaveClass("opacity-100"));
    expect(noBanner.querySelector("img")).toBeNull();
    expect(bannerLayer).toHaveClass("opacity-0");
  });
});
