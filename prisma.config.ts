import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";

// Load .env.local and the other .env* files the same way Next.js does,
// so the Prisma CLI and the app read the same variables.
loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // Migrations use the direct (unpooled) connection. The URLs are optional so that
  // `prisma generate` also works without a database (CI install, Vercel build).
  datasource: {
    url: process.env.DATABASE_URL_UNPOOLED,
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
