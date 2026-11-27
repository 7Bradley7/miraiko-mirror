import { screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";

import { Nav } from "./nav";
import { isActive } from "./nav-links";

describe("isActive", () => {
  it("matches Home only on the home page", () => {
    expect(isActive("/", "/")).toBe(true);
    expect(isActive("/", "/browse")).toBe(false);
  });

  it("matches a section and its sub-pages, not look-alike paths", () => {
    expect(isActive("/browse", "/browse")).toBe(true);
    expect(isActive("/browse", "/browse/123")).toBe(true);
    expect(isActive("/browse", "/browsers")).toBe(false);
  });
});

describe("Nav", () => {
  beforeEach(() => {
    vi.mocked(usePathname).mockReturnValue("/en");
  });

  it("marks the tab of the current URL as the current page, whatever the language", () => {
    vi.mocked(usePathname).mockReturnValue("/en/for-you");
    renderWithIntl(<Nav />);
    expect(screen.getByRole("link", { name: "For you" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
  });

  it("lets the design system page force the current tab", () => {
    renderWithIntl(<Nav currentPath="/my-list" />);
    expect(screen.getByRole("link", { name: "My list" })).toHaveAttribute("aria-current", "page");
  });

  it("keeps the language in its links", () => {
    renderWithIntl(<Nav />);
    expect(screen.getByRole("link", { name: "Browse" })).toHaveAttribute("href", "/en/browse");
  });

  it("shows a Log in link when nobody is signed in", () => {
    renderWithIntl(<Nav />);
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/en/sign-in");
  });

  it("shows the user's initial, with an accessible name, when signed in", () => {
    renderWithIntl(<Nav user={{ name: "kenji" }} />);
    const account = screen.getByRole("link", { name: "Your account (kenji)" });
    expect(account).toHaveAttribute("href", "/en/account");
    expect(account).toHaveTextContent("K");
  });

  it("has a labelled search link and a home link on the logo", () => {
    renderWithIntl(<Nav />);
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Search the catalogue" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Miraiko, home" })).toHaveAttribute("href", "/en");
  });

  it("is translated in French", () => {
    vi.mocked(usePathname).mockReturnValue("/fr/browse");
    renderWithIntl(<Nav />, { locale: "fr" });
    const browse = screen.getByRole("link", { name: "Explorer" });
    expect(browse).toHaveAttribute("href", "/fr/browse");
    expect(browse).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Connexion" })).toBeInTheDocument();
  });
});
