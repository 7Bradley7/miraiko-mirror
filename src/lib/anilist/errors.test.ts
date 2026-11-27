// @vitest-environment node

import { describe, expect, it } from "vitest";

import { AniListError, AniListRateLimitError, describeAniListError } from "./errors";

describe("describeAniListError", () => {
  it("gives the time to wait when AniList's limit is reached", () => {
    expect(describeAniListError(new AniListRateLimitError(42))).toEqual({
      kind: "rateLimited",
      retryAfterSeconds: 42,
    });
  });

  it("recognises an error that lost its class through the cache", () => {
    const copy = Object.assign(new Error("limit"), {
      name: "AniListRateLimitError",
      retryAfterSeconds: 30,
    });
    expect(describeAniListError(copy)).toEqual({ kind: "rateLimited", retryAfterSeconds: 30 });
  });

  it("reports AniList as unavailable for its other errors", () => {
    expect(describeAniListError(new AniListError("down", 502))).toEqual({ kind: "unavailable" });
  });

  it("ignores errors that have nothing to do with AniList", () => {
    expect(describeAniListError(new TypeError("bug"))).toBeNull();
    expect(describeAniListError("nope")).toBeNull();
  });
});
