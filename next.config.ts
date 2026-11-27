import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Loads src/i18n/request.ts (language and messages of each request).
const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // AniList covers and banners (loaded straight from AniList, see HoloCard `unoptimized`).
    remotePatterns: [new URL("https://s4.anilist.co/file/anilistcdn/**")],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
