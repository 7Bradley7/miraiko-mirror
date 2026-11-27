"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

import { MIN_PASSWORD_LENGTH, useAuthErrorMessage } from "@/components/auth/errors";
import { Field } from "@/components/auth/field";
import { Link } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";

type Status =
  { kind: "idle" } | { kind: "pending" } | { kind: "error"; message: string } | { kind: "done" };

const linkClass =
  "text-amber focus-visible:outline-amber inline-block text-sm underline-offset-4 hover:underline focus-visible:outline-2";

export function ResetPasswordForm({ token }: { token?: string }) {
  const t = useTranslations("resetPassword");
  const common = useTranslations("common");
  const errorMessage = useAuthErrorMessage();
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  if (!token) {
    return (
      <div role="alert" className="border-line bg-surface mt-8 space-y-3 rounded-2xl border p-6">
        <p>{t("invalidLink")}</p>
        <Link href="/forgot-password" className={linkClass}>
          {t("askNewLink")}
        </Link>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("password") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");

    if (newPassword !== confirmation) {
      setStatus({ kind: "error", message: t("mismatch") });
      return;
    }

    setStatus({ kind: "pending" });
    const { error } = await authClient.resetPassword({ newPassword, token });
    if (error) {
      setStatus({ kind: "error", message: errorMessage(error) });
      return;
    }
    setStatus({ kind: "done" });
  }

  if (status.kind === "done") {
    return (
      <div role="status" className="border-line bg-surface mt-8 space-y-3 rounded-2xl border p-6">
        <p>{t("done")}</p>
        <Link href="/sign-in" className={linkClass}>
          {t("logInAgain")}
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-line bg-surface mt-8 space-y-5 rounded-2xl border p-6"
    >
      <Field
        label={common("newPassword")}
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={MIN_PASSWORD_LENGTH}
        hint={common("passwordHint", { min: MIN_PASSWORD_LENGTH })}
      />
      <Field
        label={common("confirmNewPassword")}
        name="confirmation"
        type="password"
        autoComplete="new-password"
        minLength={MIN_PASSWORD_LENGTH}
      />

      <p role="alert" aria-live="assertive" className="text-red-hi min-h-5 text-sm">
        {status.kind === "error" ? status.message : ""}
      </p>

      <button
        type="submit"
        disabled={status.kind === "pending"}
        className="bg-red hover:bg-red-hi focus-visible:outline-amber w-full rounded-xl py-3.5 font-medium text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-60"
      >
        {status.kind === "pending" ? common("pleaseWait") : t("save")}
      </button>
    </form>
  );
}
