import type { LegalDocument } from "../types";

export const amlKyc: LegalDocument = {
  slug: "aml-kyc",
  title: "AML/KYC Statement",
  shortTitle: "AML/KYC Statement",
  summary: "How anti-money-laundering and identity-verification considerations apply to a subscription content business like Bet Lab.",
  version: "1.0",
  effectiveDate: "2026-07-23",
  sections: [
    {
      id: "nature-of-business",
      heading: "1. The Nature of Our Business",
      blocks: [
        { type: "list", items: [
          "Bet Lab sells digital subscriptions to football analysis content.",
          "Bet Lab does not accept wagers, and does not hold customer gambling balances.",
          "Bet Lab does not transfer betting winnings, and does not provide banking, remittance, lending, digital-wallet, or cryptocurrency services.",
        ] },
      ],
    },
    {
      id: "kyc-scope",
      heading: "2. Scope of Identity Verification",
      blocks: [
        { type: "paragraphs", items: [
          "Because Bet Lab does not move customer funds beyond a simple subscription payment, full bookmaker-style customer identity verification is not currently part of our normal subscription flow, except where required by law, risk, our payment provider, or a future change to our product.",
          "Our payment processor, Paystack, and the financial institutions involved in processing your payment apply their own verification, fraud-prevention and compliance controls independent of Bet Lab.",
        ] },
      ],
    },
    {
      id: "when-we-may-ask",
      heading: "3. When We May Request More Information",
      blocks: [
        { type: "paragraphs", items: ["We may request additional information from you where reasonably necessary to:"] },
        { type: "list", items: [
          "Investigate suspected fraud.",
          "Resolve a payment dispute or chargeback.",
          "Prevent abuse of the Platform.",
          "Comply with a lawful request from a regulator or law-enforcement body.",
          "Meet a requirement imposed by our payment provider.",
          "Verify age or identity in a specific, risk-based situation.",
        ] },
        { type: "paragraphs", items: [
          "We may suspend accounts or transactions we reasonably consider suspicious, and we will cooperate with valid legal and regulatory requests.",
        ] },
      ],
    },
    {
      id: "review-trigger",
      heading: "4. When This Statement Will Be Reviewed",
      blocks: [
        { type: "paragraphs", items: ["This statement will be reviewed and, if necessary, replaced with a fuller compliance program if Bet Lab later introduces any of the following:"] },
        { type: "list", items: [
          "User wallets or stored balances.",
          "Peer-to-peer transfers between users.",
          "Betting or wagering functionality.",
          "Prize payouts or affiliate commissions.",
          "Cash withdrawals.",
          "Cryptocurrency payments.",
          "Any other financial service.",
          "High-value transactions beyond ordinary subscription pricing.",
        ] },
      ],
    },
  ],
};
