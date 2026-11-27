import { describe, expect, it } from "vitest";

import { emailLocale } from "./email-locale";

const resetLink = (callback: string) =>
  `https://miraiko.vercel.app/api/auth/reset-password/abc?callbackURL=${encodeURIComponent(callback)}`;

describe("emailLocale", () => {
  it("uses the language of the page the link opens", () => {
    expect(emailLocale({ url: resetLink("/fr/reset-password") })).toBe("fr");
    expect(emailLocale({ url: resetLink("/en/reset-password") })).toBe("en");
  });

  it("then the language of the page the request came from", () => {
    const request = new Request("https://miraiko.vercel.app/api/auth/reset-password", {
      headers: { referer: "https://miraiko.vercel.app/fr/reset-password?token=abc" },
    });
    expect(emailLocale({ request })).toBe("fr");
  });

  it("then the browser's preferred languages", () => {
    const request = new Request("https://miraiko.vercel.app/api/auth/sign-up/email", {
      headers: { "accept-language": "de-DE,fr-FR;q=0.8,en;q=0.5" },
    });
    expect(emailLocale({ request })).toBe("fr");
  });

  it("falls back to English", () => {
    expect(emailLocale({})).toBe("en");
    expect(emailLocale({ url: resetLink("/account") })).toBe("en");
  });
});
