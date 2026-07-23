export type PolicySlug =
  | "terms-of-service"
  | "privacy"
  | "refund-policy"
  | "disclaimer"
  | "cookies"
  | "copyright"
  | "acceptable-use"
  | "responsible-gambling"
  | "aml-kyc"
  | "methodology";

export interface LegalCalloutBlock {
  type: "callout";
  variant: "info" | "warning" | "danger";
  text: string;
}

export interface LegalListBlock {
  type: "list";
  items: string[];
  ordered?: boolean;
}

export interface LegalParagraphsBlock {
  type: "paragraphs";
  items: string[];
}

export type LegalBlock = LegalParagraphsBlock | LegalListBlock | LegalCalloutBlock;

export interface LegalSectionData {
  id: string;
  heading: string;
  blocks: LegalBlock[];
}

export interface LegalDocument {
  slug: PolicySlug;
  title: string;
  shortTitle: string;
  summary: string;
  version: string;
  effectiveDate: string;
  sections: LegalSectionData[];
}
