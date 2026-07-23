# Django Admin — Two-Part Operations Dashboard

This document explains the redesigned Django Admin index page: a daily
game-management workspace ("Match & Prediction Operations") plus a
permission-gated business/system-health view ("Business & System
Overview"), how every number on it is calculated, and how to operate and
troubleshoot it.

## What was implemented

The default Django Admin index page (`/admin/`) is now a two-part
operations dashboard, implemented entirely as template + template-tag
customizations on top of the existing, unmodified `admin.site` — no admin
URLs changed, no existing changelists, filters, actions or forms were
replaced.

1. **Match & Prediction Operations** — always the first thing a staff
   member sees. Quick-action links, operational summary cards, and a
   Today's Games table, all linking to the real, existing Django Admin
   changelists (with real filters applied via querystring).
2. **Business & System Overview** — revenue, subscribers, payment health,
   alerts, database status and deployment info. Only rendered for
   superusers and members of a new "Operations Managers" group; ordinary
   content staff never see it (not even an empty/greyed-out version — the
   section simply isn't in the page at all for them).
3. Below both dashboard sections, the standard Django Admin app/model list
   still appears, re-grouped into named sections (Match & Prediction
   Operations, Subscribers & Accounts, Payments & Revenue, Legal &
   Compliance, Authentication & Permissions) instead of Django's default
   flat per-app grouping — every native admin URL is unchanged, only the
   navigation label grouping is cosmetic.

## Architecture

- **New `dashboard` app** (`backend/dashboard/`): no models of its own.
  - `services.py` — every count, metric, and alert, computed directly from
    real querysets on the existing models.
  - `permissions.py` — `can_view_match_operations` (any staff member) and
    `can_view_business_overview` (superuser or "Operations Managers"
    group member).
  - `templatetags/dashboard_tags.py` — two `inclusion_tag`s
    (`match_operations_dashboard`, `business_overview_dashboard`) that
    check permissions and pull data from `services.py`, plus a
    `group_apps` filter that re-groups the admin's `app_list` for
    navigation.
  - `migrations/0001_seed_operations_managers_group.py` — a data
    migration that creates the "Operations Managers" `django.contrib.auth`
    `Group` (empty membership — assign staff to it via the User admin's
    Groups widget).
- **`templates/admin/index.html`** (new) — overrides Django's default
  admin index template. Extends the existing `admin/base_site.html` (the
  same Bet-Lab-branded template already in use), renders the two
  dashboard sections via the template tags above, then the grouped
  app/model list.
- **`common/static/admin/css/betlab-admin-overrides.css`** (extended) —
  dashboard card/table/alert/badge styles added to the existing Bet Lab
  admin theme file, using the same navy/gold design tokens already
  defined there. Responsive: cards reflow, tables scroll horizontally,
  quick-action buttons stack full-width below 768px.
- **`payments` app additions** — two new models purely for observability
  (see "Payment observability" below): `WebhookEvent`,
  `PaymentVerificationAttempt`. Both registered in `payments/admin.py`
  as read-only, audit-log-style changelists (no add permission, a
  "mark resolved" bulk action), matching the existing pattern used by
  `legal.UserPolicyAcceptanceAdmin`.
- **`predictions/admin.py` additions** — three new `SimpleListFilter`
  classes (`AwaitingResultFilter`, `AwaitingSettlementFilter`,
  `MissingRequiredInfoFilter`) registered on `PredictionAdmin.list_filter`.
  These exist so the dashboard's card/quick-action links can use safe,
  Django-admin-registered querystring filters (`?awaiting_result=yes`
  etc.) instead of raw compound lookups that `ModelAdmin.lookup_allowed()`
  might reject — and they double as ordinary sidebar filter options for
  staff browsing the changelist manually.

No custom `AdminSite` subclass was introduced. This was a deliberate
choice: subclassing `AdminSite` and swapping the global `admin.site`
singleton is a much larger, riskier change (every app's `@admin.register`
call targets the default site instance at import time), for no benefit
here — everything needed (extra dashboard content, grouped navigation)
is achievable at the template layer alone, which is also far easier to
revert if ever needed (delete `templates/admin/index.html` and the
`dashboard` app; nothing else references them).

## Match & Prediction Operations

### Quick actions

| Label | Destination |
|---|---|
| Add New Prediction | `admin:predictions_prediction_add` |
| View Today's Games | `PredictionSelection` changelist, filtered to today's `match_time` |
| View Draft Predictions | `Prediction` changelist, `status=draft` |
| View Published Predictions | `Prediction` changelist, `status=published` |
| View Games Awaiting Results | `Prediction` changelist, `awaiting_result=yes` |
| Update Match Results | same destination as above — this is where results are entered |
| Settle Completed Predictions | `Prediction` changelist, `awaiting_settlement=yes` |
| View Postponed or Cancelled Games | `Prediction` changelist, `status=cancelled` |
| Manage Prediction Categories | `PredictionCategory` changelist |
| Manage Prediction Selections | `PredictionSelection` changelist |
| View Prediction History | `Prediction` changelist, unfiltered |

### Summary cards and their exact definitions

- **Games Scheduled Today** — count of `PredictionSelection` rows whose
  `match_time` falls on today's date (`timezone.localdate()` — respects
  `TIME_ZONE`, currently `UTC`; not a hardcoded UTC assumption).
- **Draft Predictions** — `Prediction.status == draft`.
- **Published Predictions Today** — `is_published=True` and
  `published_at` is today.
- **Games Awaiting Results** — `status == locked` and
  `result_status == pending` (kick-off has passed, no selection has a
  result yet).
- **Predictions Awaiting Settlement** — `status == locked`,
  multi-selection, with *some* (not all) selections resolved. Read the
  "Settlement is automatic" note below — this is **not** "results
  entered but a manual settle button hasn't been clicked," because no
  such manual step exists in this codebase.
- **Postponed or Cancelled Games** — `status == cancelled`. There is no
  separate "postponed" status in the data model (confirmed during the
  audit for this work) and the spec's own quick-action wording already
  treats "postponed or cancelled" as one bucket — so this card
  intentionally covers both without inventing a new status.
- **Recently Settled Predictions** — `status == settled`, `settled_at`
  within the last 7 days.
- **Predictions Missing Required Information** — `status` is `scheduled`
  or `published`, and either has zero selections attached or blank
  `analysis` text.

### Settlement is automatic — an important discovery

While building this dashboard, testing surfaced that `Prediction.settle()`
is **not** a distinct manual action in the existing codebase:
`PredictionSelection.settle()` always calls
`Prediction.recalculate_result()`, which — once every selection on a
`locked` prediction has a non-pending result — calls `Prediction.settle()`
automatically in the same request. There is no locked-prediction state
where "the result is fully known but settlement hasn't happened yet";
that state cannot exist at rest.

This means the spec's "Step 4 — Settle Prediction" is, in this codebase,
not a separate click — it happens the moment the last selection's result
is entered. The dashboard's "Predictions Awaiting Settlement" card and
`awaiting_settlement` filter were adjusted to reflect what genuinely can
exist: a multi-selection prediction where staff have entered *some* but
not all of the selection results yet (a real, useful "still mid-entry"
bucket for accumulator-style prediction packages), rather than a
non-existent "ready to settle" state.

### Today's Games table

Up to 20 `PredictionSelection` rows for today, ordered by kick-off time,
each showing match, league, kick-off, prediction/market, odds, access
level, publication status, result, last-updated time, and a direct Edit
link to the parent `Prediction`'s admin change page.

## Business & System Overview

Visible only to superusers and members of the "Operations Managers"
group (`can_view_business_overview` in `dashboard/permissions.py`).
Content staff see none of this — not the section, not a placeholder.

| Metric | Calculation |
|---|---|
| Total Users | `User.objects.count()` — includes inactive/unverified accounts; there is no separate "valid account" flag in this codebase beyond `is_active`, which governs login, not existence. |
| Active Subscribers | Distinct users with a `Subscription` that is currently accessible under the *exact* rule `subscriptions.services.has_active_membership`/`Subscription.is_accessible` uses: `status=active AND expires_at > now`, OR `status=grace AND grace_ends_at > now`. Deliberately **not** a naive `count(status="active")`, which would include stale rows whose `expires_at` has already passed (status is only refreshed lazily, on read). |
| Pending Payments | `Payment.objects.filter(status=pending).count()`. |
| Monthly Revenue | Sum of `Payment.amount` where `status=success` and `paid_at` falls in the current calendar month, **grouped by currency** (multiple currencies are possible). See "Known limitations" — there is no refund model and no test/live payment flag to exclude, so this cannot yet exclude refunds or Paystack test-mode transactions. |
| Popular Subscription Plan | The `Plan` with the most currently-accessible subscribers (same entitlement rule as Active Subscribers), or an explicit empty state if none exist yet. |
| Predictions Published Today | Same definition as the match-ops card. |
| Failed Emails | **Not tracked.** `common/email.py::send_email()` is fire-and-forget — it raises on failure but never persists a delivery record. The dashboard shows "Email delivery tracking is not configured," not a fabricated zero. To support this metric, an `EmailLog` model would need to be added and `send_email()` would need to write to it on both success and failure. |
| Failed Webhooks | Real count from the new `payments.WebhookEvent` model (`processing_status` in `failed`/`invalid_signature`, `resolved=False`). |
| Failed Paystack Verifications | Real count from the new `payments.PaymentVerificationAttempt` model (`status=failed`, `resolved=False`). |
| Database Status | `SELECT 1` via the existing connection, ~15s cache, never raises (see below). |
| Last Deployment | Reads `APP_RELEASE_SHA` / `APP_DEPLOYED_AT` / `APP_RELEASE_NAME` env vars; "Deployment metadata not configured" if unset (see "Render configuration"). |

Business metrics (not match-ops counts, which stay live) are cached for
60 seconds via Django's cache framework (`dashboard.services.get_business_metrics`)
to avoid recomputing several aggregate queries on every admin page load.
Database health is cached for 15 seconds. Neither cache is shared across
processes — `CACHES` uses `LocMemCache` (in-process), which is enough for
a dashboard metric that's allowed to be briefly stale and avoids adding a
new external dependency; if Render ever runs multiple gunicorn workers,
each worker's cache is independent (a minor staleness tradeoff, not a
correctness issue).

**Nothing here calls Paystack or any external provider at render time.**
All figures come from the local database.

### Alerts Requiring Attention

Computed in `dashboard/services.py::get_alerts()`. Only appears (and only
shows a given alert) when the underlying condition is genuinely true —
there's no "everything is fine" filler alert, and metrics that are simply
*unavailable* (like failed-email tracking) are never rendered as a red
warning.

| Alert | Severity | Condition |
|---|---|---|
| Successful payments without an active subscription | Critical | `Payment.status=success` with no subscription, or a subscription that isn't currently active/grace |
| Stale pending payments | Warning | `Payment.status=pending`, created more than 24h ago |
| Unresolved failed verifications | Warning | real `PaymentVerificationAttempt` rows |
| Unresolved failed webhooks | Warning | real `WebhookEvent` rows |
| Published predictions overdue for locking | Warning | `status=published` with a selection `match_time` already in the past — signals the `lock_due_predictions` scheduled command may not be running |
| Predictions mid-way through settlement | Information | see "Settlement is automatic" above |
| Drafts approaching kick-off | Critical | `status=draft` with a selection kicking off within 2 hours |
| Predictions missing required information | Warning | same rule as the match-ops card |
| Active subscriptions with inconsistent dates | Critical | `status=active` with a missing `starts_at`/`expires_at`, or `expires_at < starts_at` |
| Missing current legal policy version | Critical | any of the 10 policy types the frontend actually serves has no active `PolicyDocument` (see note below) |
| Missing business contact configuration | Information | `LEGAL_BUSINESS_ADDRESS`/`LEGAL_BUSINESS_PHONE` blank |
| Paystack secret key not configured | Critical | `PAYSTACK_SECRET_KEY` resolves empty for the active `PAYSTACK_MODE` |
| Email provider not configured | Warning | `RESEND_API_KEY` blank |
| Database health check failed | Critical | see below |

**Policy-type note:** `PolicyDocument.PolicyType` still has 12 values —
`terms_of_use` and `risk_disclosure` remain in the enum only for
historical `UserPolicyAcceptance` rows recorded before this session's
document merge (see `docs/legal-compliance.md`). The alert only checks
the 10 types the frontend registry actually serves today, so it
correctly does not flag the two retired types as "missing."

### Database health check

`dashboard/services.py::check_database_health()` runs `SELECT 1` on the
existing connection with a short timing measurement, cached 15 seconds.
It is wrapped in a bare `except Exception` specifically so a database
outage renders "Unavailable" on the page instead of a 500 error — no
credentials, host, or connection string are ever displayed.

### Deployment metadata

Reads three plain environment variables at request time (no caching
needed — reading `os.getenv()` is free): `APP_RELEASE_SHA`,
`APP_DEPLOYED_AT`, `APP_RELEASE_NAME`. If none are set, the card reads
"Not configured" rather than guessing from process-start time or file
timestamps, which the spec explicitly said not to do.

**Render configuration** — to populate these, add environment variables
to the Render service:

```
APP_RELEASE_SHA=$RENDER_GIT_COMMIT
```

Render automatically exposes `RENDER_GIT_COMMIT` for every deploy; you
can reference it directly in another env var's value in the Render
dashboard, or just set `APP_RELEASE_SHA` to it. Render does not expose a
deploy-timestamp env var automatically — `APP_DEPLOYED_AT` would need to
be set manually, or written by a Render "Pre-Deploy Command" (e.g.
`echo "APP_DEPLOYED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)"` piped somewhere
Render reads env vars from — Render doesn't support writing env vars
from a build step directly, so realistically this one stays
manually-updated per release unless a small custom build hook is added
later). `APP_RELEASE_NAME` is a free-text label you can set to anything,
e.g. a version tag.

## Permissions

- **Content staff** (`is_staff=True`, not in "Operations Managers", not
  superuser): see Match & Prediction Operations in full — predictions,
  categories, selections, result entry, settlement. Do **not** see
  Business & System Overview at all.
- **Operations Managers** (`is_staff=True` + member of the "Operations
  Managers" `Group` — assign via the User admin's Groups field): see
  both sections.
- **Superusers**: see everything, always.

The group is seeded empty by `dashboard/migrations/0001_seed_operations_managers_group.py`
on `migrate` — add staff to it manually via `/admin/auth/group/` or the
User change form.

## Testing

```
cd backend
python manage.py test                 # full suite, 113 tests
python manage.py test dashboard        # just the new dashboard tests, 27 tests
python manage.py check                 # system checks
python manage.py check --deploy        # deployment checks
```

All 113 tests pass (86 pre-existing + 27 new). The 6 warnings from
`check --deploy` (`SECRET_KEY` strength, `DEBUG`, HSTS, SSL/cookie
security) are pre-existing and come from the local `.env` file used for
this session's testing (`DEBUG=True`, a placeholder `SECRET_KEY`) — not
from this work, and not present against Render's actual production
environment variables (which set `DEBUG=False` and a real `SECRET_KEY`,
enforced by `config/settings.py`'s own startup check).

New dashboard tests cover: superuser/staff/ops-manager access and
visibility, every quick-action link resolving and filtering correctly,
Today's Games correctness and timezone handling, active-subscriber /
revenue / pending-payment / popular-plan calculation correctness, the
failed-email metric reporting "not configured" rather than a fabricated
number, real webhook/verification failure counts, resilience to a
database health-check failure and to missing deployment metadata (both
must not crash the page), a query-count ceiling (regression guard against
future N+1s), and admin-level regression smoke tests for prediction
creation, update, result entry and auto-settlement.

No formatter or linter is configured for this backend (no `flake8`,
`ruff`, `black`, or `pyproject.toml` lint config found in the repo) — none
was run, matching the existing codebase.

## Troubleshooting

- **Dashboard cards show 0 for everything on a fresh database** — this is
  correct, not a bug, if there's genuinely no data yet (matches the
  session's earlier finding that prediction categories/predictions were
  empty in production before being seeded).
- **"Database Status: Unavailable"** — the health check itself never
  crashes the page; if you see this, check Render's Postgres service
  status and `DATABASE_URL` before anything else.
- **A staff member doesn't see Business & System Overview** — confirm
  they're either a superuser or added to the "Operations Managers" group
  at `/admin/auth/group/`.
- **A dashboard link 404s or shows "Filtering by X is not allowed"** —
  every dashboard link uses either a plain registered `list_filter`
  field or one of the three new `SimpleListFilter` classes in
  `predictions/admin.py`; if you add a new dashboard link pointing at a
  filter that isn't registered on the target `ModelAdmin`, Django will
  reject the querystring.

## Known limitations (explicitly not fabricated)

- **Email delivery is not tracked.** No `EmailLog`-equivalent model
  exists; "Failed Emails" is honestly reported as unavailable, not a
  guessed number.
- **Monthly revenue cannot exclude refunds or test-mode Paystack
  transactions**, because no refund model and no per-payment test/live
  flag exist in the current schema. `PAYSTACK_MODE` only switches which
  API key is loaded process-wide; it isn't stored on `Payment` rows.
- **Deployment metadata requires manual Render configuration** — nothing
  is inferred from process start time or file timestamps.
- **The cache is per-process (LocMemCache)**, not shared across gunicorn
  workers on Render — acceptable for a ~60s-stale reporting metric, not
  suitable if this were load-bearing data.
