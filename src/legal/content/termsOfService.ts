import type { LegalDocument } from "../types";

const EFFECTIVE_DATE = "2026-07-23";

export const termsOfService: LegalDocument = {
  slug: "terms-of-service",
  title: "Terms of Service",
  shortTitle: "Terms of Service",
  summary: "The contract between you and Bet Lab governing your use of the platform, your subscription, and our respective rights and responsibilities.",
  version: "1.0",
  effectiveDate: EFFECTIVE_DATE,
  sections: [
    {
      id: "introduction",
      heading: "1. Introduction and Definitions",
      blocks: [
        { type: "paragraphs", items: [
          "These Terms of Service (\"Terms\") govern your access to and use of Bet Lab, a football intelligence and sports-analysis subscription platform operated at betlabhq.com (the \"Website\", the \"Platform\", or the \"Service\").",
        ] },
        { type: "list", items: [
          "\"Bet Lab\" means the business operating the Platform.",
          "\"User\" means anyone who accesses the Platform, whether or not they hold an account.",
          "\"Account\" means a registered Bet Lab user profile.",
          "\"Subscriber\" means a User with an active paid Subscription.",
          "\"Subscription\" means a paid access plan granting time-limited access to Premium Content.",
          "\"Content\" means all text, analysis, statistics, graphics and data made available on the Platform.",
          "\"Prediction\" means an analytical opinion published by Bet Lab about a football fixture or market.",
          "\"Premium Content\" means Content restricted to Subscribers.",
          "\"Payment Processor\" means the third-party service (currently Paystack) that processes payments on Bet Lab's behalf.",
          "\"Applicable Law\" means the law of the Federal Republic of Nigeria and any other law that mandatorily applies to a given User.",
        ] },
      ],
    },
    {
      id: "acceptance",
      heading: "2. Acceptance of Terms",
      blocks: [
        { type: "paragraphs", items: [
          "By accessing the Platform, creating an Account, or purchasing a Subscription, you agree to be bound by these Terms and by our Terms of Use, Privacy Policy, Refund and Subscription Policy, Disclaimer and Responsible Use Policy, and Risk Disclosure Statement, each incorporated by reference.",
          "If you do not agree to these Terms, do not use the Platform.",
        ] },
      ],
    },
    {
      id: "eligibility",
      heading: "3. Eligibility",
      blocks: [
        { type: "list", items: [
          "You must have the legal capacity to enter into a binding contract under Applicable Law.",
          "You must provide truthful, accurate and current registration information.",
          "You must comply with the laws that apply to you in your own location, including any laws relating to sports-related content, gambling-adjacent services, or online subscriptions.",
          "The Platform is intended only for individuals aged 18 or older. By registering, you confirm that you meet this minimum age.",
          "Bet Lab may request reasonable confirmation of your age where there is a genuine reason to doubt it, but does not currently perform universal identity verification of every user.",
          "Bet Lab may suspend or terminate an Account where it reasonably believes eligibility information provided was false.",
        ] },
      ],
    },
    {
      id: "accounts",
      heading: "4. User Accounts",
      blocks: [
        { type: "list", items: [
          "You are responsible for the accuracy of the information you register with and for keeping it up to date.",
          "You are responsible for maintaining the confidentiality of your password and for all activity that occurs under your Account.",
          "You must notify us promptly at " + "support@betlabhq.com" + " if you suspect unauthorised access to your Account.",
          "Accounts are intended for use by one individual. Sharing login credentials or Subscription access with others is not permitted.",
          "You may request account deactivation at any time by contacting support.",
          "We may suspend or terminate an Account for the reasons set out in Section 13 (Suspension and Termination).",
        ] },
      ],
    },
    {
      id: "services",
      heading: "5. The Services",
      blocks: [
        { type: "paragraphs", items: [
          "Bet Lab sells access to football match analysis, statistical insights, match previews, prediction content, confidence ratings, historical prediction records and related educational sports content.",
          "Bet Lab is not a bookmaker, casino, sportsbook, betting exchange or gambling operator. Bet Lab does not accept wagers, place bets on your behalf, hold gambling funds, maintain betting wallets, pay gambling winnings, settle bets or operate casino games.",
          "Bet Lab does not act as your financial adviser, investment adviser, or as an agent of any bookmaker.",
        ] },
      ],
    },
    {
      id: "predictions",
      heading: "6. Predictions and Analytical Content",
      blocks: [
        { type: "list", items: [
          "Predictions are analytical opinions, not guarantees.",
          "Predictions are based on available information, statistical interpretation, and human and/or automated analysis at the time of publication.",
          "Sporting events are inherently uncertain. No Prediction is guaranteed to be correct.",
          "Past prediction performance does not guarantee future results.",
          "Odds, team news and match information may change after a Prediction is published. You are responsible for independently verifying time-sensitive information before making any decision.",
        ] },
        { type: "callout", variant: "info", text: "See our dedicated Risk Disclosure Statement and Prediction Methodology page for a full explanation of how Predictions are produced and what their limitations are." },
      ],
    },
    {
      id: "subscriptions",
      heading: "7. Subscription Plans",
      blocks: [
        { type: "list", items: [
          "Bet Lab offers a free tier and one or more paid Subscription plans, each with its own duration, price and feature set as displayed on the Pricing page at the time of purchase.",
          "We may introduce, modify, or retire plans and features from time to time. Changes do not affect a Subscription you have already paid for until it expires.",
          "You may upgrade or purchase an additional plan at any time; a new Subscription period begins after any period you currently have access to, rather than overlapping it.",
          "Subscriptions do not automatically renew unless this is expressly shown to you at checkout for the specific plan you select. Where a plan is not shown as auto-renewing, you must manually purchase a new Subscription period to continue access after expiry.",
          "Access to Premium Content ends when your Subscription expires, subject to any grace period displayed in your account dashboard.",
          "Prices are shown in Nigerian Naira (NGN) unless stated otherwise. Any applicable taxes will be identified at checkout where relevant.",
        ] },
      ],
    },
    {
      id: "payments",
      heading: "8. Payments",
      blocks: [
        { type: "list", items: [
          "Payments are processed by Paystack, an independent third-party Payment Processor. Bet Lab does not store your complete card details; these are handled directly by Paystack.",
          "By subscribing, you authorise Bet Lab to charge the amount displayed at checkout via the Payment Processor.",
          "Subscription access is activated once payment is verified as successful, either through the Payment Processor's redirect confirmation or its webhook notification.",
          "If a transaction fails, is duplicated, or is flagged as suspicious, Bet Lab may decline to activate or may reverse the associated Subscription pending investigation.",
          "Payment records are retained for accounting, fraud-prevention and legal-compliance purposes as described in our Privacy Policy.",
          "Chargebacks initiated without first contacting Bet Lab support may result in Account suspension while the matter is investigated.",
        ] },
        { type: "callout", variant: "info", text: "Bet Lab does not claim PCI-DSS compliance in its own right; card-data handling is performed by Paystack under its own compliance program." },
      ],
    },
    {
      id: "refunds",
      heading: "9. Refunds",
      blocks: [
        { type: "paragraphs", items: [
          "Refunds are governed by our separate Refund and Subscription Policy, which forms part of these Terms. Nothing in these Terms or that policy removes any statutory consumer right that cannot lawfully be waived.",
        ] },
      ],
    },
    {
      id: "ip",
      heading: "10. Intellectual Property",
      blocks: [
        { type: "paragraphs", items: [
          "The Bet Lab name, logo, branding, website design, source code, Prediction content, written analysis, graphics, databases and compilations of statistics are the property of Bet Lab or its licensors and are protected by copyright, trademark and other intellectual-property laws.",
          "Subject to your compliance with these Terms, Bet Lab grants you a limited, personal, non-exclusive, non-transferable licence to view Content for your own personal, non-commercial use.",
        ] },
      ],
    },
    {
      id: "restrictions",
      heading: "11. Restrictions",
      blocks: [
        { type: "paragraphs", items: ["You must not:"] },
        { type: "list", items: [
          "Resell, republish or redistribute Predictions or Premium Content, including in paid Telegram/WhatsApp groups or on social media.",
          "Share Subscription access or credentials with people who have not paid for their own Subscription.",
          "Scrape, crawl or use bots or automated tools to extract Content.",
          "Attempt credential stuffing, reverse engineering, or circumvention of access controls.",
          "Engage in fraud, impersonation, or malicious activity, or interfere with Platform security.",
          "Infringe Bet Lab's or any third party's intellectual property.",
          "Use the Platform for any unlawful purpose.",
        ] },
      ],
    },
    {
      id: "third-party",
      heading: "12. Third-Party Services",
      blocks: [
        { type: "paragraphs", items: [
          "The Platform relies on and may link to third-party services, including Paystack (payments), email-delivery providers, hosting providers, analytics services, and football-data sources. It may also link to external bookmakers or websites for convenience (for example, live-score providers).",
          "These third parties operate under their own terms and privacy policies, which we encourage you to review. Bet Lab is not responsible for the content, accuracy, or practices of third-party services or websites.",
        ] },
      ],
    },
    {
      id: "availability",
      heading: "13. Availability",
      blocks: [
        { type: "list", items: [
          "The Platform may be unavailable from time to time for maintenance, updates, security events, or due to failures of our hosting or data providers.",
          "We do not guarantee uninterrupted or error-free service.",
          "We are not liable for delay or failure to perform caused by events beyond our reasonable control (force majeure), including internet, hosting, or payment-provider outages.",
        ] },
      ],
    },
    {
      id: "disclaimers",
      heading: "14. Disclaimers",
      blocks: [
        { type: "paragraphs", items: [
          "The Platform and its Content are provided \"as is\" and \"as available\", without warranties of any kind, whether express or implied, including implied warranties of merchantability, fitness for a particular purpose, or non-infringement, except where such warranties cannot be lawfully excluded.",
          "We do not warrant that Predictions will be accurate, that the Platform will be error-free, or that any particular result will be achieved from using the Service.",
        ] },
      ],
    },
    {
      id: "liability",
      heading: "15. Limitation of Liability",
      blocks: [
        { type: "paragraphs", items: [
          "To the maximum extent permitted by Applicable Law, Bet Lab's total liability arising out of or relating to these Terms or the Service is limited to the amount you paid to Bet Lab in the twelve months preceding the event giving rise to the claim.",
          "Nothing in these Terms excludes or limits liability for fraud, wilful misconduct, death or personal injury caused by negligence, or any other liability that cannot lawfully be excluded or limited under Applicable Law.",
          "We are not liable for losses you incur from betting or gambling decisions made independently of the Platform, whether or not informed by our Content. See our Risk Disclosure Statement.",
        ] },
      ],
    },
    {
      id: "indemnity",
      heading: "16. Indemnity",
      blocks: [
        { type: "paragraphs", items: [
          "You agree to indemnify Bet Lab against reasonable losses, damages and expenses arising from your breach of these Terms or your misuse of the Platform, except to the extent caused by Bet Lab's own breach or negligence.",
        ] },
      ],
    },
    {
      id: "suspension",
      heading: "17. Suspension and Termination",
      blocks: [
        { type: "paragraphs", items: ["We may suspend or terminate your Account, with or without notice where reasonably necessary, for:"] },
        { type: "list", items: [
          "Suspected fraud or payment abuse.",
          "Account sharing or reselling Content.",
          "Intellectual-property violations.",
          "Security threats to the Platform or other users.",
          "Any other prohibited use under these Terms or our Acceptable Use Policy.",
          "Compliance with a legal obligation.",
        ] },
        { type: "paragraphs", items: [
          "Where we suspend or terminate an Account, you may contact " + "support@betlabhq.com" + " to request an explanation or to appeal the decision.",
        ] },
      ],
    },
    {
      id: "governing-law",
      heading: "18. Governing Law and Disputes",
      blocks: [
        { type: "list", items: [
          "These Terms are governed by the laws of the Federal Republic of Nigeria, without regard to conflict-of-law principles.",
          "If a dispute arises, please contact us first at " + "legal@betlabhq.com" + " so we can attempt to resolve it informally and in good faith.",
          "Subject to any mandatory consumer-protection rights you may have in your own jurisdiction, the courts of Nigeria shall have jurisdiction over any dispute that cannot be resolved informally.",
        ] },
      ],
    },
    {
      id: "amendments",
      heading: "19. Amendments",
      blocks: [
        { type: "list", items: [
          "We may update these Terms from time to time. Each version carries a version number and effective date.",
          "For material changes, we will take reasonable steps to notify active Subscribers and may require re-acceptance before you can continue using paid features.",
          "Continued use of the Platform after a non-material update constitutes acceptance of the revised Terms.",
        ] },
      ],
    },
    {
      id: "contact",
      heading: "20. Contact Information",
      blocks: [
        { type: "list", items: [
          "Business name: Bet Lab",
          "Website: https://www.betlabhq.com",
          "Support: support@betlabhq.com",
          "Legal: legal@betlabhq.com",
          "Privacy: privacy@betlabhq.com",
        ] },
        { type: "callout", variant: "info", text: "A registered business address and telephone number will be published here once confirmed by the business owner. See the Owner Checklist for outstanding items." },
      ],
    },
  ],
};
