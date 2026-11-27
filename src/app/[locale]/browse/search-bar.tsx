"use client";

import { LoaderCircle, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react";

import { useRouter } from "@/i18n/navigation";

/** Wait this long after the last key press before searching. */
export const SEARCH_DELAY_MS = 350;

type SearchBarProps = {
  /** Search text currently in the URL. */
  defaultValue: string;
};

/**
 * Search field of the Browse page (Figma: 02 Browse → Search). Results follow the text as
 * the user types: the search is put in the URL (?q=…), which the page reads on the server.
 * Without JavaScript, the form still works: it sends ?q=… with the current filters.
 */
export function SearchBar({ defaultValue }: SearchBarProps) {
  const t = useTranslations("browse");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Never search after the user left the page.
  useEffect(() => () => clearTimeout(timer.current), []);

  function search(text: string) {
    clearTimeout(timer.current);
    const params = new URLSearchParams(searchParams.toString());
    const query = text.trim();
    if (query) params.set("q", query);
    else params.delete("q");
    params.delete("page");
    startTransition(() => {
      router.replace({ pathname: "/browse", query: Object.fromEntries(params) }, { scroll: false });
    });
  }

  function onChange(text: string) {
    setValue(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => search(text), SEARCH_DELAY_MS);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    search(value);
  }

  // Filters stay in the URL when the form is sent without JavaScript.
  const hiddenFilters = ["type", "genre"].flatMap((name) => {
    const filter = searchParams.get(name);
    return filter ? [{ name, value: filter }] : [];
  });

  return (
    <form
      role="search"
      onSubmit={onSubmit}
      className="focus-within:outline-amber flex h-14 w-full items-center gap-3 rounded-2xl border border-white/10 bg-[rgba(18,22,46,0.72)] px-[18px] backdrop-blur-[8px] focus-within:outline-2 focus-within:outline-offset-2"
    >
      {pending ? (
        <LoaderCircle
          aria-hidden="true"
          size={20}
          className="text-amber shrink-0 animate-spin motion-reduce:animate-none"
        />
      ) : (
        <Search aria-hidden="true" size={20} className="text-muted shrink-0" />
      )}
      <label htmlFor="browse-search" className="sr-only">
        {t("searchLabel")}
      </label>
      <input
        id="browse-search"
        name="q"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t("searchPlaceholder")}
        autoComplete="off"
        enterKeyHint="search"
        maxLength={100}
        className="text-text placeholder:text-subtle min-w-0 flex-1 bg-transparent text-[17px] leading-[1.6] outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {hiddenFilters.map((filter) => (
        <input key={filter.name} type="hidden" name={filter.name} value={filter.value} />
      ))}
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue("");
            search("");
          }}
          className="text-muted hover:text-text focus-visible:outline-amber grid size-8 shrink-0 place-items-center rounded-full hover:bg-white/8 focus-visible:outline-2"
        >
          <X aria-hidden="true" size={18} />
          <span className="sr-only">{t("clearSearch")}</span>
        </button>
      )}
      <button type="submit" className="sr-only">
        {t("searchButton")}
      </button>
    </form>
  );
}
