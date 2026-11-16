---
weight: 9
title: "Authentication Testing"
description: "Local checks, controlled OAuth callback integration, Test database safeguards and deployment verification."
---

> [!WARNING]
> **The opt-in integration suites write fixtures to PostgreSQL.** Confirm that `backend/.env.test` uses the designated **Supabase Test** project before enabling them. Never run fixture-writing suites against Production; do not paste connection credentials into issues or CI logs.

## Pre-deployment validation (#215)

From `backend/`:

```sh
npx tsc --noEmit
npm run build

ACCOUNT_LINKING_HTTP_TEST=yes \
ACCOUNT_LINKING_OAUTH_TEST=yes \
CALENDAR_DB_TEST=yes \
CALENDAR_HTTP_TEST=yes \
CALENDAR_RLS_TEST=yes \
npx vitest run --no-file-parallelism
```

The OAuth suite uses a **controlled local provider** but real Better Auth HTTP callbacks and Supabase Test persistence. This verifies the linking contract without enabling public Google credentials. The Calendar integration suites exercise authenticated HTTP requests, plan ownership, preference persistence and restricted-role RLS scenarios. These are different security boundaries: Supabase-style RLS checks do not automatically prove that Better Auth's runtime database role uses the same context.

From `frontend/course-browser/`:

```sh
npm run lint
npm run check
npx vitest run
npm run build
```

The backend and frontend boundary tests prevent new direct imports of internal authentication infrastructure from unrelated code.

### Recorded #215 pre-deployment result — 16 November 2026

| Suite | Observed result |
| --- | --- |
| Backend `tsc` and build | Passed |
| Backend full suite with all five opt-in flags | **20 files, 143/143 tests passed** |
| Frontend lint and Svelte/TypeScript check | Passed, zero Svelte errors/warnings |
| Frontend Vitest | **93 files, 816/816 tests passed** |
| Frontend build/PWA generation | Passed |
| Database uniqueness index | Verified on Supabase Test |

The printed Better Auth errors (`account_not_linked`, untrusted provider, invalid state) in these **controlled-provider tests** are expected negative test cases. An intentional mock-service exception may also appear in frontend test stdout despite that test passing. These results are evidence from the local branch; they do not verify the pending deployed Test revision.

## Real Google OAuth — Test verification (16 November 2026, #216)

The following are **manual observations from the deployed Test environment**, not results from the controlled-provider integration suite above:

| Scenario | Result | Scope/limitation |
| --- | --- | --- |
| New Google identity signs in | **Pass** | Account and authenticated session created; all five application views loaded |
| Same identity signs in again through Google | **Pass** | Existing application data persisted |
| Google-created identity signs in with magic link | **Pass (observed data)** | Same data available; the exact `user.id` was not independently compared |
| Existing unlinked magic-link identity signs in through Google | **Expected rejection, poor recovery** | `account_not_linked`, browser ends at `https://api.test.sisukas.eu/?error=account_not_linked` displaying backend root response |
| Authenticated Connect Google for existing user | **Not yet tested** | Account settings/linking implementation belongs to #217 |
| Consent rejection, expired state, other OAuth failures | **Not yet verified end to end** | Frontend error handling belongs to #222; acceptance to #218 |
| Production Google sign-in | **Not enabled** | Defer until #218 rollout gate |

A successful repeat sign-in and unchanged visible data do **not** substitute for checking the canonical `user.id`. For #217/#218 use dedicated Test identities, capture the resolved identity before and after linking, and compare ownership of plans, favourites, grades and Calendar preference records. Do not log tokens or passwords.

**Current defect (#222):** unlinked existing users receive a raw backend-root error rather than actionable frontend feedback. Do not mark OAuth failure recovery as passing until the redirect and message are exercised in the browser.

## Verify migration `0006` on Test

Use the designated Test URL and read-only introspection:

```sh
psql "$TEST_DATABASE_URL" -P pager=off -c "
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'account'
  AND indexname = 'account_provider_identity_unique';"
```

Expect `CREATE UNIQUE INDEX` on `(provider_id, account_id)`. Confirm the correct target database before any migration and see [Release Procedure](../release-procedure/) for the Production gate.

## After merging into `dev`

Only after the reviewed commit is deployed to `https://test.sisukas.eu`, verify the deployed SHA and run the repository's applicable guest and authenticated Playwright suites. Capture a session using a **dedicated Test account** in the Playwright-controlled browser; retain storage-state files locally and gitignored.

```sh
cd frontend/course-browser
SISUKAS_BASE_URL=https://test.sisukas.eu \
npx playwright test guest.spec.ts --project=chromium

SISUKAS_BASE_URL=https://test.sisukas.eu \
npm run test:e2e:auth:setup

SISUKAS_BASE_URL=https://test.sisukas.eu \
npx playwright test authenticated.spec.ts --project=chromium
```

Manually confirm magic-link receipt and verification, reload/session restoration, access to existing owned plans and favourites, and sign-out. Run the sign-out acceptance test **last** because it invalidates the captured session. Consult the current Playwright config for exact projects and optional suites; Calendar's state-mutating acceptance test has its own guard and cleanup contract in [Calendar Visibility Testing](../calendar-visibility-testing/).

**Do not run Playwright against a stale Test deployment and claim that it verified the new branch.** Failed or unperformed deployed checks should remain recorded as pending; the local suite is not a substitute for deployment validation.
