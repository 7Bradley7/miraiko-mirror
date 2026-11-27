import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("home");
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <span
        aria-hidden="true"
        className="bg-red font-kanji grid size-16 place-items-center rounded-2xl text-3xl text-white shadow-[0_10px_30px_rgba(255,59,59,0.45)]"
      >
        次
      </span>
      <h1 className="font-display text-6xl leading-none tracking-wide uppercase sm:text-8xl">
        Miraiko
      </h1>
      <p className="text-muted max-w-md text-lg">{t("tagline")}</p>
      <p className="text-amber font-mono text-xs tracking-[0.14em] uppercase">{t("comingSoon")}</p>
    </main>
  );
}
