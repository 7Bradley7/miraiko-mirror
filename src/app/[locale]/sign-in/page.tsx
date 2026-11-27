import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

import { AuthForm } from "./auth-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("signIn");
  return { title: t("title") };
}

export default function SignInPage() {
  const t = useTranslations("signIn");
  return (
    <main className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-12 px-4 py-16 sm:px-8 lg:grid-cols-[1fr_minmax(0,26rem)]">
      <section>
        <p className="text-amber font-mono text-xs tracking-[0.14em] uppercase">
          {t("eyebrow")} · <span className="font-kanji">次</span>
        </p>
        <h1 className="font-display mt-4 text-5xl leading-[0.95] uppercase sm:text-7xl">
          {t("heading")}
        </h1>
      </section>

      <AuthForm />
    </main>
  );
}
