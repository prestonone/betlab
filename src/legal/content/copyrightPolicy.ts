import type { LegalDocument } from "../types";

export const copyrightPolicy: LegalDocument = {
  slug: "copyright",
  title: "Copyright and Intellectual Property Policy",
  shortTitle: "Copyright & IP Policy",
  summary: "Ownership of Bet Lab's content and brand, permitted use, and how to report infringement.",
  version: "1.0",
  effectiveDate: "2026-07-23",
  sections: [
    {
      id: "ownership",
      heading: "1. Ownership",
      blocks: [
        { type: "paragraphs", items: [
          "The Bet Lab name, logo and branding, our website design, our software, our written analysis and Prediction content, our graphics, and our databases and compilations of statistics are owned by Bet Lab or its licensors and protected under applicable copyright, trademark and database rights.",
        ] },
      ],
    },
    {
      id: "permitted-use",
      heading: "2. Permitted Personal Use",
      blocks: [
        { type: "paragraphs", items: [
          "You may view and use Content for your own personal, non-commercial purposes as part of your Subscription. Any other use requires our prior written permission.",
        ] },
      ],
    },
    {
      id: "prohibited",
      heading: "3. Prohibited Use",
      blocks: [
        { type: "list", items: [
          "Republishing Predictions or analysis, in whole or in part, on another website, app, or social channel.",
          "Reselling premium predictions individually or in bulk.",
          "Creating a paid Telegram, WhatsApp or similar group built on Bet Lab content.",
          "Automated or bulk copying of our Content.",
          "Presenting Bet Lab Content as your own without attribution.",
        ] },
      ],
    },
    {
      id: "attribution",
      heading: "4. Attribution",
      blocks: [
        { type: "paragraphs", items: [
          "Where we permit limited quotation of our Content (for example, for legitimate news commentary), you must clearly credit \"Bet Lab\" and link back to betlabhq.com.",
        ] },
      ],
    },
    {
      id: "reporting",
      heading: "5. Reporting Infringement",
      blocks: [
        { type: "paragraphs", items: [
          "If you believe someone is infringing Bet Lab's intellectual property, or that Bet Lab is infringing yours, email legal@betlabhq.com with:",
        ] },
        { type: "list", items: [
          "A description of the copyrighted work or content concerned.",
          "The location of the infringing material (a URL or screenshot).",
          "Your contact details.",
          "A statement that you believe in good faith that the use is not authorised.",
        ] },
        { type: "paragraphs", items: [
          "We follow a takedown-notice process similar in structure to a DMCA notice, but requests are handled under the law applicable to Bet Lab, not automatically under United States law. Where appropriate, the affected party will be given an opportunity to respond with a counter-notice before content is permanently removed.",
          "Repeat or serious infringers may have their Account suspended or terminated. We take false or bad-faith infringement claims seriously and may take action against those who submit them.",
        ] },
      ],
    },
  ],
};
