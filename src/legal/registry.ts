import type { LegalDocument, PolicySlug } from "./types";
import { termsOfService } from "./content/termsOfService";
import { privacyPolicy } from "./content/privacyPolicy";
import { refundPolicy } from "./content/refundPolicy";
import { disclaimer } from "./content/disclaimer";
import { cookiePolicy } from "./content/cookiePolicy";
import { copyrightPolicy } from "./content/copyrightPolicy";
import { acceptableUse } from "./content/acceptableUse";
import { responsibleGambling } from "./content/responsibleGambling";
import { amlKyc } from "./content/amlKyc";
import { methodology } from "./content/methodology";

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  termsOfService,
  privacyPolicy,
  refundPolicy,
  disclaimer,
  responsibleGambling,
  cookiePolicy,
  copyrightPolicy,
  acceptableUse,
  amlKyc,
  methodology,
];

export const LEGAL_DOCUMENT_BY_SLUG: Record<PolicySlug, LegalDocument> = Object.fromEntries(
  LEGAL_DOCUMENTS.map(doc => [doc.slug, doc]),
) as Record<PolicySlug, LegalDocument>;

export function getLegalDocument(slug: string): LegalDocument | undefined {
  return LEGAL_DOCUMENT_BY_SLUG[slug as PolicySlug];
}
