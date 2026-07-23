import type { LegalDocument } from "../types";

export const refundPolicy: LegalDocument = {
  slug: "refund-policy",
  title: "Refund and Subscription Policy",
  shortTitle: "Refund & Subscription Policy",
  summary: "How billing, renewal, cancellation and refunds work for Bet Lab subscriptions.",
  version: "1.0",
  effectiveDate: "2026-07-23",
  sections: [
    {
      id: "billing",
      heading: "1. Subscription Access and Billing",
      blocks: [
        { type: "list", items: [
          "Each Subscription grants access for the billing period shown at checkout (for example, daily, weekly, monthly, quarterly, or longer).",
          "Access is activated once your payment is confirmed successful by our payment processor, Paystack.",
          "Subscriptions do not automatically renew unless this is explicitly shown to you at checkout for the plan you select. Where auto-renewal is not shown, you must manually purchase a new period to keep access after your current period ends.",
        ] },
      ],
    },
    {
      id: "cancellation",
      heading: "2. Cancellation and Expiry",
      blocks: [
        { type: "list", items: [
          "Because Subscriptions do not auto-renew by default, there is normally nothing to \"cancel\" - simply do not purchase another period.",
          "If a plan does display auto-renewal, you may cancel it at any time before the renewal date from your account, and it will not renew again; you keep access until the end of the period you already paid for.",
          "Once a Subscription expires, access to Premium Content ends, subject to any grace period shown in your dashboard.",
        ] },
      ],
    },
    {
      id: "plan-changes",
      heading: "3. Upgrades, Downgrades and Pricing Changes",
      blocks: [
        { type: "list", items: [
          "You may purchase a higher-tier plan at any time; the new period is added on top of any remaining access rather than overlapping it.",
          "We may change plan pricing or features going forward. Changes do not retroactively affect a period you have already paid for.",
          "Promotional pricing applies only to the period stated in the promotion and does not create an ongoing entitlement.",
        ] },
      ],
    },
    {
      id: "payment-issues",
      heading: "4. Payment Issues",
      blocks: [
        { type: "list", items: [
          "Failed payments do not activate a Subscription and are not charged.",
          "If a payment is pending or unconfirmed, access is not granted until it is confirmed successful.",
          "If you believe you were charged twice for the same Subscription period, or charged an incorrect amount, contact support@betlabhq.com with your payment reference.",
          "Chargebacks and payment disputes should be raised with us directly first wherever possible, so we can investigate and resolve the issue quickly.",
        ] },
      ],
    },
    {
      id: "refund-eligible",
      heading: "5. When a Refund Is Available",
      blocks: [
        { type: "paragraphs", items: ["Subject to Applicable Law, we will consider a refund in cases such as:"] },
        { type: "list", items: [
          "A verified duplicate payment for the same Subscription period.",
          "Payment taken but the Subscription was never activated due to a technical fault on our side.",
          "A material service failure that we are unable to resolve within a reasonable period.",
          "An incorrect amount charged due to an error in our checkout process.",
          "Any other case where a refund is required by Applicable Law.",
        ] },
      ],
    },
    {
      id: "refund-not-eligible",
      heading: "6. When a Refund Is Ordinarily Not Available",
      blocks: [
        { type: "paragraphs", items: ["Subject to Applicable Law, refunds are not ordinarily available for:"] },
        { type: "list", items: [
          "Change of mind after you have made substantial use of the Subscription period.",
          "Losses you incur from betting or gambling decisions made independently of the Platform, whether or not informed by our Predictions.",
          "General dissatisfaction with the outcome of published Predictions.",
          "Account suspension resulting from a serious breach of our Terms of Service, Terms of Use or Acceptable Use Policy.",
          "Failure to access the Service caused by your own unsupported device, browser, or network connection where the Service itself is functioning normally.",
        ] },
        { type: "callout", variant: "warning", text: "Bet Lab never offers refunds for gambling losses. We sell access to analytical content, not gambling outcomes." },
      ],
    },
    {
      id: "process",
      heading: "7. Requesting a Refund",
      blocks: [
        { type: "list", items: [
          "Email support@betlabhq.com with your account email, payment reference, and a description of the issue.",
          "We aim to acknowledge refund requests within a reasonable time and to complete a review promptly.",
          "Approved refunds are returned to your original payment method via Paystack; the time to appear in your account depends on your bank or card issuer and is outside our control.",
        ] },
        { type: "paragraphs", items: [
          "Nothing in this policy limits any statutory consumer right you may hold under Applicable Law that cannot lawfully be excluded.",
        ] },
      ],
    },
  ],
};
