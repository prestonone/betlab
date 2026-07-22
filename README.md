# Bet Lab

Bet Lab is a sports prediction subscription platform built with Django, Django REST Framework, React, TypeScript, and Vite.

The platform is under active development and focuses on authenticated prediction access, regional pricing, subscription memberships, and a versioned REST API.

## Technology Stack

### Backend
- Python
- Django
- Django REST Framework
- Simple JWT
- SQLite for local development

### Frontend
- React
- TypeScript
- Vite

## Local Development

### Backend

    python3 -m venv .venv
    source .venv/bin/activate
    python -m pip install -r backend/requirements.txt
    cd backend
    python manage.py migrate
    python manage.py runserver

Backend: http://127.0.0.1:8000/

### Frontend

    npm install
    npm run dev

Frontend: http://127.0.0.1:5173/

## API

The API is versioned under `/api/v1/`.

Protected endpoints use JWT authentication:

    Authorization: Bearer <access-token>

### Subscription Endpoints

    GET  /api/v1/subscriptions/countries/
    GET  /api/v1/subscriptions/plans/?country=NG
    GET  /api/v1/subscriptions/billing-profile/
    POST /api/v1/subscriptions/billing-profile/

The billing profile stores the authenticated user's selected country and regional billing configuration. The country can be changed until the profile is locked after the appropriate payment milestone.

## Current Features

- JWT authentication
- Versioned API routing
- Shared API response helpers
- Supported countries and currencies
- Regional subscription pricing
- Authenticated billing profiles
- Billing-country locking
- Django administration
- Backend-owned Paystack hosted checkout and verification
- Signed, idempotent Paystack webhooks
- Transaction-linked subscription activation
- Subscription-protected Lab predictions
- Production-safe environment configuration

## Development Checks

    cd backend
    python manage.py check
    python manage.py makemigrations --check --dry-run
    cd ..
    npm run typecheck
    npm run build
    git diff --check
    git status --short

Production configuration, Paystack setup, and the final smoke-test checklist are documented in [`docs/PRODUCTION_READINESS.md`](docs/PRODUCTION_READINESS.md).

## Status

Bet Lab is private software under active development.
