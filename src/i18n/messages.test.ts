import { describe, expect, it } from "vitest";

import en from "../../messages/en.json";
import fr from "../../messages/fr.json";

/** Every key of a messages file, as "section.key". */
function keysOf(messages: object, prefix = ""): string[] {
  return Object.entries(messages).flatMap(([key, value]) =>
    typeof value === "object" && value !== null
      ? keysOf(value, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

/** Placeholders and tags of a message: "Hi {name}, <strong>…</strong>" → {name}, <strong>. */
function partsOf(message: string): string[] {
  return [...message.matchAll(/\{\w+\}|<\/?\w+>/g)].map((match) => match[0]).sort();
}

function valueAt(messages: object, key: string): string {
  return key
    .split(".")
    .reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], messages) as string;
}

describe("translation files", () => {
  it("have the same keys in French as in English", () => {
    expect(keysOf(fr).sort()).toEqual(keysOf(en).sort());
  });

  it("keep the same placeholders and tags in every translation", () => {
    for (const key of keysOf(en)) {
      expect(partsOf(valueAt(fr, key)), key).toEqual(partsOf(valueAt(en, key)));
    }
  });

  it("have no empty message", () => {
    for (const messages of [en, fr]) {
      for (const key of keysOf(messages)) {
        expect(valueAt(messages, key).trim(), key).not.toBe("");
      }
    }
  });
});
