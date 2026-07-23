# Legal, Compliance and Onboarding-Consent System

This document explains the legal/policy and consent-tracking system implemented for Bet Lab: what was built, how it works, and how to operate it going forward.

## What was implemented

- 10 publication-ready legal/policy documents, written specifically for Bet Lab as a football-analysis subscription platform (not a bookmaker), rendered on the frontend with Bet Lab branding. (Originally 12; Terms of Service absorbed Terms of Use, and Disclaimer absorbed Risk Disclosure — see "Document merge" below.)
- A Legal Centre (`/legal`) linking to every policy, with search, plus a canonical route per document (`/legal/<slug>`).
- A public Policy Change Log (`/legal/changes`) showing every version of every policy ever published, with a plain-language summary of what changed.
- A Legal Contact form (`/legal/contact`) that actually delivers to the legal inbox, plus the general site Contact page (`/contact`) wired to the same endpoint.
- Footer links to every policy, and Legal Centre link, on every public page.
- Mandatory, auditable consent capture on registration — presented as a single combined checkbox in the UI, but still recorded as separate `UserPolicyAcceptance` rows per policy type server-side — plus 1 optional marketing checkbox.
- A "Continue for free" registration path that only requires the core acceptances (Terms of Service, Privacy, Age/Risk) — not the Refund Policy, which only applies when actually paying.
- A refund-policy acknowledgement gate on checkout, for both the paid-registration flow and the standalone Pricing-page checkout flow used by already-authenticated members, that only prompts once per policy version (it does not re-ask a member who already has a current acceptance on file).
- A "Legal & Privacy" section in the member dashboard showing which policy versions a member has accepted and when, plus a marketing-consent toggle.
- A new Django app (`legal`) with `PolicyDocument`, `UserPolicyAcceptance` (append-only audit trail) and `MarketingConsent` models, wired into Django admin with appropriate read-only/staff restrictions.
- Per-page SEO metadata (title, description, canonical, OG/Twitter tags, WebPage + BreadcrumbList structured data) on every legal page.
- Print stylesheet and a "Download PDF" button (browser print-to-PDF) on every policy page.
- Explicit security headers (`SECURE_CONTENT_TYPE_NOSNIFF`, `SECURE_REFERRER_POLICY`) plus a documented (not yet enabled) CSP recommendation — see "Security headers" below.
- 83 backend tests and 21 frontend tests covering consent enforcement, the change-log/contact APIs, and legal-link integrity.

## Document merge (Terms of Service + Terms of Use; Disclaimer + Risk Disclosure)

The original 12-document set asked for 3 mandatory checkboxes at registration, which was judged excessive friction for a single sign-up flow. Rather than just re-labelling the UI, the underlying documents were consolidated as a real "material policy version" event:

- **Terms of Service** (`terms-of-service`) absorbed **Terms of Use** — the intro paragraph now states the document also serves as Bet Lab's Terms of Use, and the prohibited-actions content was merged into its "Restrictions and Acceptable Use" section.
- **Disclaimer** (`disclaimer`) absorbed **Risk Disclosure** — retitled "Disclaimer and Risk Disclosure" everywhere it's linked.
- Both bumped to **version 2.0** via a backend data migration (`legal/migrations/0004_seed_change_log.py`) with `is_material_change=True` and a `change_summary` explaining the merge. The old v1.0 rows were deactivated, not deleted, so historical acceptances still resolve correctly.
- The `terms_of_use` and `risk_disclosure` `PolicyType` choices still exist in the backend enum (for historical `UserPolicyAcceptance` rows recorded before the merge) but no longer have frontend routes or content — the Policy Change Log page defensively checks the registry before linking out to a policy_type, so old change-log rows for the retired types render as non-clickable "Superseded" entries rather than broken links.
- Registration now shows **1 combined mandatory checkbox** covering Terms of Service, Privacy Policy, and Disclaimer/Risk Disclosure, plus the separate Refund Policy checkbox (only required when paying) and the optional marketing checkbox. Server-side, accepting the combined checkbox still records 3 distinct `UserPolicyAcceptance` rows — the UI simplification did not reduce the audit trail.

## Routes created

| Route | Purpose |
|---|---|
| `/legal` | Legal Centre index — lists all 10 documents, with search |
| `/legal/terms-of-service` | Terms of Service (also serves as Terms of Use) |
| `/legal/privacy` | Privacy Policy |
| `/legal/refund-policy` | Refund and Subscription Policy |
| `/legal/disclaimer` | Disclaimer and Risk Disclosure |
| `/legal/responsible-gambling` | Responsible Gambling Statement |
| `/legal/cookies` | Cookie Policy |
| `/legal/copyright` | Copyright and Intellectual Property Policy |
| `/legal/acceptable-use` | Acceptable Use Policy |
| `/legal/aml-kyc` | AML/KYC Statement |
| `/legal/methodology` | Prediction Methodology |
| `/legal/changes` | Public Policy Change Log (all versions of all policies) |
| `/legal/contact` | Legal Contact form |

All of these are public, unauthenticated routes and are listed in `public/sitemap.xml`. A frontend test (`src/legal/sitemap.test.ts`) asserts the sitemap lists every current registry document and does not list the merged-away `terms-of-use`/`risk-disclosure` paths, so future document changes can't silently drift out of sync with the sitemap.

Note on the app's routing style: this codebase does not use React Router's `<Routes>`/`<Route>` JSX — it uses a flat `Page` union type with a path lookup table (`src/app/App.tsx`). `App.tsx` treats any path starting with `/legal/` as the `"legal"` page and renders `LegalRouter` (`src/pages/legal/LegalRouter.tsx`), which reads the URL itself to decide whether to show the Legal Centre index, the change log, the contact form, or a specific document. This keeps the existing routing convention intact without adding entries to the top-level path table for every sub-page.

## Models created (`backend/legal/models.py`)

- **`PolicyDocument`** — a versioned policy. `policy_type` + `version` is unique. `PolicyDocument.current(policy_type)` returns whichever version has `is_active=True` for that type. Publishing a new version means creating a new row and flipping `is_active` on the old one — old rows are never deleted, so historical acceptances keep pointing at the exact version a user actually accepted. `change_summary` (added in `0003_policydocument_change_summary.py`) holds a plain-language description of what changed in that version, surfaced by the Policy Change Log API.
- **`UserPolicyAcceptance`** — append-only audit record: which user accepted which policy version, when, from where (`web_signup` / `checkout` / `policy_update` / `admin`), and the IP/user-agent captured at that moment. Nothing in the normal application flow ever updates or deletes these rows.
- **`MarketingConsent`** — one row per user, current-state (not append-only, since consent can legitimately be withdrawn and re-given). Tracks `status`, `consented_at`, `withdrawn_at`, and which policy version was in effect when consent was last set. Toggleable by the member from the dashboard (`account_settings` source) as well as at registration.

## Migrations

- `legal/migrations/0001_initial.py` — creates the three tables.
- `legal/migrations/0002_seed_initial_policies.py` — data migration seeding v1.0 of all original policy types.
- `legal/migrations/0003_policydocument_change_summary.py` — adds the `change_summary` field.
- `legal/migrations/0004_seed_change_log.py` — data migration: backfills `change_summary="Initial publication."` on rows that don't have one, then publishes v2.0 of `terms_of_service` and `disclaimer` with `is_material_change=True` and a change_summary explaining the Terms of Use / Risk Disclosure merge.

All are idempotent `RunPython` data migrations, so `python manage.py migrate` seeds/updates correctly in any environment (local, CI, production) with no manual step.

No existing app's migrations were touched. `accounts/serializers.py` and `accounts/views.py` were modified (new required fields on `RegisterSerializer`, atomic consent recording in `RegisterView`), but this did not require a new accounts migration since no model fields were added to `User`.

## API endpoints (`backend/legal/urls.py`, mounted at `/api/v1/legal/`)

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/v1/legal/policies/` | GET | Public | Full history of every policy version, newest first per type — powers `/legal/changes` |
| `/api/v1/legal/contact/` | POST | Public | Sends a categorized legal enquiry email to `LEGAL_EMAIL` — powers `/legal/contact` and the general `/contact` page |
| `/api/v1/legal/my-consent/` | GET | Member | The signed-in member's latest acceptance per policy type, plus marketing-consent status — powers the dashboard Legal & Privacy section |
| `/api/v1/legal/marketing-consent/` | POST | Member | Toggles marketing consent (`source="account_settings"`) |

## How registration consent works

`RegisterSerializer` (`backend/accounts/serializers.py`) requires three additional boolean fields: `accepted_terms`, `acknowledged_privacy`, `confirmed_age_and_risk`, each validated to be `True` or the request is rejected with a field-level error. A fourth field, `marketing_consent`, is optional and defaults to `False`.

`RegisterView.post()` wraps user creation and consent recording in a single `transaction.atomic()` block (`backend/accounts/views.py`). If `legal.services.record_registration_consent()` raises `PolicyNotConfigured` (meaning an active `PolicyDocument` is somehow missing for one of the required types), the whole transaction rolls back — no user is created, and the API returns `503` rather than creating an account with an incomplete consent trail.

On the frontend, `AuthPage.tsx` presents this as a single combined checkbox ("I confirm that I am at least 18 years old and I have read and agree to the Terms of Service, Privacy Policy, and Disclaimer and Risk Disclosure"), but ticking it still sets all three underlying booleans, so the backend still records 3 separate `UserPolicyAcceptance` rows. There is no way to bypass this from an API client directly — the checks live in the serializer and view, not just the React form.

## How checkout consent works

`InitializePaymentView.post()` (`backend/payments/views.py`) checks whether the user already has a `UserPolicyAcceptance` for the **current** version of the Refund and Subscription Policy. If they do (most commonly because they accepted it during registration), checkout proceeds with no extra friction. If they don't, the request must include `accepted_refund_policy: true` in the body or it is rejected with a `400`; if present, the acceptance is recorded with source `checkout` before the Paystack transaction is initialized.

On the frontend, this is transparent in the normal registration-with-payment flow (`AuthPage.tsx` always sends the flag as part of "Create Account & Pay"). For an already-authenticated member checking out from the Pricing page directly (`PricingPage.tsx`), the flow first attempts checkout without the flag; if the backend responds that acknowledgement is needed, a small modal appears with the checkbox, and checkout retries once it's confirmed.

## Policy versioning — how to publish a new version

1. Update the relevant content object in `src/legal/content/*.ts` (bump the `version` and `effectiveDate` fields).
2. On the backend, create the new `PolicyDocument` row and deactivate the old one, including a `change_summary`:
   ```python
   from legal.models import PolicyDocument
   PolicyDocument.objects.filter(policy_type="privacy_policy", is_active=True).update(is_active=False)
   PolicyDocument.objects.create(
       policy_type="privacy_policy", version="1.1", effective_date=date(2026, 9, 1),
       is_active=True, is_material_change=True,
       change_summary="Clarified how third-party payment processor data is retained.",
   )
   ```
   (Or do this through Django admin — see below.)
3. Existing acceptances remain untouched and keep pointing at v1.0 — nothing is deleted or rewritten.
4. Going forward, `has_current_acceptance()` will correctly report that users who only accepted v1.0 do not have a current acceptance for the new version, and the new version + change summary immediately appear on the public `/legal/changes` page (it reads live from `PolicyDocument`, no separate content to update).

### Triggering re-acceptance

The backend foundation for re-acceptance is in place (`is_material_change`, and the fact that `has_current_acceptance` naturally becomes `False` for anyone who hasn't accepted the new version), but there is **no frontend re-acceptance prompt wired up yet** for existing logged-in users browsing normally — only checkout is currently gated on this check. To activate full re-acceptance UX:

- Add a check (e.g. in `DashboardPage.tsx`'s Legal & Privacy section, which already fetches `/api/v1/legal/my-consent/`) that compares each `acceptances` entry's version against the current registry/API version and prompts the member to review and re-accept if they differ.
- This was intentionally left as a documented next step rather than built speculatively, since there is no current policy version requiring it — the two policies that were bumped to 2.0 this session (Terms of Service, Disclaimer) were a document *merge*, not a change requiring existing users to re-consent to new terms.

## Existing users

No existing user was given a fabricated acceptance record. Users who registered before this feature shipped simply have **no** `UserPolicyAcceptance` rows, and the dashboard's Legal & Privacy section shows an honest "No policy acceptances on record yet" for them rather than fabricating history.

- Existing users can continue logging in and using their account normally (login itself is unaffected).
- They will be prompted to acknowledge the Refund and Subscription Policy the first time they check out for a *new* subscription (enforced automatically by the "has current acceptance" check, since they have none on file).
- They are **not** currently blocked from anything else — see "Triggering re-acceptance" above if that's wanted later.

## Admin workflow

Staff/superusers can manage everything from Django admin (`/admin/`):

- **Policy Documents** — search/filter by type and active status, see version, effective date, and change summary at a glance. Create a new version and flip `is_active` here to publish an update.
- **User Policy Acceptances** — search by user email, filter by policy type/version/source/date. This list is deliberately **read-only** (no add, no edit) for all staff, and only a superuser can delete a row, to protect the audit trail's integrity.
- **Marketing Consent** — search by user email, filter by status/source. Timestamps and IP/UA are read-only; only `status` is editable, for the rare case a support agent needs to correct it manually.

## Security headers

`backend/config/settings.py` sets `SECURE_CONTENT_TYPE_NOSNIFF = True` and `SECURE_REFERRER_POLICY = "same-origin"` explicitly (Django defaults to safe values for these already, but they're now spelled out rather than relying on defaults). A recommended Content-Security-Policy string is documented inline in `settings.py` but **deliberately not enabled**: the frontend genuinely relies on inline styles (Tailwind arbitrary values) and canvas-generated data URIs (the animated favicon), and enabling an untested CSP risk breaking those in production with no easy way to verify beforehand in this environment. If a CSP is added later, test the animated favicon, the football landing-page animation, and all Tailwind arbitrary-value styles against it before deploying.

## Environment variables

New settings (`backend/config/settings.py`), all optional with safe fallbacks — see `docs/legal-owner-checklist.md` for what still needs supplying:

```
LEGAL_BUSINESS_NAME=Bet Lab
LEGAL_WEBSITE_URL=https://www.betlabhq.com
LEGAL_SUPPORT_EMAIL=support@betlabhq.com
LEGAL_EMAIL=legal@betlabhq.com
LEGAL_PRIVACY_EMAIL=privacy@betlabhq.com
LEGAL_BUSINESS_ADDRESS=            # intentionally blank until supplied — see owner checklist
LEGAL_BUSINESS_PHONE=              # intentionally blank until supplied — see owner checklist
LEGAL_GOVERNING_LAW=Federal Republic of Nigeria
LEGAL_MINIMUM_AGE=18
```

None of these need to be set for the app to run correctly today — the code falls back to the support email rather than ever displaying a raw placeholder in production. `LEGAL_EMAIL` must resolve to a real, monitored inbox in production, since it's now the delivery address for both `/legal/contact` and the general `/contact` page.

## Testing

Backend:
```
cd backend
python manage.py test
```
83 tests pass, covering registration/checkout consent enforcement, policy versioning, admin permissions, the change-log API, the contact form API (mocked email delivery), and the my-consent/marketing-consent APIs.

Frontend:
```
npm test
```
21 tests pass: the registration consent UI (single combined checkbox unticked by default, mandatory fields block submission, marketing stays optional, policy links open in a new tab), the legal-document registry (10 documents, unique slugs, resolvable by slug), legal-link integrity (every hardcoded `/legal/<slug>` reference in source resolves to a real document or a real non-document route like `/legal/changes`), and sitemap/registry consistency.

## Deployment

Backend (Render): the data migrations mean **no manual seeding step is required** — `python manage.py migrate` (already part of the existing start command) creates and seeds the `legal` app's tables automatically, including the `0003`/`0004` migrations added this session. Confirm these have actually run in production after the next deploy (`python manage.py showmigrations legal` should show all four as applied) — until they do, production's `terms_of_service`/`disclaimer` `PolicyDocument` rows remain at v1.0 with no `change_summary`.

Frontend (Vercel): no new environment variables or build-step changes are required. The existing SPA rewrite (`vercel.json`) already covers the new `/legal/*` routes since it rewrites all paths to `index.html`.

## Rollback

- Backend: `python manage.py migrate legal 0002` reverts the change-summary data-migration's version bumps (seeded rows are *not* deleted on reverse migration, by design, since real acceptances may already reference them). To fully disable the feature, revert the `accounts`/`payments` view/serializer changes in this branch and redeploy; existing `UserPolicyAcceptance` data is harmless to leave in place.
- Frontend: revert the routing/footer/AuthPage/PricingPage/DashboardPage/ContactPage changes in this branch and redeploy.

## Risks and assumptions

- **IP address capture** trusts Render's `X-Forwarded-For` header (`common/utils.get_client_ip`), which is correct for this app's actual hosting setup (Render sits directly in front of the Django app) but would need revisiting if a different reverse-proxy topology is introduced.
- **No cookie-consent banner was added.** This is intentional and accurate, not an oversight: an audit of the actual frontend found it sets zero cookies of its own (auth uses `localStorage`); the only real cookies anywhere are Django admin's session/CSRF cookies, used only by staff. See the Cookie Policy for the detail. If analytics or marketing cookies are added later, the Cookie Policy and a consent banner both need to be added at that time.
- **No AI/ML/algorithmic prediction methodology is claimed**, because none exists in the current `predictions` app — predictions are human-authored via Django admin. The Methodology page reflects this honestly.
- **Marketing-consent history is current-state, not fully append-only.** `MarketingConsent` records the latest `status`/`consented_at`/`withdrawn_at` per user rather than a full historical log of every toggle. If you need a complete history of every opt-in/opt-out event over time, that would need a small additional append-only log table.
- **No frontend re-acceptance prompt exists yet** for a future material policy change outside of checkout — see "Triggering re-acceptance" above.
- **"Download PDF" is browser print-to-PDF (`window.print()`), not a server-rendered PDF.** This was a deliberate scope decision to avoid adding a PDF-rendering dependency for a need the browser already satisfies; the button is a small named function (`downloadPdf()` in `LegalPageLayout.tsx`) that a real endpoint could replace later without touching the surrounding UI.
- **The dashboard's "Download my consent history" button is a disabled placeholder**, matching the spec's forward-looking wording — it was not built speculatively, since the my-consent API already returns everything needed to build a real export later without new backend work.
- **CSP is documented, not enabled** — see "Security headers" above.
