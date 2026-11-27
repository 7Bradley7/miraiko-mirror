"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { buttonClassName } from "@/components/ui/button";
import { getPathname } from "@/i18n/navigation";
import { ANILIST_PROVIDER_ID } from "@/lib/anilist/oauth";
import { authClient } from "@/lib/auth-client";

/** Turns the ?error=… code Better Auth sends back into a message key. */
function errorKey(code: string | undefined) {
  if (!code) return null;
  if (code === "account_already_linked_to_different_user") return "alreadyLinked" as const;
  if (code === "access_denied") return "cancelled" as const;
  return "unknown" as const;
}

/**
 * Sends the user to AniList to approve Miraiko, then back to the account page.
 * The AniList password is only ever typed on AniList's own site.
 */
export function LinkAniListButton({ error }: { error?: string }) {
  const t = useTranslations("onboarding");
  const locale = useLocale();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const shownError = failed ? "unknown" : errorKey(error);

  async function linkAniList() {
    setPending(true);
    setFailed(false);
    const { error: linkError } = await authClient.linkSocial({
      provider: ANILIST_PROVIDER_ID,
      callbackURL: getPathname({ href: "/account", locale }),
      errorCallbackURL: getPathname({ href: "/onboarding", locale }),
    });
    // On success the browser is already on its way to AniList.
    if (linkError) {
      setFailed(true);
      setPending(false);
    }
  }

  return (
    <div className="mt-8 space-y-4">
      <button
        type="button"
        onClick={linkAniList}
        disabled={pending}
        className={buttonClassName("red", "w-full sm:w-auto")}
      >
        {pending ? t("connecting") : t("connect")}
      </button>
      <p role="alert" aria-live="assertive" className="text-red-hi min-h-5 text-sm">
        {shownError ? t(`errors.${shownError}`) : ""}
      </p>
    </div>
  );
}
