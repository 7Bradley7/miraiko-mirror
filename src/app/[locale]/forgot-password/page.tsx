import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

import { ForgotPasswordForm } from "./forgot-password-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("forgotPassword");
  return { title: t("title") };
}

export default function ForgotPasswordPage() {
  const t = useTranslations("forgotPassword");
  const common = useTranslations("common");
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-16">
      <p className="text-amber font-mono text-xs tracking-[0.14em] uppercase">
        {common("account")}
      </p>
      <h1 className="font-display mt-4 text-5xl leading-[0.95] uppercase">{t("heading")}</h1>
      <p className="text-muted mt-4">{t("intro")}</p>
      <ForgotPasswordForm />
    </main>
  );
}
