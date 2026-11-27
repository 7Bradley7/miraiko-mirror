import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";

import { HoloCard } from "./holo-card";

const props = {
  href: "/title/42",
  title: "Tsuki to Kitsune",
  subtitle: "Fantasy · Romance",
  coverSrc: "/demo-covers/tsuki-to-kitsune.webp",
};

/** Renders a card whose box is 200 × 400 px at the top-left of the page. */
function renderCard() {
  renderWithIntl(<HoloCard {...props} />);
  const link = screen.getByRole("link");
  link.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 400 }) as DOMRect;
  return link;
}

function mockReducedMotion(reduce: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: reduce, media: query }));
}

describe("HoloCard", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is one link to the title page, named by its text", () => {
    renderWithIntl(<HoloCard {...props} match="97% match" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/en/title/42");
    expect(link).toHaveTextContent("Tsuki to Kitsune");
    expect(link).toHaveTextContent("Fantasy · Romance");
    expect(link).toHaveTextContent("97% match");
  });

  it("keeps the cover decorative, since the title is already written", () => {
    const { container } = renderWithIntl(<HoloCard {...props} />);
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
  });

  it("hides the match badge when there is no score", () => {
    renderWithIntl(<HoloCard {...props} />);
    expect(screen.queryByText(/match/)).not.toBeInTheDocument();
  });

  it("turns towards the pointer and moves the glare under it", () => {
    mockReducedMotion(false);
    const link = renderCard();

    // Top-right quarter of the card.
    fireEvent.pointerMove(link, { clientX: 150, clientY: 100, pointerType: "mouse" });
    expect(link.style.getPropertyValue("--glare-x")).toBe("75%");
    expect(link.style.getPropertyValue("--glare-y")).toBe("25%");
    expect(link.style.getPropertyValue("--rotate-x")).toBe("6.00deg");
    expect(link.style.getPropertyValue("--rotate-y")).toBe("6.00deg");
  });

  it("goes back to rest when the pointer leaves", () => {
    mockReducedMotion(false);
    const link = renderCard();

    fireEvent.pointerMove(link, { clientX: 150, clientY: 100, pointerType: "mouse" });
    fireEvent.pointerLeave(link);
    expect(link.style.getPropertyValue("--rotate-x")).toBe("");
    expect(link.style.getPropertyValue("--glare-x")).toBe("");
  });

  it("does not turn when the user asks for reduced motion", () => {
    mockReducedMotion(true);
    const link = renderCard();

    fireEvent.pointerMove(link, { clientX: 150, clientY: 100, pointerType: "mouse" });
    expect(link.style.getPropertyValue("--glare-x")).toBe("75%");
    expect(link.style.getPropertyValue("--rotate-y")).toBe("");
  });

  it("does not react to touch, where there is no hover", () => {
    mockReducedMotion(false);
    const link = renderCard();

    fireEvent.pointerMove(link, { clientX: 150, clientY: 100, pointerType: "touch" });
    expect(link.style.getPropertyValue("--rotate-y")).toBe("");
  });
});
