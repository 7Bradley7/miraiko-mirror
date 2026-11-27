/**
 * Errors of the AniList client (MRK-19). Pages can import them to show a clear message, for
 * example "AniList is busy, try again in a minute" on an AniListRateLimitError.
 */

/** Something went wrong on AniList's side, or AniList refused the query. */
export class AniListError extends Error {
  constructor(
    message: string,
    /** HTTP status of AniList's answer (0 when AniList could not be reached). */
    readonly status: number,
  ) {
    super(message);
    this.name = "AniListError";
  }
}

/** AniList's request limit is reached: try again after `retryAfterSeconds`. */
export class AniListRateLimitError extends AniListError {
  constructor(readonly retryAfterSeconds: number) {
    super(`AniList rate limit reached, retry in ${retryAfterSeconds}s`, 429);
    this.name = "AniListRateLimitError";
  }
}

export type AniListProblem =
  { kind: "rateLimited"; retryAfterSeconds: number } | { kind: "unavailable" };

/**
 * What went wrong with AniList, for a message to the user. Returns null for any other
 * error. Reads the error's name rather than its class: an error that went through a
 * cached function may come back as a plain Error with the same name and fields.
 */
export function describeAniListError(error: unknown): AniListProblem | null {
  if (!(error instanceof Error)) return null;
  if (error.name === "AniListRateLimitError") {
    const seconds = Number((error as Partial<AniListRateLimitError>).retryAfterSeconds);
    return { kind: "rateLimited", retryAfterSeconds: Number.isFinite(seconds) ? seconds : 60 };
  }
  if (error.name === "AniListError") return { kind: "unavailable" };
  return null;
}
