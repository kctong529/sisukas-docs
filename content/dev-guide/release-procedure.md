---
weight: 8
title: "Release Procedure"
description: "Prepare, validate, deploy, and tag Sisukas releases without bypassing PostgreSQL migration safety checks."
---

> [!IMPORTANT]
> Merging to `main` **triggers Production deployment** (`.github/workflows/deploy-prod.yml`). Merging to `dev` triggers the Test deployment (`deploy-dev.yml`). **A Git tag does not initiate either deployment.** Do not merge a release candidate to `main` before its database prerequisite has been approved and executed in the agreed deployment order.

## Version source and release candidate

The frontend version lives in `frontend/course-browser/package.json` and the root package in `frontend/course-browser/package-lock.json`. The backend version lives in `backend/package.json`. For each release, align the frontend package and lockfile with the backend package version. **v0.9.0 was deployed to Production on 14 November 2026**; the previous `0.8.5` → `0.9.0` bump is historical, not an instruction to repeat.

```bash
cd frontend/course-browser
node -p 'require("./package.json").version'
node -p 'require("./package-lock.json").packages[""].version'
cd ../../backend
node -p 'require("./package.json").version'
```

Before merging, confirm the candidate contains #192's completed verification work (including offering-collision regression I04), review the `dev...main` diff and the commit SHAs, and ensure documentation is consistent. The [Calendar Visibility Testing](../calendar-visibility-testing/) guide records commands and historical test evidence; release-candidate tests should be run on the actual commit intended for deployment.

## Test deployment and regression

1. Merge the reviewed feature/validation PR into `dev`. The push triggers deployment to Test. Check GitHub Actions and application health; a green unit test alone does not guarantee a successful deployment.
2. Run frontend checking, Vitest, and build; run backend checking and Vitest. Verify the opt-in Calendar database/HTTP/RLS suites target **Supabase Test only**. Never reuse the opt-in fixture tests against Production.
3. Run E01–E05 browser acceptance on `https://test.sisukas.eu` with two *different dedicated* authenticated accounts. Follow [Calendar Visibility Testing](../calendar-visibility-testing/) for account-state capture and cleanup. Review any leftover `Playwright #192` temporary plans.
4. Inspect the released staging assets and API behavior before promoting.

## Production migration gate

Calendar visibility persistence requires `backend/drizzle/sql/0005_calendar_visibility_preferences.sql`. **Migration `0005` was applied to both Test and Production before the v0.9.0 Production deployment on 14 November 2026.** Refer to [Database Operations](../database-operations/#calendar-preference-migration-0005) and migration-history investigation [#197](https://github.com/kctong529/sisukas/issues/197). Do not infer that a passing Test suite means Production is ready.

- Verify the target Production project reference using read-only inspection, confirm backup and recovery plan, and establish an approved migration owner and maintenance window.
- Review the exact standalone SQL checksum and confirm whether `0005` is already present. Coordinate the standalone procedure without attempting to replay historical Drizzle migrations, use `db:push`, or modify the migration journal manually.
- Execute approved DDL **before application code that requires the new tables becomes reachable**. The existing deployment workflow does not serialize frontend/backend deploy jobs, so do not rely on the `main` push as a migration gate.
- Perform read-only verification of table, constraint, policy, index, and grant structure. Do not run destructive integration or RLS harnesses against Production.

If this gate is unresolved, **stop before merging `dev` into `main`**. A version bump or release tag does not resolve it.

## Production smoke checks

After deployment, run **read-only guest checks** against the actual Production origin. On 14 November 2026 the `guest.spec.ts` Chromium suite passed **4/4 in 8.1 seconds** against `https://sisukas.eu`, covering course loading, active/historical sources, protected-view sign-in behavior, and fresh reload/navigation:

```bash
cd frontend/course-browser
SISUKAS_BASE_URL=https://sisukas.eu npx playwright test guest.spec.ts --project=chromium
```

This is **not an authenticated Calendar persistence verification**. Separately use a dedicated disposable Production test account (only with approval) to check sign-in, active-plan Calendar hydration, group hide/restore persistence after reload, and safe cleanup. Do not run staging's mutating `calendar-persistence.spec.ts` against Production. Record the observed results; if authenticated checks have not been performed, mark them **pending**, not passed.

## Production deploy and tag

1. Review the `dev` → `main` PR, especially database compatibility, deployment workflow, environment configuration, and rollback plan. Obtain release approval.
2. After satisfying the database prerequisite, merge the approved PR to `main`. Monitor the `Deploy to Prod` workflow and each service deployment; confirm no failed jobs or unexpected version drift.
3. Perform authorized, limited production smoke checks of application loading, authentication, Calendar hydration, and visibility persistence. A preference write requires an approved test account and cleanup plan.
4. Record the deployed `main` SHA, database migration reference/checksum, workflow result, smoke-check result, and any follow-up issues.
5. Tag that **verified deployed SHA** and publish release notes. The Production guest smoke result alone does not establish that authenticated Calendar behavior passed; capture that verification or document it as pending before sign-off. Example (after verifying the checkout is the correct deployed commit):

```bash
git fetch origin --tags
git switch main
git pull --ff-only origin main
git rev-parse HEAD  # compare to the deployed SHA
# Check that v0.9.0 does not already exist before tagging.
git tag -a v0.9.0 -m "Sisukas v0.9.0"
git push origin v0.9.0
```

### v0.9.0 evidence (14 November 2026)

- Release PR [#213](https://github.com/kctong529/sisukas/pull/213) merged into `main`.
- Production deployment reported successful; exact deployed SHA and tag should be checked against the successful workflow before publication.
- Migration `0005` checksum: `71c874731dd75e9766461ffd105bb81ddd565bfc6c0bf38c0d363f6506aec524`; structural verifier matched two tables, 12 columns, 13 constraints, two primary-key indexes, eight RLS policies, eight authenticated CRUD grants and zero anonymous grants.
- Production guest Playwright checks: **4/4 passed (8.1 s)**.
- Authenticated Production Calendar smoke: **not yet evidenced in this record**.
- Historical Drizzle journal reconciliation remains open under [#197](https://github.com/kctong529/sisukas/issues/197).

If a deploy or smoke check fails, investigate and use the reviewed rollback/recovery process. Do not label a partially deployed release as verified merely because the tag exists.
