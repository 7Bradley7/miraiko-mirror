"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRef, useState, type FormEvent } from "react";

import { MIN_PASSWORD_LENGTH, useAuthErrorMessage } from "@/components/auth/errors";
import { Field } from "@/components/auth/field";
import { highlight } from "@/components/auth/highlight";
import { getPathname } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";

type Status =
  { kind: "idle" } | { kind: "pending" } | { kind: "error"; message: string } | { kind: "done" };

export function ChangePasswordForm({ email }: { email: string }) {
  const t = useTranslations("account");
  const common = useTranslations("common");
  const errorMessage = useAuthErrorMessage();
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const currentPassword = String(form.get("current-password") ?? "");
    const newPassword = String(form.get("new-password") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");

    if (newPassword !== confirmation) {
      setStatus({ kind: "error", message: t("mismatch") });
      return;
    }

    setStatus({ kind: "pending" });
    // The other devices are signed out; this one stays signed in.
    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true,
    });
    if (error) {
      setStatus({ kind: "error", message: errorMessage(error) });
      return;
    }
    formRef.current?.reset();
    setStatus({ kind: "done" });
  }

  return (
    <section aria-labelledby="change-password-title" className="space-y-4">
      <h2 id="change-password-title" className="font-display text-3xl uppercase">
        {t("changePassword")}
      </h2>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="border-line bg-surface space-y-5 rounded-2xl border p-6"
      >
        <Field
          label={t("currentPassword")}
          name="current-password"
          type="password"
          autoComplete="current-password"
        />
        <Field
          label={common("newPassword")}
          name="new-password"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          hint={t("newPasswordHint", { min: MIN_PASSWORD_LENGTH })}
        />
        <Field
          label={common("confirmNewPassword")}
          name="confirmation"
          type="password"
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
        />

        <p
          role={status.kind === "error" ? "alert" : "status"}
          aria-live="polite"
          className={`min-h-5 text-sm ${status.kind === "error" ? "text-red-hi" : "text-mint"}`}
        >
          {status.kind === "error" ? status.message : ""}
          {status.kind === "done" ? t("passwordChanged") : ""}
        </p>

        <button
          type="submit"
          disabled={status.kind === "pending"}
          className="border-line hover:border-amber focus-visible:outline-amber rounded-xl border px-5 py-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-60"
        >
          {status.kind === "pending" ? common("pleaseWait") : t("changePassword")}
        </button>
      </form>

      <ResetLinkButton email={email} />
    </section>
  );
}

type LinkStatus =
  { kind: "idle" } | { kind: "pending" } | { kind: "error"; message: string } | { kind: "sent" };

/**
 * For a signed-in user who forgot their current password:
 * sends the same reset email as the "Forgot your password?" page, to the account's own address.
 */
function ResetLinkButton({ email }: { email: string }) {
  const t = useTranslations("account");
  const errorMessage = useAuthErrorMessage();
  const locale = useLocale();
  const [status, setStatus] = useState<LinkStatus>({ kind: "idle" });

  async function handleClick() {
    setStatus({ kind: "pending" });
    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: getPathname({ href: "/reset-password", locale }),
    });
    if (error) {
      setStatus({ kind: "error", message: errorMessage(error) });
      return;
    }
    setStatus({ kind: "sent" });
  }

  return (
    <div className="text-sm">
      {status.kind === "sent" ? (
        <p role="status" className="text-mint">
          {t.rich("resetLinkSent", { email, strong: highlight })}
        </p>
      ) : (
        <>
          <span className="text-muted">{t("forgotCurrent")} </span>
          <button
            type="button"
            onClick={handleClick}
            disabled={status.kind === "pending"}
            className="text-amber focus-visible:outline-amber underline-offset-4 hover:underline focus-visible:outline-2 disabled:cursor-wait disabled:opacity-60"
          >
            {status.kind === "pending" ? t("sending") : t("sendResetLink")}
          </button>
          {status.kind === "error" && (
            <p role="alert" className="text-red-hi mt-2">
              {status.message}
            </p>
          )}
        </>
      )}
    </div>
  );
}
