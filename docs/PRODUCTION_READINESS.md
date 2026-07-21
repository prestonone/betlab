# Bet Lab production readiness

## Architecture

Bet Lab is a Vite/React single-page frontend backed by a versioned Django REST API. JWT authenticates browser requests. Django owns plan pricing, Paystack transaction creation and verification, webhook validation, payment records, subscription activation, and prediction access control. PostgreSQL is selected when `DATABASE_URL` is set; SQLite remains the local default.

## Confirmed complete

- Registration, login, token refresh, session restoration, and protected current-user API.
- Country-aware plans and billing profiles, including country locking after payment.
- Hosted Paystack checkout initialized by the backend from the stored `PlanPrice`.
- Server-to-server verification with reference, status, amount, and currency validation.
- SHA-512 HMAC webhook validation against the exact raw request body.
- Transaction-safe, idempotent activation shared by callbacks and webhooks.
- Active/grace/expired subscription resolution and member-only Lab prediction access.
- Frontend checkout redirect, payment callback states, and live plan/expiry display.
- Extracted page and navigation modules; `App.tsx` now contains only routing/composition.
- Environment-driven production security, PostgreSQL, CORS, CSRF, static files, and URLs.

## Required environment variables

Frontend:

```env
VITE_API_BASE_URL=https://api.example.com
```

Backend:

```env
DEBUG=False
SECRET_KEY=<long-random-django-secret>
ALLOWED_HOSTS=api.example.com
DATABASE_URL=postgresql://user:password@host:5432/betlab?sslmode=require
ACCESS_TOKEN_LIFETIME=15
REFRESH_TOKEN_LIFETIME=7
FRONTEND_URL=https://app.example.com
CORS_ALLOWED_ORIGINS=https://app.example.com
CSRF_TRUSTED_ORIGINS=https://app.example.com
SECURE_SSL_REDIRECT=True
PAYSTACK_SECRET_KEY=<Paystack test or live secret key>
PAYSTACK_WEBHOOK_SECRET=<same Paystack secret used to sign webhooks>
PAYSTACK_CALLBACK_URL=https://app.example.com/?payment=callback
```

`PAYSTACK_API_URL` defaults to `https://api.paystack.co` and should not normally be changed. Hosted Paystack checkout does not expose or require a public key in the frontend.

## Build, migrate, and start

```bash
python -m venv .venv
.venv/bin/pip install -r backend/requirements.txt
cd backend
../.venv/bin/python manage.py migrate
../.venv/bin/python manage.py seed_subscription_plans
../.venv/bin/python manage.py collectstatic --noinput
../.venv/bin/gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000}
```

```bash
npm ci
npm run typecheck
npm run build
```

Serve `dist/` as the frontend deployment output. Configure the frontend host to return `index.html` for application routes. The callback uses query parameters and therefore has the exact format:

```text
https://app.example.com/?payment=callback
```

The exact Paystack webhook URL is:

```text
https://api.example.com/api/v1/payments/webhook/paystack/
```

## Paystack Dashboard steps

1. Select Paystack test mode for validation, then copy its secret key into `PAYSTACK_SECRET_KEY` and `PAYSTACK_WEBHOOK_SECRET`.
2. Set `PAYSTACK_CALLBACK_URL` to the production frontend callback above. The backend also sends this callback URL during initialization.
3. Add the production webhook URL above in the Paystack Dashboard.
4. Deploy the backend variables without exposing either secret to Vite or browser code.
5. Run one controlled test-mode transaction.
6. Confirm a successful webhook delivery, a successful `Payment` record, one linked active `Subscription`, and member access to Lab predictions.
7. When ready, switch the deployment to the live Paystack secret, set the webhook signing secret to that same live secret, confirm live mode, and repeat one controlled transaction.

## Manual smoke test

- Register a new account and confirm the JWT-backed session restores after refresh.
- Select Daily Pass, Weekly Lab, or Monthly Lab and confirm the browser opens Paystack.
- Abandon one checkout and confirm no subscription activates.
- Complete one checkout and confirm the callback shows success and the correct expiry.
- Confirm duplicate callback refreshes and duplicate webhooks do not extend access twice.
- Confirm an unauthenticated or unsubscribed account cannot retrieve Lab predictions.
- Expire a test subscription and confirm Lab access is removed after its configured grace period.
- Confirm `/admin/` static assets load and application logs contain no keys or card data.

## Automated verification

The completion pass ran Django system checks, migration consistency checks, the additive migrations, 57 backend tests with mocked Paystack calls, frontend TypeScript checking, and the Vite production build. See the final handoff for the exact latest results.

## Remaining limitations

- No deployment provider configuration existed in the repository, so no production infrastructure or preview deployment was created or modified.
- Paystack Dashboard configuration and real credentials cannot be completed from source control.
- The Vite build reports a non-failing large-chunk warning; code splitting is a performance follow-up, not a release blocker.
