import { describe, expect, it } from "vitest";
import { LEGAL_DOCUMENTS, getLegalDocument } from "./registry";

describe("legal document registry", () => {
  it("contains exactly the 12 required policy documents", () => {
    expect(LEGAL_DOCUMENTS).toHaveLength(12);
  });

  it("has a unique slug per document", () => {
    const slugs = LEGAL_DOCUMENTS.map(d => d.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("resolves every document by its slug", () => {
    for (const doc of LEGAL_DOCUMENTS) {
      expect(getLegalDocument(doc.slug)?.title).toBe(doc.title);
    }
  });

  it("returns undefined for an unknown slug", () => {
    expect(getLegalDocument("not-a-real-policy")).toBeUndefined();
  });

  it("every document has a version, effective date and at least one section", () => {
    for (const doc of LEGAL_DOCUMENTS) {
      expect(doc.version).toBeTruthy();
      expect(doc.effectiveDate).toBeTruthy();
      expect(doc.sections.length).toBeGreaterThan(0);
    }
  });

  it("every section has a unique id within its document", () => {
    for (const doc of LEGAL_DOCUMENTS) {
      const ids = doc.sections.map(s => s.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});
