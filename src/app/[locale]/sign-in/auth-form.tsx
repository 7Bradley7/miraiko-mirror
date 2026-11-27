"use client";

import { useLocale, useTranslations } from "next-intl";
import { useId, useState, type FormEvent } from "react";

import { MIN_PASSWORD_LENGTH, useAuthErrorMessage } from "@/components/auth/errors";
import { Field } from "@/components/auth/field";
import { highlight } from "@/components/auth/highlight";
import { getPathname, Link, useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";

type Mode = "log-in" | "register";

type Status =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "error"; message: string }
  | { kind: "check-inbox"; email: string };

export function AuthForm() {
  const t = useTranslations("signIn");
  const common = useTranslations("common");
  const errorMessage = useAuthErrorMessage();
  const locale = useLocale();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("log-in");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const formId = useId();

  const isRegister = mode === "register";
  const pending = status.kind === "pending";
  // Where Better Auth sends the user after the email link, in the current language:
  // the AniList onboarding, which moves on to the account once AniList is linked.
  const onboardingURL = getPathname({ href: "/onboarding", locale });

  function switchMode(next: Mode) {
    setMode(next);
    setStatus({ kind: "idle" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    setStatus({ kind: "pending" });

    if (isRegister) {
      const name = String(form.get("name") ?? "").trim();
      const { error } = await authClient.signUp.email({
        name,
        email,
        password,
        callbackURL: onboardingURL,
      });
      if (error) {
        setStatus({ kind: "error", message: errorMessage(error) });
        return;
      }
      setStatus({ kind: "check-inbox", email });
      return;
    }

    const { error } = await authClient.signIn.email({
      email,
      password,
      callbackURL: onboardingURL,
    });
    if (error) {
      if (error.status === 403) {
        // Unverified email: Better Auth has just sent a new verification link.
        setStatus({ kind: "check-inbox", email });
        return;
      }
      setStatus({ kind: "error", message: errorMessage(error) });
      return;
    }
    router.push("/onboarding");
    router.refresh();
  }

  return (
    <section
      aria-labelledby={`${formId}-title`}
      className="border-line bg-surface/80 rounded-3xl border p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur"
    >
      <h2 id={`${formId}-title`} className="sr-only">
        {isRegister ? t("registerTitle") : t("logIn")}
      </h2>

      <div
        role="tablist"
        aria-label={t("tabsLabel")}
        className="border-line bg-night grid grid-cols-2 rounded-full border p-1"
      >
        {(["log-in", "register"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            id={`${formId}-tab-${tab}`}
            aria-selected={mode === tab}
            aria-controls={`${formId}-panel`}
            onClick={() => switchMode(tab)}
            className="text-muted aria-selected:text-night focus-visible:outline-amber rounded-full py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 aria-selected:bg-white"
          >
            {tab === "log-in" ? t("logIn") : t("register")}
          </button>
        ))}
      </div>

      <div id={`${formId}-panel`} role="tabpanel" aria-labelledby={`${formId}-tab-${mode}`}>
        {status.kind === "check-inbox" ? (
          <div role="status" className="mt-8 space-y-3 text-center">
            <p className="font-display text-3xl uppercase">{common("checkInbox")}</p>
            <p className="text-muted text-sm">
              {t.rich("checkInboxText", { email: status.email, strong: highlight })}
            </p>
            <button
              type="button"
              onClick={() => switchMode("log-in")}
              className="text-amber focus-visible:outline-amber text-sm underline-offset-4 hover:underline focus-visible:outline-2"
            >
              {common("backToLogIn")}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {isRegister && (
              <Field label={t("displayName")} name="name" type="text" autoComplete="nickname" />
            )}
            <Field label={common("email")} name="email" type="email" autoComplete="email" />
            <Field
              label={t("password")}
              name="password"
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              minLength={isRegister ? MIN_PASSWORD_LENGTH : undefined}
              hint={isRegister ? common("passwordHint", { min: MIN_PASSWORD_LENGTH }) : undefined}
            />

            {!isRegister && (
              <p className="-mt-2 text-right">
                <Link
                  href="/forgot-password"
                  className="text-amber focus-visible:outline-amber text-sm underline-offset-4 hover:underline focus-visible:outline-2"
                >
                  {t("forgotPassword")}
                </Link>
              </p>
            )}

            <p role="alert" aria-live="assertive" className="text-red-hi min-h-5 text-sm">
              {status.kind === "error" ? status.message : ""}
            </p>

            <button
              type="submit"
              disabled={pending}
              className="bg-red hover:bg-red-hi focus-visible:outline-amber w-full rounded-xl py-3.5 font-medium text-white shadow-[0_10px_30px_rgba(255,59,59,0.35)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-60"
            >
              {pending ? common("pleaseWait") : isRegister ? t("createAccount") : t("logIn")}
            </button>
          </form>
        )}
      </div>

      <p className="text-subtle mt-6 text-center text-xs">{t("legal")}</p>
    </section>
  );
}
