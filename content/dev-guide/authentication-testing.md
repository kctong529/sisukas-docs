---
weight: 9
title: "Authentication Testing"
description: "Local checks, controlled OAuth callback integration, Test database safeguards and deployment verification."
---

> [!WARNING]
> **The opt-in integration suites write fixtures to PostgreSQL.** Confirm that `backend/.env.test` uses the designated **Supabase Test** project before enabling them. Never run fixture-writing suites against Production; do not paste connection credentials into issues or CI logs.

## Local and integration validation (#215, #217)

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

The printed Better Auth errors (`account_not_linked`, untrusted provider, invalid state) in these **controlled-provider tests** are expected negative test cases. An intentional mock-service exception may also appear in frontend test stdout despite that test passing. These recorded results describe the earlier #215 baseline, not the latest #217 polish branch or a deployed Test revision. The separate #217 automated and manual results below must not be conflated with this historical total.

## Real Google OAuth and linking — deployed Test verification (16 November 2026)

Manual browser observations below were performed against `https://test.sisukas.eu` using disposable Test identities. They complement, rather than replace, the controlled-provider OAuth suite.

| Scenario | Result | Evidence and scope |
| --- | --- | --- |
| New Google identity and repeat Google sign-in (#216) | **Pass** | Authenticated session established; repeat sign-in retained existing application data |
| Google-created identity → magic-link sign-in (#217) | **Pass** | Canonical `session.user.id` compared before/after; same user and saved data |
| Unlinked existing magic-link account attempts ordinary Google sign-in (#222) | **Expected rejection; recovery pass** | `account_not_linked` returns to frontend sign-in modal with magic-link guidance, not the backend root |
| Magic-link account → explicit Connect Google (#217) | **Pass** | Google association confirmed, original `user.id`, `createdAt` and saved data unchanged; core checklist 21/21 |
| Linked account → Google sign-in → magic-link sign-in (#217) | **Pass** | All three authenticated stages used the same canonical `user.id` |
| Different-email Google linking (#217) | **Expected rejection; pass** | Clear mismatch message, Google remains disconnected, original `user.id` and saved data unchanged |
| Wrong Google account → retry with matching identity (#217) | **Pass** | `linkSocial()` requests `prompt=select_account`; no private window or Google logout required |
| Account settings keyboard and narrow-mobile use (#217) | **Pass, manually checked** | Escape close, focus containment/restoration, responsive controls, understandable failure messaging |
| Real provider cancellation/abandoned authorization | **Not independently exercised in browser** | Controlled-provider cancellation, invalid OAuth state and expired-session tests pass; full browser matrix belongs to #218 |
| Production Google sign-in | **Not enabled** | Release gate and rollout tracked by #218 |

### Automated regression evidence

- #215 baseline: **143/143 backend tests** (20 files, with the opt-in suites enabled), **816/816 frontend tests** (93 files), and successful build/checks (historical run).
- #217 backend account-linking OAuth suite: **9/9 passed**, including implicit-link rejection, ownership conflicts, different/unverified emails, cancellation, invalid state, new registration and expired sessions.
- #217 frontend: connected-method discovery, callback marker expiry/validation, provider verification, error recovery and focused Account settings component tests have passed in their respective development increments. The developer confirmed the current UI-polish branch's tests pass; no consolidated final suite count or deployed SHA was provided for that branch.

Do not include live session tokens, OAuth `state` values or credentials in test records. Use `session.user.id` solely to compare identities, without publishing raw identity/session dumps.

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
