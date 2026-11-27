import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { Mascot } from "@/components/ui/mascot";
import { redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/session";

import { LinkAniListButton } from "./link-anilist-button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("onboarding");
  return { title: t("title"), robots: { index: false, follow: false } };
}

type Props = {
  // Better Auth comes back here with ?error=… when the AniList link fails.
  searchParams: Promise<{ error?: string }>;
};

/**
 * Mandatory onboarding (MRK-32): a signed-in user links an AniList account before using
 * Miraiko. Users who already did are sent on to their account.
 */
export default async function OnboardingPage({ searchParams }: Props) {
  const t = await getTranslations("onboarding");
  const common = await getTranslations("common");
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-5xl items-center gap-10 px-4 py-16 sm:px-8 md:grid-cols-[1fr_auto]">
      <section className="max-w-xl">
        <p className="text-amber font-mono text-xs tracking-[0.14em] uppercase">{t("eyebrow")}</p>
        <h1 className="font-display mt-4 text-5xl leading-[0.95] uppercase sm:text-6xl">
          {t("heading")}
        </h1>
        <p className="text-muted mt-5 text-lg">{t("intro")}</p>
        <p className="text-subtle mt-3 text-sm">{t("why")}</p>

        {/* The session and the error come from the request: they stream in behind it. */}
        <Suspense fallback={<p className="text-muted mt-8">{common("loading")}</p>}>
          <OnboardingAction searchParams={searchParams} />
        </Suspense>

        <p className="text-subtle mt-6 text-sm">
          {t.rich("noAccount", {
            link: (chunks) => (
              <a
                href="https://anilist.co/signup"
                className="text-amber focus-visible:outline-amber underline-offset-4 hover:underline focus-visible:outline-2"
              >
                {chunks}
              </a>
            ),
          })}
        </p>
      </section>

      <Mascot pose="wave" width={220} className="mx-auto hidden md:block" preload />
    </main>
  );
}

async function OnboardingAction({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (user.aniListLinked) {
    return redirect({ href: "/account", locale: await getLocale() });
  }
  const { error } = await searchParams;
  return <LinkAniListButton error={error} />;
}
