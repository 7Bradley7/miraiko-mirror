import { act, fireEvent, screen } from "@testing-library/react";
import { useRouter, useSearchParams } from "next/navigation";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";

import { SEARCH_DELAY_MS, SearchBar } from "./search-bar";

function setup(url = "") {
  const replace = vi.fn();
  vi.mocked(useRouter).mockReturnValue({
    push: vi.fn(),
    replace,
    refresh: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  } as unknown as ReturnType<typeof useRouter>);
  vi.mocked(useSearchParams).mockReturnValue(
    new URLSearchParams(url) as unknown as ReturnType<typeof useSearchParams>,
  );
  return { replace };
}

describe("SearchBar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("is a labelled search field showing the current search", () => {
    setup("q=frieren");
    renderWithIntl(<SearchBar defaultValue="frieren" />);
    expect(screen.getByRole("search")).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Search the catalogue" })).toHaveValue("frieren");
  });

  it("searches once the user stops typing, keeping the filters and going back to page 1", () => {
    const { replace } = setup("type=anime&page=3");
    renderWithIntl(<SearchBar defaultValue="" />);
    const field = screen.getByRole("searchbox");

    fireEvent.change(field, { target: { value: "fri" } });
    fireEvent.change(field, { target: { value: "frieren" } });
    expect(replace).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(SEARCH_DELAY_MS);
    });

    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace.mock.calls[0]![0]).toBe("/en/browse?type=anime&q=frieren");
  });

  it("searches right away on Enter", () => {
    const { replace } = setup();
    renderWithIntl(<SearchBar defaultValue="" />);
    const field = screen.getByRole("searchbox");

    fireEvent.change(field, { target: { value: "one piece" } });
    fireEvent.submit(screen.getByRole("search"));

    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace.mock.calls[0]![0]).toBe("/en/browse?q=one+piece");
  });

  it("clears the search", () => {
    const { replace } = setup("q=frieren&genre=fantasy");
    renderWithIntl(<SearchBar defaultValue="frieren" />);

    fireEvent.click(screen.getByRole("button", { name: "Clear the search" }));

    expect(screen.getByRole("searchbox")).toHaveValue("");
    expect(replace.mock.calls[0]![0]).toBe("/en/browse?genre=fantasy");
  });

  it("keeps the filters when the form is sent without JavaScript", () => {
    setup("type=manga&genre=drama");
    const { container } = renderWithIntl(<SearchBar defaultValue="" />);
    const hidden = [...container.querySelectorAll<HTMLInputElement>("input[type=hidden]")];
    expect(hidden.map((input) => [input.name, input.value])).toEqual([
      ["type", "manga"],
      ["genre", "drama"],
    ]);
  });
});
