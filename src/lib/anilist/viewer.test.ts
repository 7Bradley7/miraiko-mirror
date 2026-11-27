// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { ANILIST_GRAPHQL_URL } from "./client";
import { fetchAniListViewer } from "./viewer";

function answer(body: unknown, status = 200) {
  return vi.fn<typeof fetch>(async () => new Response(JSON.stringify(body), { status }));
}

describe("fetchAniListViewer", () => {
  it("asks AniList who owns the token", async () => {
    const fetchImpl = answer({ data: { Viewer: { id: 42, name: "aiko", avatar: null } } });
    await fetchAniListViewer("token-123", { fetchImpl });

    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe(ANILIST_GRAPHQL_URL);
    expect(init?.method).toBe("POST");
    expect(new Headers(init?.headers).get("authorization")).toBe("Bearer token-123");
    expect(String(init?.body)).toContain("Viewer");
  });

  it("returns the AniList account, without an email address", async () => {
    const fetchImpl = answer({
      data: {
        Viewer: { id: 42, name: "aiko", avatar: { medium: "https://img.anili.st/a.png" } },
      },
    });
    expect(await fetchAniListViewer("token", { fetchImpl })).toEqual({
      id: "42",
      name: "aiko",
      image: "https://img.anili.st/a.png",
      email: null,
      emailVerified: false,
    });
  });

  it("returns null when AniList refuses the token", async () => {
    const fetchImpl = answer({ errors: [{ message: "Invalid token" }] }, 401);
    expect(await fetchAniListViewer("expired", { fetchImpl })).toBeNull();
  });

  it("returns null when the answer has no Viewer", async () => {
    const fetchImpl = answer({ data: { Viewer: null } });
    expect(await fetchAniListViewer("token", { fetchImpl })).toBeNull();
  });
});
