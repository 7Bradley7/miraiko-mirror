import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AmbientPage } from "./ambient";
import { StickyBar } from "./sticky-bar";

describe("StickyBar", () => {
  it("once stuck, opens the window over the cards down to just under the bar", () => {
    render(
      <AmbientPage>
        <StickyBar>
          <p>Search</p>
        </StickyBar>
      </AmbientPage>,
    );
    const bar = screen.getByText("Search").parentElement!;
    const marker = bar.previousElementSibling as HTMLElement;
    expect(bar).toHaveAttribute("data-stuck", "false");
    expect(screen.queryByTestId("ambient-window")).not.toBeInTheDocument();

    // The page scrolls: the marker above the bar goes above the top of the screen.
    vi.spyOn(marker, "getBoundingClientRect").mockReturnValue({ top: -50 } as DOMRect);
    vi.spyOn(bar, "getBoundingClientRect").mockReturnValue({ bottom: 260 } as DOMRect);
    act(() => {
      fireEvent.scroll(window);
    });
    expect(bar).toHaveAttribute("data-stuck", "true");
    expect(screen.getByTestId("ambient-window")).toHaveStyle({ height: "276px" });

    // Back to the top.
    vi.spyOn(marker, "getBoundingClientRect").mockReturnValue({ top: 200 } as DOMRect);
    act(() => {
      fireEvent.scroll(window);
    });
    expect(bar).toHaveAttribute("data-stuck", "false");
    expect(screen.queryByTestId("ambient-window")).not.toBeInTheDocument();
  });
});
