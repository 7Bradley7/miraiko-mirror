import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// "server-only" throws when imported outside a React Server Component: let tests import
// server modules (src/lib/...).
vi.mock("server-only", () => ({}));

// The App Router is not running in tests: replace its hooks with simple fakes.
// A test can change the current URL with vi.mocked(usePathname).mockReturnValue("/fr/browse").
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  usePathname: vi.fn(() => "/en"),
  useParams: vi.fn(() => ({ locale: "en" })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  })),
}));

// Unmount what each test rendered so tests never see each other's DOM.
afterEach(() => {
  cleanup();
});
