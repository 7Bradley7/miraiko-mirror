import "server-only";

import { AniListError, AniListRateLimitError } from "./errors";

export const ANILIST_GRAPHQL_URL = "https://graphql.anilist.co";

/**
 * The only place in Miraiko that talks to the AniList GraphQL API (MRK-19, decision ADR-1).
 * Every AniList request of the site goes through `anilistRequest`: it sends the query, reads
 * AniList's errors and respects its request limit.
 *
 * AniList's limit: 90 requests per minute (30 while the API is "degraded"), plus a burst
 * limiter. Going over it gives a one-minute timeout, and any request sent during that timeout
 * is refused too: after a 429, this server stops calling AniList until the timeout ends.
 *
 * Docs: https://docs.anilist.co/guide/graphql/ and https://docs.anilist.co/guide/rate-limiting
 */

export type AniListRequestOptions = {
  /** The user's AniList token, for queries about their account or their list. */
  accessToken?: string;
  /** Replaced in tests. */
  fetchImpl?: typeof fetch;
  /** Replaced in tests, so they don't really wait. */
  sleep?: (ms: number) => Promise<void>;
};

type GraphQLAnswer<T> = {
  data?: T | null;
  errors?: { message: string; status?: number }[];
};

/** Stop waiting for AniList after this long. */
const TIMEOUT_MS = 10_000;
/** On a 429, wait and try once more only if AniList asks for a short wait. */
const MAX_RETRY_WAIT_SECONDS = 3;
/** Used when a 429 comes without a usable Retry-After header (AniList's timeout is 1 min). */
const DEFAULT_RETRY_AFTER_SECONDS = 60;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Time (ms) until which this server instance does not call AniList, after a 429. Each
 * instance has its own: it avoids sending requests AniList would refuse anyway.
 */
let pausedUntil = 0;

/** Forgets the pause after a 429. Only for tests. */
export function resetRateLimitPause() {
  pausedUntil = 0;
}

/**
 * Sends one GraphQL query to AniList and returns its `data`.
 *
 * - 429 (request limit): waits and tries again once when AniList asks for at most a few
 *   seconds, otherwise throws `AniListRateLimitError` (with the time to wait) so the page can
 *   tell the user, and stops calling AniList until then.
 * - 404: returns null (AniList answers 404 when the requested media does not exist).
 * - Any other error: throws `AniListError`.
 */
export async function anilistRequest<T>(
  query: string,
  variables: Record<string, unknown> = {},
  { accessToken, fetchImpl = fetch, sleep = wait }: AniListRequestOptions = {},
): Promise<T | null> {
  const pauseLeft = pausedUntil - Date.now();
  if (pauseLeft > 0) throw new AniListRateLimitError(Math.ceil(pauseLeft / 1000));

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  const init: RequestInit = {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  };

  for (let attempt = 1; ; attempt++) {
    let response: Response;
    try {
      response = await fetchImpl(ANILIST_GRAPHQL_URL, {
        ...init,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (cause) {
      throw new AniListError(`AniList could not be reached: ${String(cause)}`, 0);
    }

    if (response.status === 429) {
      const retryAfter = retryAfterSeconds(response.headers);
      if (attempt === 1 && retryAfter <= MAX_RETRY_WAIT_SECONDS) {
        await sleep(retryAfter * 1000);
        continue;
      }
      pausedUntil = Date.now() + retryAfter * 1000;
      throw new AniListRateLimitError(retryAfter);
    }

    const answer = (await response.json().catch(() => ({}))) as GraphQLAnswer<T>;
    if (response.status === 404) return null;
    if (!response.ok || answer.errors?.length) {
      const message = answer.errors?.map((error) => error.message).join("; ");
      throw new AniListError(message || `AniList answered ${response.status}`, response.status);
    }
    return answer.data ?? null;
  }
}

/** Seconds to wait before the next request, read from the headers of a 429. */
export function retryAfterSeconds(headers: Headers): number {
  const retryAfter = Number(headers.get("retry-after"));
  if (Number.isFinite(retryAfter) && retryAfter >= 0 && headers.has("retry-after")) {
    return Math.ceil(retryAfter);
  }
  // X-RateLimit-Reset: Unix time (seconds) when the limit resets.
  const reset = Number(headers.get("x-ratelimit-reset"));
  if (Number.isFinite(reset) && reset > 0) {
    return Math.max(0, Math.ceil(reset - Date.now() / 1000));
  }
  return DEFAULT_RETRY_AFTER_SECONDS;
}
