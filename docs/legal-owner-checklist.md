# Legal Owner Checklist

Outstanding items that need a real business decision or fact from the Bet Lab owner/operator before the legal pages are fully final. Nothing below blocks the app from running today — every page already renders safely with honest fallback text (e.g. the support email instead of an unverified address) rather than a raw placeholder.

## Business identity

- [ ] Business legal name confirmed (currently shown as "Bet Lab" — confirm this is the correct legal trading name, or supply the registered entity name)
- [ ] Registered business address added (`LEGAL_BUSINESS_ADDRESS` env var) — none is currently published; the Terms of Service explicitly states this is pending rather than showing a placeholder
- [ ] Business telephone number added (`LEGAL_BUSINESS_PHONE` env var) — none is currently published
- [ ] Governing jurisdiction confirmed (currently set to Nigeria — confirm this is correct for how the business is actually incorporated/operated)

## Contact channels

- [ ] `support@betlabhq.com` is a real, monitored inbox
- [ ] `legal@betlabhq.com` is a real, monitored inbox
- [ ] `privacy@betlabhq.com` is a real, monitored inbox

## Payment and refunds

- [ ] Paystack business information (registered name, settlement account) matches the legal name used in these policies
- [ ] Refund process defined operationally — who reviews requests sent to support@betlabhq.com, and what the expected turnaround time is
- [ ] Confirm whether any current or planned plan actually auto-renews. The Refund and Subscription Policy currently states subscriptions do not auto-renew unless explicitly shown at checkout, matching today's product. If auto-renewal is added later, that policy needs updating first.

## Data and privacy

- [ ] Data-retention process confirmed operationally (the Privacy Policy states practical retention principles; confirm someone actually owns closing/anonymising accounts on request)
- [ ] Confirm no analytics/advertising cookie or tracking script has been added since this was written — the Cookie Policy states none are used. If one is added, update the Cookie Policy and add a consent banner *before* it goes live, not after.

## Responsible gambling

- [ ] A verified, currently-active Nigerian gambling-support helpline (or equivalent local resource) identified and added to the Responsible Gambling Statement. None was invented — this is a genuine placeholder pending your research, clearly marked as an owner note within the page content itself.
- [ ] Confirm the account-closure path (emailing support) is the desired self-exclusion mechanism, or specify a preferred alternative.

## Content review

- [ ] All 12 policy documents reviewed by the business owner for accuracy against how Bet Lab actually operates
- [ ] Policy effective date approved (currently set to the implementation date — confirm this is acceptable or specify a different go-live date)
- [ ] Legal review completed by a qualified adviser, particularly for the Terms of Service governing-law/dispute-resolution section and the AML/KYC Statement, before relying on these documents in a real dispute

## Deployment verification

- [ ] Production migration completed (already done as part of this implementation — 12 policy documents confirmed live in the production database)
- [ ] Production signup tested end-to-end with the new consent checkboxes
- [ ] Live checkout tested after Paystack live-mode approval, confirming the refund-policy acknowledgement gate behaves correctly with real payment keys
