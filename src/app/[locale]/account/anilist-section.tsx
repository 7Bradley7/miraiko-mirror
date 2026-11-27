"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { ButtonLink } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth-client";

/** Whether the account is linked to AniList, with a way to link or unlink it (MRK-32). */
export function AniListSection({ accountId }: { accountId: string | null }) {
  const t = useTranslations("account.aniList");
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const linked = accountId !== null;

  async function unlink() {
    if (!accountId) return;
    setPending(true);
    setFailed(false);
    // Deletes the AniList account row, and its encrypted token, from our database.
    // Better Auth asks for a recent sign-in: an older session gets an error and must log in again.
    const { error } = await authClient.unlinkAccount({ accountId });
    setPending(false);
    if (error) {
      setFailed(true);
      return;
    }
    router.refresh();
  }

  return (
    <section aria-labelledby="anilist-title" className="space-y-4">
      <h2 id="anilist-title" className="font-display text-3xl uppercase">
        {t("heading")}
      </h2>
      <div className="border-line bg-surface space-y-4 rounded-2xl border p-6">
        <p className={linked ? "text-mint" : "text-muted"}>
          {linked ? t("linked") : t("notLinked")}
        </p>

        {linked ? (
          <>
            <button
              type="button"
              onClick={unlink}
              disabled={pending}
              className="border-line hover:border-red-hi focus-visible:outline-amber rounded-xl border px-5 py-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-wait disabled:opacity-60"
            >
              {pending ? t("unlinking") : t("unlink")}
            </button>
            <p className="text-subtle text-sm">{t("unlinkHint")}</p>
          </>
        ) : (
          <ButtonLink href="/onboarding" variant="red">
            {t("link")}
          </ButtonLink>
        )}

        {failed && (
          <p role="alert" className="text-red-hi text-sm">
            {t("unlinkError")}
          </p>
        )}
      </div>
    </section>
  );
}
