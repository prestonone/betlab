import { describe, expect, it } from "vitest";
import { LEGAL_DOCUMENTS } from "./registry";

const sitemapModules = import.meta.glob("../../public/sitemap.xml", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const sitemap = Object.values(sitemapModules)[0];

describe("sitemap.xml legal entries", () => {
  it("was found on disk", () => {
    expect(sitemap).toBeTruthy();
  });

  it("lists every current policy document", () => {
    for (const doc of LEGAL_DOCUMENTS) {
      expect(sitemap).toContain(`https://www.betlabhq.com/legal/${doc.slug}</loc>`);
    }
  });

  it("does not list the merged-away terms-of-use or risk-disclosure documents", () => {
    expect(sitemap).not.toContain("/legal/terms-of-use<");
    expect(sitemap).not.toContain("/legal/risk-disclosure<");
  });
});
