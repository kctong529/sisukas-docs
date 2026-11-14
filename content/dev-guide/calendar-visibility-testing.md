---
weight: 10
title: "Calendar Visibility Testing"
description: "Runbook for Calendar preference contract, database, RLS, and two-account staging Playwright tests (#192)."
---

> [!NOTE]
> **#192 verification completed on 14 November 2026 (Test and staging).** All 37 defined scenario IDs have passing evidence. This page is the sole operational runbook and results record for the Calendar visibility persistence suite. Production migration history remains separately gated by #135.

## Scope and test boundaries

Calendar visibility is a plan-scoped *presentation preference*, not SISU registration or a change to teaching data. Testing distinguishes four independent boundaries:

| Layer | What it proves | What it does not prove |
| --- | --- | --- |
| Frontend contracts and stores | Identity/inheritance, hydration gating, optimistic write sequencing, stale-request invalidation | Database permissions or browser persistence |
| PostgreSQL integration | Sparse writes, constraints, offering isolation, resets and deletion behavior | Better Auth ownership checks |
| Authenticated HTTP integration | Real Better Auth session resolution and plan authorization | Supabase JWT identity propagation |
| Restricted-role RLS | Direct PostgreSQL grants/policies under simulated `auth.uid()` identities | End-to-end Better Auth browser sessions |
| Staging Playwright | Actual user interaction, server hydration, plan and account isolation, failure recovery | Production deployment |

The [Calendar Visibility](../../architecture/calendar-visibility-preferences/) page owns semantic rules; [Calendar Schema](../../architecture/calendar-visibility-schema/) owns the table and key design; [Calendar Preference API](../calendar-preference-api/) owns request/response contracts; [Row-Level Security](../../securities/row-level-security-testing/) explains RLS policy behavior. Do not copy the full validation matrix into these reference pages.

## Safety prerequisites

- Verify that `backend/.env.test` points to **Supabase Test**, including the expected `CALENDAR_TEST_PROJECT_REF`. Opt-in database tests create and remove fixture rows. Never execute these against Production.
- Verify `https://test.sisukas.eu` is the staging deployment containing the current Calendar preference code. The browser write suite refuses other origins.
- Use **two dedicated test accounts**, each with an existing active plan. The suite creates offering/plan fixtures itself; do not manually add courses or teaching groups.
- Store browser authentication files in `frontend/course-browser/playwright/.auth/`, keep them gitignored, and never upload or commit them. These files contain live session credentials.
- Do not run the same staging write suite concurrently against the same test account. Tests temporarily activate disposable plans.

## 1. Frontend contracts and regression

From `frontend/course-browser/`:

```sh
npx tsc -p tsconfig.test.json --noEmit
npx vitest run
```

For I04 alone (synthetic reused group ID across separate offerings):

```sh
npx vitest run tests/application/calendar/calendarVisibilityContract.test.ts
```

The contract suite includes explicit-visible overrides inside hidden groups, separate offering identities, derived-key collision handling, and stale occurrence keys. No real SISU group-ID collision is necessary.

## 2. Backend, database, HTTP, and RLS

From `backend/`:

```sh
npx tsc --noEmit
npx vitest run
```

The default suite skips opt-in Calendar database, authenticated HTTP, and RLS integration tests. After independently checking the Test database connection and guard:

```sh
CALENDAR_DB_TEST=yes \
CALENDAR_HTTP_TEST=yes \
CALENDAR_RLS_TEST=yes \
npx vitest run \
    tests/integration/calendarPreferences.db.test.ts \
    tests/integration/calendarPreferences.http.test.ts \
    tests/integration/calendarPreferences.rls.test.ts \
    --no-file-parallelism
```

The database I04 test constructs two synthetic offering references with the **same** group ID in one plan and checks that group-level preferences and occurrence-level overrides remain independent. The RLS test uses restricted database roles plus simulated JWT subjects; Better Auth plan ownership is verified by the separate HTTP suite.

For migration `0005`, run the read-only SQL metadata verifier `backend/drizzle/sql/verify_0005_calendar_visibility_preferences.sql` against the confirmed **Supabase Test** project. It checks metadata, not actual owner-isolation enforcement. Only the restricted-role test proves policy behavior under its simulated identities.

## 3. Capture two authenticated staging browser sessions

Run these commands from `frontend/course-browser/`. The `capture-auth-state.mjs` script opens a headed Playwright browser, prompts you to sign in with a magic link, checks sign-in after a reload, and saves a browser `storageState` file.

**Account A:**

```sh
SISUKAS_BASE_URL=https://test.sisukas.eu \
SISUKAS_STORAGE_STATE=playwright/.auth/test-user.json \
npm run test:e2e:auth:setup
```

In the Playwright-controlled window, request a magic link for dedicated **test account A**. Paste the received magic-link URL into **that browser window's address bar** (not the terminal or your usual browser), click **Sign In Now** on the verification page, wait until the app is signed in, and press Enter in the terminal. The script reloads and verifies the session before saving.

**Account B:**

```sh
SISUKAS_BASE_URL=https://test.sisukas.eu \
SISUKAS_STORAGE_STATE=playwright/.auth/test-user-b.json \
npm run test:e2e:auth:setup
```

Repeat the process using a **different dedicated test account B**. Do **not** authenticate with A's account again. The tests enforce different saved-state paths and check that the accounts' existing plan IDs do not overlap, so copying A's session file to B's path is not valid.

Both state files are credentials. Keep them local and gitignored. Recapture if a session expires; the two state files are not permanent fixtures.

## 4. Run staging Playwright acceptance

Run E04 by itself first:

```sh
SISUKAS_BASE_URL=https://test.sisukas.eu \
SISUKAS_CALENDAR_WRITE_TEST=yes \
npx playwright test calendar-persistence.spec.ts \
    --project=chromium \
    --grep 'E04' \
    --headed
```

E04 opens two separate authenticated browser contexts, creates disposable plans in A and B, attaches the same offering, hides its teaching group in A, and verifies it stays visible in B after reload. It then tests B's inability to read A's preferences through HTTP, independently changes B, and rechecks A. Finally it restores both original active plans and deletes the disposable plans.

Optional: override B's session path when it is stored elsewhere:

```sh
SISUKAS_CALENDAR_SECOND_STORAGE_STATE=playwright/.auth/other-test-user.json \
SISUKAS_BASE_URL=https://test.sisukas.eu \
SISUKAS_CALENDAR_WRITE_TEST=yes \
npx playwright test calendar-persistence.spec.ts --project=chromium --grep 'E04'
```

Run the complete browser suite:

```sh
SISUKAS_BASE_URL=https://test.sisukas.eu \
SISUKAS_CALENDAR_WRITE_TEST=yes \
npx playwright test calendar-persistence.spec.ts --project=chromium
```

| ID | Automated scenario | Expected result |
| --- | --- | --- |
| E01 | Hide group, reload | Server returns hidden preference; event remains hidden |
| E02 | Restore group, reload | Group becomes visible again after server hydration |
| E03 | Switch temporary plans A → B → A | Saved visibility remains scoped to the correct plan |
| E04 | Use two different authenticated accounts | No preference leakage across browser sessions or plan ownership |
| E05 | Fail first group PUT, then select Retry | Visible actionable error, saved intent after retry, persistence after reload |

These are **five scenarios in four Playwright tests** (`E01` and `E02` share one test). All fixture plans are provisioned automatically with the known staging offering and intended for cleanup in `finally`. If a test is interrupted or times out during cleanup, inspect **both** test accounts and remove leftover `Playwright #192` plans after restoring each account's normal active plan.

> [!WARNING]
> E04 requires genuine separate authenticated identities. It cannot be validated by reusing one storage state in two browser contexts. RLS tests also cannot substitute for E04: they exercise database roles/JWT claims, not two real Better Auth browser sessions.

## 5. Manual diagnostics when automation fails

| Symptom | Check |
| --- | --- |
| Authentication setup doesn't save | Complete the magic-link flow in the Playwright-controlled browser, click **Sign In Now**, and press Enter only after sign-in |
| E04 is skipped | Verify `playwright/.auth/test-user-b.json` exists and `SISUKAS_CALENDAR_WRITE_TEST=yes` is set |
| E04 says accounts overlap | Recapture B using a different test account, not a copy of A's state |
| Calendar won't open | The navigation control's accessible name is **Weekly calendar**, not `Calendar` |
| The group isn't shown | Verify that staging has the known offering and that the fixture week's navigation reaches 17 November 2026 |
| Error retry assertion fails | The failed PUT uses the global notification's **Retry**, not the Calendar's initial-GET retry control |
| Test times out or is interrupted | Check fixture cleanup in both accounts; do not delete pre-existing plans |
| DB suites unexpectedly skip | Check `CALENDAR_DB_TEST`, `CALENDAR_HTTP_TEST`, `CALENDAR_RLS_TEST` opt-in environment flags |

For interactive investigation, enable Preserve log in DevTools and filter for `/api/plans/` and `/calendar`. Failed GET blocks event rendering until preference readiness is known; a failed PUT preserves local intended visibility but marks it unsaved and exposes Retry through the notification system. Rapid writes to one identity are serialized; independent identities may write concurrently. The frontend does not have an offline persistence queue.

## Verified results (14 November 2026)

**All 37 tracked #192 scenarios (A01–A05, H01–H06, W01–W09, F01–F04, I01–I04, D01–D04, E01–E05) passed.** This is scenario-matrix coverage, not 100% source-code coverage.

| Suite | Observed result | Environment |
| --- | --- | --- |
| Frontend typecheck and full Vitest | 91 suites, **812/812** tests | Local |
| Backend typecheck and default Vitest | 12 suites, **100/100** tests; 18 opt-in tests skipped as intended | Local/Test |
| Calendar PostgreSQL integration | **7/7**, includes I04 | Supabase Test |
| Calendar authenticated HTTP integration | **4/4** | Supabase Test with Better Auth sessions |
| Calendar restricted-role RLS integration | **7/7** | Supabase Test with simulated JWT subjects |
| Browser persistence (`E01`–`E05`) | **4/4** Playwright tests | `https://test.sisukas.eu` |
| Migration `0005` metadata | Two tables, 12 columns, 13 constraints, eight policies, two PK indexes, eight authenticated grants, no anonymous table grants | Supabase Test |

The full scenario-by-scenario rationale and evidence belong in [#192](https://github.com/kctong529/sisukas/issues/192). Migration `0005` was subsequently applied and structurally verified in Production on 14 November 2026, but the Test/staging suites above must not be mistaken for Production behavior tests. Production guest smoke passed 4/4; authenticated Production Calendar smoke has not yet been reported. Migration-history recovery remains under #197.
