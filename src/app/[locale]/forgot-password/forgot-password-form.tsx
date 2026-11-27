"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

import { useAuthErrorMessage } from "@/components/auth/errors";
import { Field } from "@/components/auth/field";
import { highlight } from "@/components/auth/highlight";
import { getPathname, Link } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";

type Status =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "error"; message: string }
  | { kind: "sent"; email: string };

export function ForgotPasswordForm() {
  const t = useTranslations("forgotPassword");
  const common = useTranslations("common");
  const errorMessage = useAuthErrorMessage();
  const locale = useLocale();
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();

    setStatus({ kind: "pending" });
    const { error } = await authClient.requestPasswordReset({
      email,
      // The link in the email opens the reset page in the current language.
      redirectTo: getPathname({ href: "/reset-password", locale }),
    });
    if (error) {
      setStatus({ kind: "error", message: errorMessage(error) });
      return;
    }
    // Same answer whether the email has an account or not, so nobody can test addresses.
    setStatus({ kind: "sent", email });
  }

  if (status.kind === "sent") {
    return (
      <div
        role="status"
        className="border-line bg-surface mt-8 space-y-3 rounded-2xl border p-6 text-center"
      >
        <p className="font-display text-3xl uppercase">{common("checkInbox")}</p>
        <p className="text-muted text-sm">
          {t.rich("sentText", { email: status.email, strong: highlight })}
        </p>
        <Link
          href="/sign-in"
          className="text-amber focus-visible:outline-amber inline-block text-sm underline-offset-4 hover:underline focus-visible:outline-2"
        >
          {common("backToLogIn")}
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-line bg-surface mt-8 space-y-5 rounded-2xl border p-6"
    >
      <Field label={common("email")} name="email" type="email" autoComplete="email" />

      <p role="alert" aria-live="assertive" className="text-red-hi min-h-5 text-sm">
        {status.kind === "error" ? status.message : ""}
      </p>

      <button
        type="submit"
        disabled={status.kind === "pending"}
        className="bg-red hover:bg-red-hi focus-visible:outline-amber w-full rounded-xl py-3.5 font-medium text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-60"
      >
        {status.kind === "pending" ? common("pleaseWait") : t("send")}
      </button>

      <p className="text-center">
        <Link
          href="/sign-in"
          className="text-muted hover:text-text focus-visible:outline-amber text-sm underline-offset-4 hover:underline focus-visible:outline-2"
        >
          {common("backToLogIn")}
        </Link>
      </p>
    </form>
  );
}
