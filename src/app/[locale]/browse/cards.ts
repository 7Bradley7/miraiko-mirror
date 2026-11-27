import type { MediaSummary } from "@/lib/anilist/catalog";

/** AniList formats with a label in the "browse.formats" messages. */
export const FORMATS = [
  "TV",
  "TV_SHORT",
  "MOVIE",
  "SPECIAL",
  "OVA",
  "ONA",
  "MUSIC",
  "MANGA",
  "NOVEL",
  "ONE_SHOT",
] as const;

export type Format = (typeof FORMATS)[number];

function isKnownFormat(format: string | null): format is Format {
  return FORMATS.includes(format as Format);
}

/** Page of a title (MRK-21): /anime/154587 or /manga/30002. */
export function titleHref(item: Pick<MediaSummary, "id" | "type">) {
  return `/${item.type === "MANGA" ? "manga" : "anime"}/${item.id}`;
}

/** "TV · 2023": format and year of a title, under its name on the card. */
export function cardSubtitle(
  item: Pick<MediaSummary, "format" | "year">,
  formatLabel: (format: Format) => string,
): string {
  const parts: string[] = [];
  if (isKnownFormat(item.format)) parts.push(formatLabel(item.format));
  if (item.year) parts.push(String(item.year));
  return parts.join(" · ");
}

/** Grid of cards: 6 columns on a large screen, 2 on a phone. */
export const gridClassName =
  "grid grid-cols-2 gap-x-5 gap-y-[26px] sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6";
