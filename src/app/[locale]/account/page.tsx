import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { getCurrentUser } from "@/lib/session";

import { AniListSection } from "./anilist-section";
import { ChangePasswordForm } from "./change-password-form";
import { SignOutButton } from "./sign-out-button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("title") };
}

export default function AccountPage() {
  const t = useTranslations("account");
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-8">
      <p className="text-amber font-mono text-xs tracking-[0.14em] uppercase">{t("title")}</p>
      {/* The session is read at request time, so it streams in behind the boundary. */}
      <Suspense fallback={<p className="text-muted mt-6">{t("loading")}</p>}>
        <AccountDetails />
      </Suspense>
    </main>
  );
}

async function AccountDetails() {
  const user = await getCurrentUser();
  const t = await getTranslations("account");
  const common = await getTranslations("common");

  return (
    <section className="mt-4 space-y-8">
      <h1 className="font-display text-5xl uppercase sm:text-6xl">
        {t("greeting", { name: user.name })}
      </h1>
      <dl className="border-line bg-surface rounded-2xl border p-6">
        <dt className="text-subtle text-sm">{common("email")}</dt>
        <dd className="mt-1">{user.email}</dd>
      </dl>
      <SignOutButton />
      <AniListSection accountId={user.aniListAccountId} />
      <ChangePasswordForm email={user.email} />
    </section>
  );
}
