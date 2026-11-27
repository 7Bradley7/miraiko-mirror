import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { ResetPasswordForm } from "./reset-password-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("resetPassword");
  return { title: t("title") };
}

type Props = {
  // Better Auth redirects here with ?token=… (valid link) or ?error=INVALID_TOKEN.
  searchParams: Promise<{ token?: string; error?: string }>;
};

export default function ResetPasswordPage({ searchParams }: Props) {
  const t = useTranslations("resetPassword");
  const common = useTranslations("common");
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-16">
      <p className="text-amber font-mono text-xs tracking-[0.14em] uppercase">
        {common("account")}
      </p>
      <h1 className="font-display mt-4 text-5xl leading-[0.95] uppercase">{t("heading")}</h1>
      {/* The token comes from the request, so the form streams in behind the boundary. */}
      <Suspense fallback={<p className="text-muted mt-8">{common("loading")}</p>}>
        <ResetPasswordContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function ResetPasswordContent({ searchParams }: Props) {
  const { token, error } = await searchParams;
  return <ResetPasswordForm token={error ? undefined : token} />;
}
