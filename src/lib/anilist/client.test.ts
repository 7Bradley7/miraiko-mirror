// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ANILIST_GRAPHQL_URL,
  anilistRequest,
  resetRateLimitPause,
  retryAfterSeconds,
} from "./client";
import { AniListError, AniListRateLimitError } from "./errors";

function reply(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers });
}

const noWait = vi.fn(async () => {});

beforeEach(() => {
  resetRateLimitPause();
});

describe("anilistRequest", () => {
  it("sends the query and its variables to AniList and returns the data", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => reply({ data: { Media: { id: 1 } } }));

    const data = await anilistRequest("query { Media { id } }", { id: 1 }, { fetchImpl });

    expect(data).toEqual({ Media: { id: 1 } });
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe(ANILIST_GRAPHQL_URL);
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({
      query: "query { Media { id } }",
      variables: { id: 1 },
    });
    expect(new Headers(init?.headers).has("authorization")).toBe(false);
  });

  it("sends the user's token only when given one", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => reply({ data: {} }));
    await anilistRequest("query { Viewer { id } }", {}, { fetchImpl, accessToken: "abc" });

    const init = fetchImpl.mock.calls[0]![1];
    expect(new Headers(init?.headers).get("authorization")).toBe("Bearer abc");
  });

  it("waits and tries once more when AniList asks for a short pause", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(reply({}, 429, { "Retry-After": "2" }))
      .mockResolvedValueOnce(reply({ data: { ok: true } }));
    const sleep = vi.fn(async () => {});

    expect(await anilistRequest("query", {}, { fetchImpl, sleep })).toEqual({ ok: true });
    expect(sleep).toHaveBeenCalledWith(2000);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("gives up with the waiting time when the limit is reached for longer", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => reply({}, 429, { "Retry-After": "45" }));

    const error = await anilistRequest("query", {}, { fetchImpl, sleep: noWait }).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(AniListRateLimitError);
    expect((error as AniListRateLimitError).retryAfterSeconds).toBe(45);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("does not retry twice in a row", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => reply({}, 429, { "Retry-After": "1" }));

    await expect(anilistRequest("query", {}, { fetchImpl, sleep: noWait })).rejects.toThrow(
      AniListRateLimitError,
    );
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("stops calling AniList until its timeout ends", async () => {
    const limited = vi.fn<typeof fetch>(async () => reply({}, 429, { "Retry-After": "60" }));
    await expect(anilistRequest("query", {}, { fetchImpl: limited })).rejects.toThrow(
      AniListRateLimitError,
    );

    const next = vi.fn<typeof fetch>(async () => reply({ data: { ok: true } }));
    const error = await anilistRequest("query", {}, { fetchImpl: next }).catch(
      (caught: unknown) => caught,
    );
    expect(error).toBeInstanceOf(AniListRateLimitError);
    expect((error as AniListRateLimitError).retryAfterSeconds).toBeGreaterThan(55);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns null when AniList does not know the requested title", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      reply({ data: { Media: null }, errors: [{ message: "Not Found.", status: 404 }] }, 404),
    );
    expect(await anilistRequest("query", {}, { fetchImpl })).toBeNull();
  });

  it("throws AniList's error messages", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      reply({ errors: [{ message: "Invalid token" }] }, 400),
    );

    await expect(anilistRequest("query", {}, { fetchImpl })).rejects.toThrow(
      new AniListError("Invalid token", 400),
    );
  });

  it("throws when AniList is down or unreachable", async () => {
    const down = vi.fn<typeof fetch>(async () => new Response("Bad gateway", { status: 502 }));
    await expect(anilistRequest("query", {}, { fetchImpl: down })).rejects.toMatchObject({
      status: 502,
    });

    const offline = vi.fn<typeof fetch>(async () => {
      throw new TypeError("fetch failed");
    });
    await expect(anilistRequest("query", {}, { fetchImpl: offline })).rejects.toMatchObject({
      status: 0,
    });
  });
});

describe("retryAfterSeconds", () => {
  it("reads Retry-After", () => {
    expect(retryAfterSeconds(new Headers({ "Retry-After": "30" }))).toBe(30);
  });

  it("falls back on X-RateLimit-Reset, then on a minute", () => {
    const inTenSeconds = String(Math.floor(Date.now() / 1000) + 10);
    const fromReset = retryAfterSeconds(new Headers({ "X-RateLimit-Reset": inTenSeconds }));
    expect(fromReset).toBeGreaterThanOrEqual(9);
    expect(fromReset).toBeLessThanOrEqual(10);

    expect(retryAfterSeconds(new Headers())).toBe(60);
  });
});
