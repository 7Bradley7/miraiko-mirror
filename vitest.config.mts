import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Resolve the "@/..." imports declared in tsconfig.json.
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
    server: {
      deps: {
        // next-intl imports "next/navigation" without a file extension: let Vite resolve it
        // (and apply the next/navigation mock of vitest.setup.ts).
        inline: ["next-intl"],
      },
    },
  },
});
