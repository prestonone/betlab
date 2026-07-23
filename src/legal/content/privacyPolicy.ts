import type { LegalDocument } from "../types";

export const privacyPolicy: LegalDocument = {
  slug: "privacy",
  title: "Privacy Policy",
  shortTitle: "Privacy Policy",
  summary: "How Bet Lab collects, uses, shares and protects your personal information.",
  version: "1.0",
  effectiveDate: "2026-07-23",
  sections: [
    {
      id: "data-collected",
      heading: "1. Data We Collect",
      blocks: [
        { type: "paragraphs", items: ["We collect the following categories of information, only where applicable to how you use the Platform:"] },
        { type: "list", items: [
          "Account data: name, username, email address, and a securely hashed password (we never store your password in plain text).",
          "Subscription and billing data: your selected plan, billing country, subscription status and dates, and payment references and status.",
          "Payment records: transaction reference, amount, currency, status, and limited metadata returned by our payment processor (such as payment channel). We do not store your complete card number, CVV or banking credentials.",
          "Consent records: which version of each policy you accepted, when, from what context (e.g. signup or checkout), and your IP address and browser user-agent at that moment, so we can demonstrate consent if ever required to.",
          "Marketing preference: whether you have opted in or out of marketing communications.",
          "Support correspondence: messages you send to our support or legal email addresses.",
          "Technical data: IP address and browser/device user-agent string, collected as part of normal web server operation and the consent records above.",
        ] },
      ],
    },
    {
      id: "data-not-collected",
      heading: "2. Data We Do Not Collect Directly",
      blocks: [
        { type: "paragraphs", items: [
          "Complete payment card details are processed directly by Paystack, our payment processor, and are not transmitted to or stored on Bet Lab's own servers.",
          "We do not currently use third-party web analytics or advertising-tracking cookies on the Platform.",
        ] },
      ],
    },
    {
      id: "purposes",
      heading: "3. How We Use Your Information",
      blocks: [
        { type: "list", items: [
          "Creating and administering your Account.",
          "Authenticating you and keeping your session secure.",
          "Managing your Subscription and processing payments.",
          "Verifying payments and preventing fraud.",
          "Responding to support requests.",
          "Maintaining security and investigating abuse.",
          "Complying with legal obligations.",
          "Improving the Platform.",
          "Sending you service-related communications (always) and marketing communications (only if you have opted in).",
          "Keeping records required for accounting, dispute-resolution and legal-compliance purposes.",
          "Enforcing our Terms of Service, Terms of Use and Acceptable Use Policy.",
        ] },
      ],
    },
    {
      id: "lawful-basis",
      heading: "4. Why We Are Allowed to Process Your Data",
      blocks: [
        { type: "list", items: [
          "Contract: to provide the Account and Subscription you have requested.",
          "Consent: for marketing communications and for the specific policy-consent records described above.",
          "Legal obligation: to keep records required by tax, consumer-protection or other applicable law.",
          "Legitimate interests: to keep the Platform secure, prevent fraud, and improve our service, balanced against your rights.",
        ] },
      ],
    },
    {
      id: "sharing",
      heading: "5. Sharing and Processors",
      blocks: [
        { type: "paragraphs", items: ["We share data only with service providers who help us run the Platform, and only to the extent necessary:"] },
        { type: "list", items: [
          "Paystack - to process payments and verify transactions.",
          "Resend - to deliver transactional emails such as verification and password-reset messages.",
          "Render - to host our backend application and database connection.",
          "Vercel - to host our frontend website.",
          "Supabase - to host our production database.",
          "Professional advisers (e.g. accountants or lawyers) where reasonably necessary.",
          "Regulators or law enforcement, where legally required to disclose information.",
        ] },
        { type: "paragraphs", items: ["We do not sell your personal information."] },
      ],
    },
    {
      id: "international",
      heading: "6. International Processing",
      blocks: [
        { type: "paragraphs", items: [
          "Our infrastructure providers (including Render, Vercel and Supabase) may process data on servers located outside your own country. Where this occurs, we rely on those providers' own security and contractual safeguards.",
        ] },
      ],
    },
    {
      id: "retention",
      heading: "7. Data Retention",
      blocks: [
        { type: "list", items: [
          "Active account data is kept for as long as your Account exists.",
          "Payment and billing records are kept for as long as reasonably necessary for accounting, tax and dispute-resolution purposes, consistent with Applicable Law.",
          "Policy-acceptance and consent records are kept indefinitely as an append-only audit trail, since they may be needed to demonstrate compliance at any future point.",
          "Support correspondence is kept for as long as reasonably necessary to resolve your query and for a reasonable period afterward.",
          "If you close your Account, we retain the minimum data necessary to comply with legal, accounting and fraud-prevention obligations, and delete or anonymise the rest within a reasonable period.",
        ] },
      ],
    },
    {
      id: "security",
      heading: "8. Security",
      blocks: [
        { type: "paragraphs", items: [
          "We use reasonable technical and organisational measures to protect your data, including password hashing, encrypted connections (HTTPS), and access controls on our systems. No method of transmission or storage is completely secure, and we cannot guarantee absolute security.",
        ] },
      ],
    },
    {
      id: "rights",
      heading: "9. Your Rights",
      blocks: [
        { type: "paragraphs", items: ["Subject to Applicable Law, you may have the right to:"] },
        { type: "list", items: [
          "Access the personal data we hold about you.",
          "Correct inaccurate data.",
          "Request deletion of your data, subject to our legal and accounting retention needs.",
          "Object to or request restriction of certain processing.",
          "Withdraw marketing consent at any time.",
          "Request a copy of your data in a portable format, where applicable.",
          "Lodge a complaint with a relevant data-protection authority.",
        ] },
        { type: "paragraphs", items: ["To exercise any of these rights, email privacy@betlabhq.com."] },
      ],
    },
    {
      id: "children",
      heading: "10. Children",
      blocks: [
        { type: "paragraphs", items: ["The Platform is not intended for, and we do not knowingly collect data from, persons under 18 years old."] },
      ],
    },
    {
      id: "cookies",
      heading: "11. Cookies",
      blocks: [
        { type: "paragraphs", items: ["See our separate Cookie Policy for details of the cookies used to keep you signed in and secure."] },
      ],
    },
    {
      id: "changes",
      heading: "12. Changes to This Policy",
      blocks: [
        { type: "paragraphs", items: [
          "We may update this Privacy Policy from time to time. Each version carries a version number and effective date. Material changes will be highlighted to active users where reasonably practical.",
        ] },
      ],
    },
    {
      id: "regulator",
      heading: "13. Regulator",
      blocks: [
        { type: "paragraphs", items: [
          "Nigerian users may also refer to the Nigeria Data Protection Commission (NDPC) for information about their data-protection rights. Referencing the NDPC here does not imply any endorsement of Bet Lab by that body.",
        ] },
      ],
    },
  ],
};
