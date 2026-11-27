import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { usePathname, useRouter } from "next/navigation";
import { describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";

import { LocaleSwitcher } from "./locale-switcher";

function mockRouter() {
  const router = {
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  };
  // Only the methods the switcher uses: cast to the full App Router type.
  vi.mocked(useRouter).mockReturnValue(router as unknown as ReturnType<typeof useRouter>);
  return router;
}

describe("LocaleSwitcher", () => {
  it("shows each language in its own language, the current one pressed", () => {
    renderWithIntl(<LocaleSwitcher />, { locale: "fr" });
    expect(screen.getByRole("group", { name: "Langue" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Français" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("lang", "en");
  });

  it("opens the same page in the chosen language", async () => {
    const router = mockRouter();
    vi.mocked(usePathname).mockReturnValue("/en/browse");
    renderWithIntl(<LocaleSwitcher />);

    await userEvent.click(screen.getByRole("button", { name: "Français" }));
    expect(router.replace).toHaveBeenCalledWith("/fr/browse");
  });

  it("does nothing when the current language is chosen again", async () => {
    const router = mockRouter();
    renderWithIntl(<LocaleSwitcher />);

    await userEvent.click(screen.getByRole("button", { name: "English" }));
    expect(router.replace).not.toHaveBeenCalled();
  });
});
