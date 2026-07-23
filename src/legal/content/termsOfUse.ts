import type { LegalDocument } from "../types";

export const termsOfUse: LegalDocument = {
  slug: "terms-of-use",
  title: "Terms of Use",
  shortTitle: "Terms of Use",
  summary: "Practical rules for how you may use the Bet Lab platform day to day, alongside the Terms of Service.",
  version: "1.0",
  effectiveDate: "2026-07-23",
  sections: [
    {
      id: "permitted-use",
      heading: "1. Permitted Personal Use",
      blocks: [
        { type: "paragraphs", items: [
          "Your Subscription grants you a personal licence to view Content for your own use. You may not use Bet Lab Content for any commercial purpose without our prior written permission.",
        ] },
      ],
    },
    {
      id: "account-integrity",
      heading: "2. Account Integrity and Sharing",
      blocks: [
        { type: "list", items: [
          "Each Account and Subscription is for one individual.",
          "Sharing your login, screenshotting and distributing Premium Content, or otherwise granting access to people who have not subscribed is prohibited.",
          "We may apply device or session controls to detect and limit shared-account use.",
        ] },
      ],
    },
    {
      id: "content-restrictions",
      heading: "3. Copying and Redistributing Content",
      blocks: [
        { type: "paragraphs", items: ["The following are prohibited without our prior written permission:"] },
        { type: "list", items: [
          "Copying or screenshotting Premium Content for republication.",
          "Redistributing Content on social media, Telegram, WhatsApp or other channels.",
          "Reselling Predictions individually or in bulk.",
          "Operating a paid group, channel or service built on Bet Lab Content.",
          "Using Bet Lab Content to build a competing dataset or product.",
        ] },
      ],
    },
    {
      id: "technical-abuse",
      heading: "4. Technical Abuse",
      blocks: [
        { type: "paragraphs", items: ["You must not:"] },
        { type: "list", items: [
          "Scrape, crawl, or use bots or other automated means to access the Platform or its API.",
          "Circumvent rate limits or other technical access controls.",
          "Reverse engineer the Platform's software.",
          "Conduct security testing against the Platform without our prior written permission.",
          "Attempt to steal credentials, phish users, or distribute malware.",
          "Conduct denial-of-service or similar attacks against our infrastructure.",
        ] },
      ],
    },
    {
      id: "conduct",
      heading: "5. Conduct and Integrity",
      blocks: [
        { type: "list", items: [
          "Do not commit fraud or payment abuse, including chargeback abuse.",
          "Do not harass, threaten, or abuse other users or Bet Lab staff.",
          "Do not impersonate Bet Lab or any other person or entity.",
          "Do not misrepresent a relationship or partnership with Bet Lab.",
          "Do not use the Platform for any illegal purpose, including operating an unlicensed gambling business.",
          "Persons under 18 must not use the Platform.",
        ] },
      ],
    },
    {
      id: "enforcement",
      heading: "6. Enforcement",
      blocks: [
        { type: "paragraphs", items: [
          "Depending on severity, breaches of this policy may result in a warning, temporary suspension, permanent suspension, content takedown, and/or referral for legal action where appropriate.",
          "To report suspected abuse of the Platform or misuse of Bet Lab Content, email support@betlabhq.com.",
        ] },
      ],
    },
  ],
};
