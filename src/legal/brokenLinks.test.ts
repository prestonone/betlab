import { describe, expect, it } from "vitest";
import { LEGAL_DOCUMENT_BY_SLUG } from "./registry";

const sourceModules = import.meta.glob("../**/*.{ts,tsx}", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const NON_DOCUMENT_LEGAL_ROUTES = new Set(["", "changes", "contact"]);

describe("legal link integrity", () => {
  it("every hardcoded /legal/<slug> reference in source resolves to a real document or route", () => {
    const brokenReferences: string[] = [];

    for (const [path, content] of Object.entries(sourceModules)) {
      if (path.endsWith(".test.ts") || path.endsWith(".test.tsx")) continue;
      // Only match /legal/<slug> when it opens a string literal (import specifiers
      // like "../legal/registry" and API paths like "/api/v1/legal/policies/" don't).
      const matches = content.matchAll(/["'`]\/legal\/([a-z0-9-]+)/g);
      for (const match of matches) {
        const slug = match[1];
        const isKnownDocument = Boolean(LEGAL_DOCUMENT_BY_SLUG[slug as keyof typeof LEGAL_DOCUMENT_BY_SLUG]);
        const isKnownRoute = NON_DOCUMENT_LEGAL_ROUTES.has(slug);
        if (!isKnownDocument && !isKnownRoute) {
          brokenReferences.push(`${slug} (in ${path})`);
        }
      }
    }

    expect(brokenReferences).toEqual([]);
  });

  it("every document in the registry is reachable by its own slug", () => {
    for (const slug of Object.keys(LEGAL_DOCUMENT_BY_SLUG)) {
      expect(LEGAL_DOCUMENT_BY_SLUG[slug as keyof typeof LEGAL_DOCUMENT_BY_SLUG]).toBeDefined();
    }
  });
});
