import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { Bubble } from "@/components/ui/bubble";
import { Button, ButtonLink } from "@/components/ui/button";
import { Footer } from "@/components/ui/footer";
import { HoloCard } from "@/components/ui/holo-card";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { Logo } from "@/components/ui/logo";
import { Mascot, type MascotPose } from "@/components/ui/mascot";
import { Nav } from "@/components/ui/nav";
import { navLinks } from "@/components/ui/nav-links";
import { Pill } from "@/components/ui/pill";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("designSystem");
  return {
    title: t("title"),
    // Internal reference page: keep it out of search engines.
    robots: { index: false, follow: false },
  };
}

// Token names, as written in globals.css: not translated.
const colors = [
  { name: "night", value: "#0a0d1f", className: "bg-night" },
  { name: "surface", value: "#12162e", className: "bg-surface" },
  { name: "line", value: "#2a2f55", className: "bg-line" },
  { name: "text", value: "#eef0fa", className: "bg-text" },
  { name: "muted", value: "#a3a8cb", className: "bg-muted" },
  { name: "subtle", value: "#6b7198", className: "bg-subtle" },
  { name: "red", value: "#ff3b3b", className: "bg-red" },
  { name: "red-hi", value: "#ff6767", className: "bg-red-hi" },
  { name: "amber", value: "#ffb000", className: "bg-amber" },
  { name: "mint", value: "#7cf2c0", className: "bg-mint" },
];

// Sample titles and covers from the mockups (not real anime). Like the real catalogue,
// which will come from AniList, titles and genres are data, not interface text.
const demoTitles = [
  { slug: "tsuki-to-kitsune", title: "Tsuki to Kitsune", genres: "Fantasy · Romance", score: 97 },
  { slug: "neon-ronin-2099", title: "Neon Ronin 2099", genres: "Sci-fi · Action", score: 93 },
  { slug: "hoshifuru-bakery", title: "Hoshifuru Bakery", genres: "Slice of life", score: 88 },
  { slug: "kage-no-ressha", title: "Kage no Ressha", genres: "Mystery · Thriller" },
  { slug: "last-bus-to-akihabara", title: "Last Bus to Akihabara", genres: "Comedy · Friendship" },
  { slug: "hyakki-academy", title: "Hyakki Academy", genres: "Supernatural · School" },
];

const demoGenres = ["Fantasy", "Romance", "Slice of life"];

const poses: MascotPose[] = ["point", "wave", "search", "read", "sleep"];

export default function DesignSystemPage() {
  const t = useTranslations("designSystem");

  return (
    <>
      <Nav user={{ name: "Aiko" }} currentPath="/" />

      <main className="mx-auto max-w-[1440px] space-y-20 px-4 py-16 sm:px-10">
        <header className="space-y-3">
          <p className="text-amber font-mono text-xs tracking-[0.14em] uppercase">
            {t("eyebrow")} · <span className="font-kanji">次</span>
          </p>
          <h1 className="font-display text-6xl leading-none uppercase sm:text-8xl">{t("title")}</h1>
          <p className="text-muted max-w-2xl text-lg">{t("intro")}</p>
        </header>

        <Section id="colours" title={t("colours")}>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {colors.map((color) => (
              <li key={color.name} className="space-y-2">
                <span
                  className={`${color.className} block h-20 rounded-2xl border border-white/10`}
                />
                <span className="block font-mono text-xs">{color.name}</span>
                <span className="text-subtle block font-mono text-xs">{color.value}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="typography" title={t("typography")}>
          <div className="space-y-4">
            <p className="font-display text-6xl leading-none uppercase">Big Shoulders Display</p>
            <p className="text-lg">{t("bodySample")}</p>
            <p className="text-amber font-mono text-xs tracking-[0.14em] uppercase">
              {t("labelSample")}
            </p>
            <p className="font-kanji text-5xl">未来子 次</p>
          </div>
        </Section>

        <Section id="logo" title={t("logo")}>
          <div className="flex flex-wrap items-end gap-16">
            <Logo />
            <Logo size="lg" />
          </div>
        </Section>

        <Section id="buttons" title={t("buttons")}>
          <div className="flex flex-wrap items-center gap-4">
            <Button>{t("primary")}</Button>
            <Button variant="red">{t("red")}</Button>
            <Button variant="glass">{t("glass")}</Button>
            <Button disabled>{t("disabled")}</Button>
            <ButtonLink href="/sign-in" variant="red">
              {t("linkButton")}
            </ButtonLink>
          </div>
        </Section>

        <Section id="pills" title={t("pills")}>
          <div className="flex flex-wrap gap-2">
            <Pill>{t("match", { score: 97 })}</Pill>
            {demoGenres.map((genre) => (
              <Pill key={genre}>{genre}</Pill>
            ))}
          </div>
        </Section>

        <Section id="holo-cards" title={t("holoCards")}>
          <p className="text-muted -mt-4 mb-6">{t("holoHint")}</p>
          <ul className="grid grid-cols-2 gap-6 sm:grid-cols-[repeat(auto-fill,210px)]">
            {demoTitles.map((item, index) => (
              <li key={item.slug}>
                <HoloCard
                  href="/design-system"
                  title={item.title}
                  subtitle={item.genres}
                  match={item.score ? t("match", { score: item.score }) : undefined}
                  coverSrc={`/demo-covers/${item.slug}.webp`}
                  preload={index < 3}
                />
              </li>
            ))}
          </ul>
        </Section>

        <Section id="navigation" title={t("navigation")}>
          <div className="space-y-4">
            {navLinks.map((link) => (
              <Nav
                key={link.href}
                currentPath={link.href}
                user={{ name: "Aiko" }}
                className="rounded-2xl border"
              />
            ))}
            <Nav currentPath="/sign-in" className="rounded-2xl border" />
          </div>
        </Section>

        <Section id="languages" title={t("languages")}>
          <LocaleSwitcher />
        </Section>

        <Section id="mascot" title={t("mascot")}>
          <div className="flex flex-wrap items-end gap-8">
            {poses.map((pose) => (
              <figure key={pose} className="space-y-2 text-center">
                <Mascot pose={pose} width={160} />
                <figcaption className="text-subtle font-mono text-xs">{pose}</figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-12 flex items-start gap-2">
            <Bubble>{t.rich("bubble", { em: (chunks) => <em>{chunks}</em> })}</Bubble>
            <Mascot pose="point" width={140} />
          </div>
        </Section>
      </main>

      <Footer />
    </>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`section-${id}`}>
      <h2
        id={`section-${id}`}
        className="font-display border-line mb-8 border-b pb-3 text-3xl uppercase"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
