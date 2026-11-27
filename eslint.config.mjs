import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Single AniList data access layer (MRK-19, ADR-1): only src/lib/anilist/ talks to the
  // AniList API. Pages read the catalogue through src/lib/anilist/catalog.ts (cached).
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/anilist/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/anilist/client", "@/lib/anilist/media"],
              // Types (MediaSummary…) stay importable.
              allowTypeImports: true,
              message:
                "Read AniList through @/lib/anilist/catalog (cached) or the other functions of src/lib/anilist/.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/graphql\\.anilist\\.co/]",
          message: "Only src/lib/anilist/client.ts calls the AniList API.",
        },
      ],
    },
  },
  // Disable ESLint rules that conflict with Prettier formatting (keep last).
  prettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "src/generated/**"]),
]);

export default eslintConfig;
