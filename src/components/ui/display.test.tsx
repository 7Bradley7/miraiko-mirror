import { cleanup, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithIntl } from "@/test/render";

import { Bubble } from "./bubble";
import { Footer, footerColumns } from "./footer";
import { Logo } from "./logo";
import { Mascot } from "./mascot";
import { Pill } from "./pill";

describe("Logo", () => {
  it("reads as Miraiko, with the kanji mark hidden from screen readers", () => {
    const { container } = render(<Logo />);
    expect(screen.getByText("Miraiko")).toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent("次");
  });
});

describe("Pill", () => {
  it("shows its label", () => {
    render(<Pill>Fantasy</Pill>);
    expect(screen.getByText("Fantasy")).toBeInTheDocument();
  });
});

describe("Bubble", () => {
  it("shows its text, with the highlighted words inside", () => {
    render(
      <Bubble>
        Your next one is <em>right here</em>!
      </Bubble>,
    );
    expect(screen.getByText("right here").tagName).toBe("EM");
  });
});

describe("Mascot", () => {
  it("is decorative by default", () => {
    const { container } = renderWithIntl(<Mascot pose="wave" />);
    const image = container.querySelector("img");
    expect(image).toHaveAttribute("alt", "");
    expect(image?.getAttribute("src")).toContain("wave.webp");
  });

  it("describes the pose when she carries meaning, in the current language", () => {
    renderWithIntl(<Mascot pose="sleep" decorative={false} />);
    expect(screen.getByRole("img", { name: "Miraiko sleeping" })).toBeInTheDocument();
    cleanup();
    renderWithIntl(<Mascot pose="sleep" decorative={false} />, { locale: "fr" });
    expect(screen.getByRole("img", { name: "Miraiko qui dort" })).toBeInTheDocument();
  });

  it("keeps the proportions of the artwork", () => {
    renderWithIntl(<Mascot pose="point" width={130} decorative={false} />);
    const image = screen.getByRole("img");
    expect(image).toHaveAttribute("width", "130");
    // point.webp is 331 × 646.
    expect(image).toHaveAttribute("height", "254");
  });
});

describe("Footer", () => {
  it("has one labelled link list per column", () => {
    renderWithIntl(<Footer />);
    const names = { explore: "Explore", support: "Support", legal: "Legal" };
    for (const column of footerColumns) {
      const nav = screen.getByRole("navigation", { name: names[column.title] });
      expect(within(nav).getAllByRole("link")).toHaveLength(column.links.length);
    }
  });

  it("keeps the language in its links", () => {
    renderWithIntl(<Footer />);
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/en/privacy");
  });

  it("is translated in French, with the language choice", () => {
    renderWithIntl(<Footer />, { locale: "fr" });
    expect(screen.getByRole("link", { name: "Mentions légales" })).toHaveAttribute(
      "href",
      "/fr/legal",
    );
    expect(screen.getByRole("group", { name: "Langue" })).toBeInTheDocument();
  });

  it("credits AniList", () => {
    renderWithIntl(<Footer />);
    expect(screen.getByRole("link", { name: "AniList" })).toHaveAttribute(
      "href",
      "https://anilist.co",
    );
  });
});
