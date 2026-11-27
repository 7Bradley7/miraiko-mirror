import type messages from "../../messages/en.json";
import type { routing } from "./routing";

// Type-safe translations: a missing or misspelled key is a TypeScript error.
// English is the reference; fr.json must have the same keys (checked by a test).
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
