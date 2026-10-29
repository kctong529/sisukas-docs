---
weight: 4
title: "Environment Variables Reference"
description: "Environment configuration for the frontend, backend, filters API and SISU wrapper."
---

Each component has its own `.env.example`. Copy the relevant file to `.env` for local development; use the checked-in examples as the authoritative list of currently supported settings. Do not commit actual credentials.

## Frontend (`frontend/course-browser/.env`)

| Variable | Purpose |
|----------|---------|
| `VITE_GCS_BUCKET` | Base URL for hosted course datasets; the example points to the test bucket. |
| `VITE_BACKEND_URL` | Backend API base URL (example: `http://localhost:3000`). |
| `VITE_FRONTEND_URL` | Frontend origin (example: `https://localhost:5173`). |
| `VITE_FILTERS_API` | Filters API base URL (example: `http://127.0.0.1:8000`). |
| `VITE_WRAPPER_API` | SISU wrapper base URL (example: `http://127.0.0.1:8001`). |
| `VITE_ENVIRONMENT` | Environment label used by the frontend. |
| `VITE_DEBUG_PANELS`, `VITE_DEBUG_AUTH`, `VITE_DEBUG_COURSE_INDEX`, `VITE_DEBUG_STUDY_GROUP_STORE`, `VITE_DEBUG_PLAN_STORE`, `VITE_DEBUG_BLOCK_STORE`, `VITE_DEBUG_PERIOD_TIMELINE_STORE` | Development/debug controls. |

`VITE_*` values are exposed to browser code: **never put secrets in them**. The old `VITE_API_URL` setting is not the setting used by the current frontend service clients.

## Backend (`backend/.env`)

The backend uses PostgreSQL (`pg` and Drizzle) and Better Auth. It does **not** require Supabase project credentials for the main application runtime.

| Variable | Purpose |
|----------|---------|
| `PORT` | Backend listening port (example: `3000`). |
| `FRONTEND_URL` | Frontend origin for callbacks/links. |
| `BACKEND_URL` | Backend origin. |
| `BETTER_AUTH_URL` | Auth base URL, as configured for the deployment. |
| `BETTER_AUTH_SECRET` | Secret used by Better Auth; replace the example before real deployment. |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | PostgreSQL connection details. |
| `DATABASE_URL` | PostgreSQL connection URI, also used by the Drizzle tooling. |
| `CORS_ORIGINS` | Allowed cross-origin request origins. |
| `SISU_WRAPPER_BASE_URL` | Wrapper service base URL. |
| `RESEND_API_KEY` | Optional for local development: missing/invalid key causes magic-link output in backend logs. |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Credentials for the separate admin-token login mechanism. |

Use the database credentials supplied by the local Compose configuration. `npm run db:push` is the current development schema command; migrations are separately supported via `npm run db:migrate`.

## Filters API (`filters-api/.env`)

| Variable | Purpose |
|----------|---------|
| `GCS_BUCKET_NAME` | Bucket for saved filter configurations. |
| `CORS_ORIGINS` | Origins accepted by the API. |

## SISU wrapper (`sisu-wrapper/.env`)

| Variable | Purpose |
|----------|---------|
| `AALTO_COURSE_API_KEY` | API credential for upstream course-data requests when needed. |
| `CORS_ORIGINS` | Allowed frontend origins. |

## Pipeline and test-only credentials

The course-update workflow uses the GitHub Actions secret `AALTO_USER_KEY`. Do not confuse this workflow secret with the wrapper's local `AALTO_COURSE_API_KEY`. See [Data Pipeline](../data-pipeline/).

**Legacy RLS tests:** `backend/tests/rls.setup.ts` still uses Supabase clients and reads `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SERVICE_ROLE_KEY`. These are **test-harness credentials, not backend runtime requirements**; see [Row-Level Security](../../securities/row-level-security-testing/). The tests' ability to run against the current PostgreSQL/Better Auth development environment has not been established by this documentation audit.

## Local setup

```bash
make setup
# Then inspect and customize the relevant service .env files.
```

`make setup` copies `.env.example` to `.env` for each service. Do not assume sample passwords, secrets, or URLs are production-safe. Keep `.env` files out of version control and rotate exposed secrets promptly.

See [Running Sisukas Locally](../running-locally/) and [Makefile Reference](../makefile/).
