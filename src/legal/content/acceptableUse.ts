import type { LegalDocument } from "../types";

export const acceptableUse: LegalDocument = {
  slug: "acceptable-use",
  title: "Acceptable Use Policy",
  shortTitle: "Acceptable Use Policy",
  summary: "The baseline rules of conduct that apply to everyone using the Bet Lab platform.",
  version: "1.0",
  effectiveDate: "2026-07-23",
  sections: [
    {
      id: "lawful-use",
      heading: "1. Lawful Use Only",
      blocks: [
        { type: "paragraphs", items: ["You must use the Platform only for lawful purposes and in a way that does not infringe the rights of, or restrict or inhibit the use and enjoyment of, the Platform by anyone else."] },
      ],
    },
    {
      id: "account-security",
      heading: "2. Account Integrity and Security",
      blocks: [
        { type: "list", items: [
          "Do not share your Account credentials or Subscription access.",
          "Do not attempt to gain unauthorised access to another user's Account.",
          "Do not attempt credential-stuffing, phishing, or other credential-attack techniques against Bet Lab or its users.",
        ] },
      ],
    },
    {
      id: "fraud-abuse",
      heading: "3. Fraud and Payment Abuse",
      blocks: [
        { type: "list", items: [
          "Do not use stolen or unauthorised payment details.",
          "Do not initiate a chargeback in bad faith after receiving the Service you paid for.",
          "Do not attempt to obtain Subscription access without valid payment.",
        ] },
      ],
    },
    {
      id: "technical",
      heading: "4. Technical Abuse",
      blocks: [
        { type: "list", items: [
          "Do not scrape, crawl, or use bots or other automated tools against the Platform or its API without our written permission.",
          "Do not attempt to circumvent access controls, rate limits, or paywalls.",
          "Do not reverse engineer our software.",
          "Do not introduce malware, or conduct denial-of-service or similar attacks.",
          "Do not harvest data about other users.",
        ] },
      ],
    },
    {
      id: "content-conduct",
      heading: "5. Content and Conduct",
      blocks: [
        { type: "list", items: [
          "Do not harass, threaten, or post hateful content toward other users or Bet Lab staff.",
          "Do not impersonate any person or entity, or misrepresent your affiliation with Bet Lab.",
          "Do not infringe anyone's copyright or other intellectual-property rights.",
          "Do not resell, share, or commercially exploit Bet Lab Content in breach of our Copyright and Intellectual Property Policy.",
          "Do not advertise unrelated products or services on the Platform without permission.",
        ] },
      ],
    },
    {
      id: "gambling-minors",
      heading: "6. Illegal Gambling and Minors",
      blocks: [
        { type: "list", items: [
          "Do not use Bet Lab to operate an unlicensed gambling business.",
          "Persons under 18 must not use the Platform.",
        ] },
      ],
    },
    {
      id: "enforcement",
      heading: "7. Enforcement and Reporting",
      blocks: [
        { type: "paragraphs", items: [
          "Breaches of this policy may result in a warning, suspension, termination, content removal, and/or referral to law enforcement, depending on severity.",
          "To report abuse, email support@betlabhq.com.",
        ] },
      ],
    },
  ],
};
