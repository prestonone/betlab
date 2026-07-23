# Legal, Compliance and Onboarding-Consent System

This document explains the legal/policy and consent-tracking system implemented for Bet Lab: what was built, how it works, and how to operate it going forward.

## What was implemented

- 12 publication-ready legal/policy documents, written specifically for Bet Lab as a football-analysis subscription platform (not a bookmaker), rendered on the frontend with Bet Lab branding.
- A Legal Centre (`/legal`) linking to every policy, plus a canonical route per document (`/legal/<slug>`).
- Footer links to every policy, and Legal Centre link, on every public page.
- Mandatory, auditable consent capture on registration (3 required checkboxes + 1 optional marketing checkbox), enforced server-side, not just in the UI.
- A "Continue for free" registration path that only requires the 3 core acceptances (Terms, Privacy, Age/Risk) — not the Refund Policy, which only applies when actually paying.
- A refund-policy acknowledgement gate on checkout, for both the paid-registration flow and the standalone Pricing-page checkout flow used by already-authenticated members, that only prompts once per policy version (it does not re-ask a member who already has a current acceptance on file).
- A new Django app (`legal`) with `PolicyDocument`, `UserPolicyAcceptance` (append-only audit trail) and `MarketingConsent` models, wired into Django admin with appropriate read-only/staff restrictions.
- 17 new backend tests and 16 new frontend tests covering the consent-enforcement logic.

## Routes created

| Route | Purpose |
|---|---|
| `/legal` | Legal Centre index — lists all 12 documents |
| `/legal/terms-of-service` | Terms of Service |
| `/legal/terms-of-use` | Terms of Use |
| `/legal/privacy` | Privacy Policy |
| `/legal/refund-policy` | Refund and Subscription Policy |
| `/legal/disclaimer` | Disclaimer and Responsible Use Policy |
| `/legal/risk-disclosure` | Risk Disclosure Statement |
| `/legal/responsible-gambling` | Responsible Gambling Statement |
| `/legal/cookies` | Cookie Policy |
| `/legal/copyright` | Copyright and Intellectual Property Policy |
| `/legal/acceptable-use` | Acceptable Use Policy |
| `/legal/aml-kyc` | AML/KYC Statement |
| `/legal/methodology` | Prediction Methodology |

All of these are public, unauthenticated routes and are listed in `public/sitemap.xml`. There is no separate short-alias scheme (e.g. `/terms`, `/privacy`) — everything is consolidated under `/legal/*` as the single canonical scheme, to keep routing simple to maintain. Add aliases later if a specific marketing need arises.

Note on the app's routing style: this codebase does not use React Router's `<Routes>`/`<Route>` JSX — it uses a flat `Page` union type with a path lookup table (`src/app/App.tsx`). Rather than adding 12 entries to that table, a single `"legal"` Page value was added, and a small `LegalRouter` component (`src/pages/legal/LegalRouter.tsx`) reads the URL itself to decide whether to show the Legal Centre index or a specific document. This keeps the existing routing convention intact.

## Models created (`backend/legal/models.py`)

- **`PolicyDocument`** — a versioned policy. `policy_type` + `version` is unique. `PolicyDocument.current(policy_type)` returns whichever version has `is_active=True` for that type. Publishing a new version means creating a new row and flipping `is_active` on the old one — old rows are never deleted, so historical acceptances keep pointing at the exact version a user actually accepted.
- **`UserPolicyAcceptance`** — append-only audit record: which user accepted which policy version, when, from where (`web_signup` / `checkout` / `policy_update` / `admin`), and the IP/user-agent captured at that moment. Nothing in the normal application flow ever updates or deletes these rows.
- **`MarketingConsent`** — one row per user, current-state (not append-only, since consent can legitimately be withdrawn and re-given). Tracks `status`, `consented_at`, `withdrawn_at`, and which policy version was in effect when consent was last set.

## Migrations

- `legal/migrations/0001_initial.py` — creates the three tables.
- `legal/migrations/0002_seed_initial_policies.py` — a **data migration** that creates the v1.0 row for all 12 policy types automatically, idempotently, as part of `migrate`. This is what makes the seed data show up automatically in every environment (local dev, CI test databases, and production) without a separate manual step. There is also a `seed_legal_policies` management command available for publishing new versions later (see "Publishing a new policy version" below).

No existing app's migrations were touched. `accounts/serializers.py` and `accounts/views.py` were modified (new required fields on `RegisterSerializer`, atomic consent recording in `RegisterView`), but this did not require a new accounts migration since no model fields were added to `User`.

## How registration consent works

`RegisterSerializer` (`backend/accounts/serializers.py`) now requires three additional boolean fields: `accepted_terms`, `acknowledged_privacy`, `confirmed_age_and_risk`, each validated to be `True` or the request is rejected with a field-level error (matching the existing serializer-error convention already used elsewhere in `accounts`, e.g. `{"accepted_terms": ["You must accept the Terms of Service and Terms of Use."]}`). A fourth field, `marketing_consent`, is optional and defaults to `False`.

`RegisterView.post()` wraps user creation and consent recording in a single `transaction.atomic()` block (`backend/accounts/views.py`). If `legal.services.record_registration_consent()` raises `PolicyNotConfigured` (meaning an active `PolicyDocument` is somehow missing for one of the required types), the whole transaction rolls back — no user is created, and the API returns `503` rather than creating an account with an incomplete consent trail.

Accepting the single "Terms" checkbox records acceptance of **two** policy types (`terms_of_service` and `terms_of_use`) as two separate `UserPolicyAcceptance` rows, since they are legally two documents even though presented as one checkbox. Similarly the age/risk checkbox records both `risk_disclosure` and `disclaimer`.

There is no way to bypass this from an API client directly — the checks live in the serializer and view, not just the React form.

## How checkout consent works

`InitializePaymentView.post()` (`backend/payments/views.py`) checks whether the user already has a `UserPolicyAcceptance` for the **current** version of the Refund and Subscription Policy. If they do (most commonly because they accepted it during registration), checkout proceeds with no extra friction. If they don't, the request must include `accepted_refund_policy: true` in the body or it is rejected with a `400`; if present, the acceptance is recorded with source `checkout` before the Paystack transaction is initialized.

On the frontend, this is transparent in the normal registration-with-payment flow (`AuthPage.tsx` always sends the flag as part of "Create Account & Pay"). For an already-authenticated member checking out from the Pricing page directly (`PricingPage.tsx`), the flow first attempts checkout without the flag; if the backend responds that acknowledgement is needed, a small modal appears with the checkbox, and checkout retries once it's confirmed.

## Policy versioning — how to publish a new version

1. Update the relevant content object in `src/legal/content/*.ts` (bump the `version` and `effectiveDate` fields).
2. On the backend, create the new `PolicyDocument` row and deactivate the old one:
   ```python
   from legal.models import PolicyDocument
   PolicyDocument.objects.filter(policy_type="privacy_policy", is_active=True).update(is_active=False)
   PolicyDocument.objects.create(policy_type="privacy_policy", version="1.1", effective_date=date(2026, 9, 1), is_active=True, is_material_change=True)
   ```
   (Or do this through Django admin — see below.)
3. Existing acceptances remain untouched and keep pointing at v1.0 — nothing is deleted or rewritten.
4. Going forward, `has_current_acceptance()` will correctly report that users who only accepted v1.0 do not have a current acceptance for the new version.

### Triggering re-acceptance

The backend foundation for re-acceptance is in place (`is_material_change`, and the fact that `has_current_acceptance` naturally becomes `False` for anyone who hasn't accepted the new version), but there is **no frontend re-acceptance prompt wired up yet** for existing logged-in users browsing normally — only checkout is currently gated on this check. To activate full re-acceptance UX:

- Add a check (e.g. in `DashboardPage.tsx` or a new lightweight banner component) that calls a new small endpoint returning which policy types the current user is missing a current acceptance for, and prompts them to review and accept before continuing.
- This was intentionally left as a documented next step rather than built speculatively, since there is no current policy version requiring it.

## Existing users

No existing user was given a fabricated acceptance record. Users who registered before this feature shipped simply have **no** `UserPolicyAcceptance` rows. The chosen transition strategy is the least disruptive of the options considered:

- Existing users can continue logging in and using their account normally (login itself is unaffected).
- They will be prompted to acknowledge the Refund and Subscription Policy the first time they check out for a *new* subscription (this is enforced automatically by the existing "has current acceptance" check, since they have none on file).
- They are **not** currently blocked from anything else. If you want to require full re-acceptance of all policies from existing users on next login, that would need the reacceptance-prompt UI described above — deliberately not built speculatively.

## Admin workflow

Staff/superusers can manage everything from Django admin (`/admin/`):

- **Policy Documents** — search/filter by type and active status, see version and effective date at a glance. Create a new version and flip `is_active` here to publish an update.
- **User Policy Acceptances** — search by user email, filter by policy type/version/source/date. This list is deliberately **read-only** (no add, no edit) for all staff, and only a superuser can delete a row, to protect the audit trail's integrity. IP address and user agent are visible only to staff who can view this model at all (ordinary non-staff users have no admin access at all).
- **Marketing Consent** — search by user email, filter by status/source. Timestamps and IP/UA are read-only; only `status` is editable, for the rare case a support agent needs to correct it manually (this still leaves an `updated_at` trail, though not a full history — see "Assumptions" below).

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

None of these need to be set for the app to run correctly today — the code falls back to the support email rather than ever displaying a raw placeholder in production.

## Testing

Backend:
```
cd backend
python manage.py test
```
74 tests pass (57 pre-existing + 17 new, covering registration/checkout consent enforcement, policy versioning, and admin permissions).

Frontend (new — no test runner existed in this project before this feature; Vitest + Testing Library were added):
```
npm test
```
16 tests pass, covering the registration consent UI (checkboxes unticked by default, mandatory fields block submission, marketing stays optional, policy links open in a new tab so they never erase in-progress signup form data) and the legal-document registry (all 12 documents present, unique slugs, resolvable by slug).

## Deployment

Backend (Render): the data migration means **no manual seeding step is required** — `python manage.py migrate` (already part of the existing start command) creates and seeds the `legal` app's tables automatically. This was additionally already run directly against production as part of this implementation, so the policy documents are live now, ahead of the next deploy.

Frontend (Vercel): no new environment variables or build-step changes are required. The existing SPA rewrite (`vercel.json`) already covers the new `/legal/*` routes since it rewrites all paths to `index.html`.

## Rollback

- Backend: `python manage.py migrate legal 0001` reverts the data-migration's seeding (the seeded rows are *not* deleted on reverse migration, by design, since real acceptances may already reference them — reversing only affects future `migrate` runs, not existing data). To fully disable the feature, revert the `accounts`/`payments` view/serializer changes in this branch and redeploy; existing `UserPolicyAcceptance` data is harmless to leave in place.
- Frontend: revert the routing/footer/AuthPage/PricingPage changes in this branch and redeploy.

## Risks and assumptions

- **IP address capture** trusts Render's `X-Forwarded-For` header (`common/utils.get_client_ip`), which is correct for this app's actual hosting setup (Render sits directly in front of the Django app) but would need revisiting if a different reverse-proxy topology is introduced.
- **No cookie-consent banner was added.** This is intentional and accurate, not an oversight: an audit of the actual frontend found it sets zero cookies of its own (auth uses `localStorage`); the only real cookies anywhere are Django admin's session/CSRF cookies, used only by staff. See the Cookie Policy for the detail. If analytics or marketing cookies are added later, the Cookie Policy and a consent banner both need to be added at that time.
- **No AI/ML/algorithmic prediction methodology is claimed**, because none exists in the current `predictions` app — predictions are human-authored via Django admin. The Methodology page reflects this honestly.
- **Marketing-consent history is current-state, not fully append-only.** `MarketingConsent` records the latest `status`/`consented_at`/`withdrawn_at` per user rather than a full historical log of every toggle. This matches the spec's described shape (a "current state" record) but means if you need a complete history of every opt-in/opt-out event over time, that would need a small additional append-only log table.
- **No frontend re-acceptance prompt exists yet** for a future material policy change outside of checkout — see "Triggering re-acceptance" above.
