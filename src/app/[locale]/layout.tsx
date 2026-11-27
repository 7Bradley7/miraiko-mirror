import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { locale } from "next/root-params";
// Self-hosted fonts (Fontsource): no request to Google, builds work offline.
import "@fontsource/big-shoulders-display/900";
import "@fontsource/zen-kaku-gothic-new/400";
import "@fontsource/zen-kaku-gothic-new/500";
import "@fontsource/zen-kaku-gothic-new/700";
import "@fontsource/jetbrains-mono/500";
import "@fontsource/dela-gothic-one/400";
import "../globals.css";

import { routing } from "@/i18n/routing";

// One prerendered version of the site per language (required by Cache Components).
export function generateStaticParams() {
  return routing.locales.map((value) => ({ locale: value }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return {
    title: {
      default: "Miraiko",
      template: "%s · Miraiko",
    },
    description: t("description"),
  };
}

export const viewport: Viewport = {
  themeColor: "#0a0d1f",
  colorScheme: "dark",
};

export default async function RootLayout({ children }: LayoutProps<"/[locale]">) {
  return (
    <html lang={await locale()}>
      <body className="antialiased">
        {/* Gives Client Components the language and the messages of the page. */}
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
