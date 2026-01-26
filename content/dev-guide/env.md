---
weight: 4
title: "Environment Variables Reference"
---

Each Sisukas component uses a `.env` file for configuration. Copy from `.env.example` when setting up.

## Frontend (`frontend/course-browser/.env`)

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_GCS_BUCKET` | Google Cloud Storage bucket URL for course data | `https://storage.googleapis.com/sisukas-core` |
| `VITE_API_URL` | Backend API base URL (optional, defaults to same origin) | `http://localhost:3000` |

## Backend (`backend/.env`)

| Variable | Purpose | Required | Example |
|----------|---------|----------|---------|
| `ADMIN_USERNAME` | Username for admin dashboard | ✓ | `admin` |
| `ADMIN_PASSWORD` | Password for admin dashboard | ✓ | (set to secure value) |
| `SUPABASE_URL` | Your Supabase project URL | ✓ | `https://abc123.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase public key (for client-side auth) | ✓ | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (for server-side admin tasks) | ✓ | `eyJhbGc...` |
| `DATABASE_URL` | Direct database connection (if using Prisma) | Optional | `postgresql://...` |

## Filters API (`filters-api/.env`)

| Variable | Purpose | Required | Example |
|----------|---------|----------|---------|
| `SUPABASE_URL` | Your Supabase project URL | ✓ | `https://abc123.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase public key | ✓ | `eyJhbGc...` |
| `DATABASE_URL` | Direct database connection | Optional | `postgresql://...` |

## SISU Wrapper (`sisu-wrapper/.env`)

| Variable | Purpose | Required | Example |
|----------|---------|----------|---------|
| (None required for REST API) | SISU Wrapper doesn't need `.env` for basic operation | — | — |

## GitHub Actions Secrets (`.github/workflows/check_course_updates.yml`)

These are configured as **GitHub Secrets** (not in `.env`):

| Secret | Purpose |
|--------|---------|
| `AALTO_USER_KEY` | API key for Aalto's course data API (required for data pipeline) |
| `GCS_SERVICE_ACCOUNT_KEY` | JSON key for Google Cloud Storage authentication |

See [Data Pipeline](./data-pipeline/) for details.

## Getting Started with `.env` Files

1. **Copy the example file:**
````bash
   cp backend/.env.example backend/.env
````

2. **Edit with your values:**
````bash
   nano backend/.env
````

3. **For local development:** Most variables have sensible defaults. The minimum you need:
   - `ADMIN_USERNAME` and `ADMIN_PASSWORD` (required)
   - Supabase credentials (required for backend to work)

4. **For production:** All variables should be explicit and secure. Never commit `.env` files to git.

## Never Commit `.env` Files

Add to `.gitignore`:
```
.env
.env.local
.env.*.local
```

`.env` files contain secrets. Always keep them private.

## Links to Detailed Setup

- [Getting Started: Backend Setup](../../getting-started/#running-backend-services)
- [Makefile Reference: Environment Variables](../makefile/#environment-variables)
- [Data Pipeline: GitHub Actions](../data-pipeline/#github-actions-workflow)