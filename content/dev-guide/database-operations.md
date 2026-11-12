---
weight: 6
title: "Database Operations"
description: "Inspect, compare, and troubleshoot Sisukas PostgreSQL environments, RLS, and migration history."
---

> [!IMPORTANT]
> These procedures distinguish **read-only inspection** from database changes. Always identify the Supabase project before running SQL, and never run RLS integration tests against production: the harness creates and deletes users and data. Existing databases were partly provisioned outside a complete version-controlled migration history. Do not run `db:push` or `db:migrate` against shared databases until that history is reconciled.

This page describes the backend PostgreSQL operational state established during the [#135 investigation](https://github.com/kctong529/sisukas/issues/135) in November 2026 and the commands for checking it again. It is an **incident baseline**, not a claim that database provisioning or migrations are fully automated. For access-control reasoning, see [Row-Level Security](../../securities/row-level-security-testing/); for service configuration, see [Environment Variables](../env/).

## Database boundaries

Sisukas uses PostgreSQL hosted on Supabase for application data. The Express backend uses Drizzle and Better Auth; the Supabase Auth/Data API clients found in the repository are used by the legacy RLS integration harness, not the main backend runtime.

| Boundary | Where | Purpose |
| --- | --- | --- |
| Runtime database | `backend/src/db/schema.ts`, backend database connection | Tables, constraints, and backend persistence |
| Drizzle tooling | `backend/drizzle.config.cjs`, `backend/package.json` | Schema generation, migration, or direct schema push |
| Generated migration history | `backend/drizzle/meta/`, generated `drizzle/*.sql` | Local migration snapshots/journal and migration statements |
| Custom SQL | `backend/drizzle/sql/0001_*.sql` through `0005_*.sql` | RLS enablement, policies/grants, active-plan invariant, standalone Calendar preference migration |
| RLS integration tests | `backend/tests/rls.*.test.ts`, `rls.setup.ts` | Supabase Auth sessions and Data API requests exercising policies |
| Database migration journal | `drizzle.__drizzle_migrations` | Drizzle's database-side record of applied migrations, when present |

`DATABASE_URL` identifies a PostgreSQL connection. `SUPABASE_URL` identifies a Supabase API project. These settings are independent and **can silently refer to different projects**.

## Environment variables

Run backend commands from `sisukas/backend/`. Confirm current names in the backend `.env.example`, `drizzle.config.cjs`, and test setup; do not infer them from another service's configuration.

| Variable | Used by | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Drizzle CLI and PostgreSQL connection tooling | Includes database host, username, and password; do not print it or pass it as a command argument in logs |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Backend DB configuration, where configured | May differ from the URI; check which settings the invoked command actually reads |
| `SUPABASE_URL` | RLS test Supabase clients | Must be the intended **test** project API URL |
| `SUPABASE_PUBLISHABLE_KEY` | RLS test non-administrative client | Match the same test project |
| `SERVICE_ROLE_KEY` | Legacy RLS test administrative client | Privileged legacy key, read by the test setup; planned replacement with a Supabase secret key |
| `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`, `PGSSLMODE` | `psql` and `pg_dump` | PostgreSQL CLI settings; these tools do **not** automatically read `.env` or `DATABASE_URL` |

> [!WARNING]
> `.env` and `.env.test` may be loaded by different processes. `source .env` does **not** necessarily export variables in the shell, and dotenv may retain existing exported values depending on its configuration. In November 2026, obsolete `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and administrative credentials in `.env.test` caused misleading PostgREST schema-cache failures even while `DATABASE_URL` correctly targeted test. Never assume that a working database connection proves the RLS test clients point to the same project.

### Identify the target

The following read-only command prints the database connection endpoint **without its password**. For a Supabase pooler URI, the username convention `postgres.<project-ref>` gives the project reference. A direct URI or local database may not encode it; check the Supabase **Connect** panel instead.

```bash
cd backend
node <<'NODE'
require('dotenv').config({ quiet: true });
const url = new URL(process.env.DATABASE_URL);
const username = decodeURIComponent(url.username);
console.log({
  host: url.hostname,
  port: url.port || '5432',
  database: url.pathname.slice(1),
  projectRef: username.startsWith('postgres.')
    ? username.slice('postgres.'.length)
    : '(verify in Supabase Connect)',
});
NODE
```

Verify `SUPABASE_URL` separately from the **test** project's dashboard. Compare the project ref of every Supabase test client and the database target before running the test suite. Key values must never be printed. For the application database, the target is often a Supabase pooler (`6543` for transaction pooling); direct or session connections are more appropriate for schema tools, using the connection URI supplied by the dashboard rather than guessing a port.

## PostgreSQL connection

Install a `psql` and `pg_dump` client whose major version is compatible with the server (the November 2026 Supabase servers ran PostgreSQL 17). On macOS, `brew install postgresql@17` provides the corresponding clients; check which binary your shell resolves.

```bash
psql --version
pg_dump --version
```

When `.env` contains `DATABASE_URL`, the following one-off Node wrapper avoids putting the password in process command arguments and keeps `psql` interactive even when JavaScript is supplied through a heredoc:

```bash
cd backend
node <<'NODE'
require('dotenv').config({ quiet: true });
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const uri = new URL(process.env.DATABASE_URL);
const tty = fs.openSync('/dev/tty', 'r');
const child = spawn('psql', ['-X', '-v', 'ON_ERROR_STOP=1'], {
  stdio: [tty, 'inherit', 'inherit'],
  env: {
    ...process.env,
    PGHOST: uri.hostname,
    PGPORT: uri.port || '5432',
    PGDATABASE: uri.pathname.slice(1),
    PGUSER: decodeURIComponent(uri.username),
    PGPASSWORD: decodeURIComponent(uri.password),
    PGSSLMODE: 'require',
  },
});
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
NODE
```

In `psql`, inspect the connected role (`current_database()` is usually `postgres` in **both** Supabase projects, so it does not identify the project):

```sql
SELECT current_database(), current_user, current_schema();
```

Use `\q` to exit. The older `psql` 14 client may connect to PostgreSQL 17 but can warn about unsupported features; prefer version 17 for exports.

## Inspect schema and RLS

All queries in this section are read-only. Before migration `0005`, the November 2026 baseline comprised ten application tables (`account`, `course_grades`, `course_snapshots`, `favourites`, `feedback`, `plan_instances`, `plans`, `session`, `user`, `verification`).

### Tables and policies

```sql
SELECT tablename, rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

SELECT tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

SELECT tablename, count(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename ORDER BY tablename;
```

Expected **after the initial test repair, before Calendar migration `0005`**: nine tables with RLS enabled; `course_snapshots` without RLS; 33 policies in total. **After `0005` on Supabase Test**, two Calendar tables add two RLS-enabled tables and eight policies (11 RLS tables, 41 policies in the `public` schema assuming no other changes). Supabase Production remains on the prior Calendar-free baseline. The RLS scripts protect `"user"`, `account`, `session`, `verification`, `favourites`, `feedback`, `plans`, `plan_instances`, and `course_grades`. `verification` has one deny-all policy for `authenticated`; the other eight tables have four CRUD policies each. This matches the reviewed production *policy definitions*; grants require separate inspection.

```sql
SELECT table_name, grantee,
       string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privileges
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated', 'service_role')
GROUP BY table_name, grantee
ORDER BY table_name, grantee;
```

A table having RLS enabled or a policy existing does not prove the backend query is subject to it. The policies use Supabase `authenticated`/`auth.uid()`; Better Auth does not automatically supply that identity in a direct PostgreSQL connection. Database owners and other privileged roles may bypass RLS. Check the API's ownership checks independently. Assess the Data API's exposed tables and grants separately; `course_snapshots` is currently the exception to the nine-table RLS configuration.

### Active-plan invariant

Two complementary objects protect the active-plan invariant:

- Deferred constraint trigger `plans_exactly_one_active_per_user` calls `enforce_exactly_one_active_plan()` and checks **exactly one** active plan when a user has plans.
- Partial unique index `plans_one_active_per_user` prevents **more than one** active plan per user, including conflicting concurrent writes.

```sql
SELECT tgname, pg_get_triggerdef(oid) AS definition
FROM pg_trigger
WHERE tgrelid = 'public.plans'::regclass AND NOT tgisinternal;

SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'plans'
ORDER BY indexname;

SELECT user_id, count(*) AS active_plans
FROM public.plans
WHERE is_active = true
GROUP BY user_id HAVING count(*) > 1;
```

Both objects were ultimately verified in **test** and **production**. If the index is missing in a future environment, first examine duplicate active plans, pause writes, and apply a reviewed migration; do not recreate it blindly. The repository's `0004_enforce_exactly_one_active_plan.sql` was already reflected in both databases and should not be rerun just to repair migration metadata.

## Compare environments

To compare the public schema without exporting rows, use a PostgreSQL 17 `pg_dump` with `--schema-only --schema=public --no-owner --no-privileges`. Use **separately verified** test and production connections and unique output filenames. Example when `PG*` variables already point to the intended project:

```bash
pg_dump --schema-only --schema=public \
  --no-owner --no-privileges --file=test-schema.sql
# Switch to the separately verified production connection before exporting:
pg_dump --schema-only --schema=public \
  --no-owner --no-privileges --file=production-schema.sql

diff -u test-schema.sql production-schema.sql
```

> [!WARNING]
> `pg_dump` does not read `DATABASE_URL` automatically. Confirm the `PG*` environment for **each** export; don't infer that both files came from distinct databases merely because their names differ. An invalid credential or old output file can produce a misleading comparison. Check the exit status and modification time of both files, and don't compare failed or stale dumps.

The November 2026 corrected dumps differed in the test database's missing RLS configuration (nine table flags and 33 policies) and its initially absent `plans_one_active_per_user` index. The policies were restored by the three tracked SQL scripts and the index was later verified in test. This does **not** demonstrate equivalence of ownership, grants, external schemas, or Supabase-managed objects: the dump options intentionally exclude some of those concerns.

## Migration history

The repository defines `db:generate`, `db:migrate`, and `db:push` npm scripts using `drizzle.config.cjs`. **`db:push` applies schema changes directly and is not a substitute for a complete versioned migration history.** Drizzle's database-side migration journal is normally `drizzle.__drizzle_migrations`; do not confuse it with the local JSON file `drizzle/meta/_journal.json`.

```sql
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_name = '__drizzle_migrations';

-- Run only if the table exists:
SELECT id, hash, created_at,
       to_timestamp(created_at / 1000.0) AS migration_time
FROM drizzle.__drizzle_migrations
ORDER BY created_at, id;
```

### Observed November 2026 history

| Artifact / database | Observation |
| --- | --- |
| Local `drizzle/meta/_journal.json` | `0000_daffy_salo` (timestamp `1769645984749`), `0001_illegal_the_fallen` (`1771736529154`) |
| Local snapshots | `0000_snapshot.json` has nine application tables; `0001_snapshot.json` adds `course_snapshots` |
| Version-controlled custom SQL | `drizzle/sql/0001_rls_enable.sql` through `0005_calendar_visibility_preferences.sql` |
| Generated historical `.sql` files | Missing from the inspected checkout; local snapshots and journal were also untracked |
| Production journal | One row, with `created_at = 1769645984749`, matching local `0000` |
| Test journal | `__drizzle_migrations` absent at the time of inspection |
| Deployed `course_snapshots` | Present with matching inspected definitions and indexes in both projects, despite missing recorded `0001` |

`created_at` is a migration timestamp; do not interpret it as proof of when a migration was executed. A snapshot isn't executable SQL, and an installed table is not proof that a migration was tracked. **Do not copy journal rows, invent replacement SQL hashes, recreate existing tables, or run historical migrations against either existing project.** Recover the migration sequence and test it on a disposable database before reconciling histories.

Custom SQL currently owns RLS grants/policies (`0001`–`0003`) and the deferred active-plan trigger (`0004`). These were applied independently of a confirmed shared Drizzle migration sequence. Future work should establish one reviewed, version-controlled execution path, including custom SQL, environment checks, and rollback/recovery instructions. See [Drizzle migrations](https://orm.drizzle.team/docs/drizzle-kit-migrate) and [custom migrations](https://orm.drizzle.team/docs/kit-custom-migrations).

### New database changes

Until reconciliation is complete, any new table work (including Calendar preferences) must use reviewed, version-controlled SQL, verify the target project, test on test before production, and maintain an explicit application record of what ran in each environment. Coordinate future history reconciliation so the same DDL is not replayed. Do not call an ad-hoc SQL application a successful `db:migrate` run.

## Calendar preference migration (`0005`)

`backend/drizzle/sql/0005_calendar_visibility_preferences.sql` creates `calendar_hidden_groups` and `calendar_occurrence_overrides`, their constraints, grants, and eight RLS policies. `backend/drizzle/sql/verify_0005_calendar_visibility_preferences.sql` provides read-only structural inspection. The former has been applied to **Supabase Test only**; **Supabase Production has not received `0005`**.

The application uses a SHA-256 physical occurrence-key index while retaining and checking the original serialized key. No historical generated Drizzle migration should be replayed to install this standalone SQL. #197 owns migration-history recovery.

After confirming you are connected to **Supabase Test** with the correct project reference and reviewing the file, run the following in `psql` from `backend/` **only when the migration is not yet installed**:

```sql
\set ON_ERROR_STOP on
\i drizzle/sql/0005_calendar_visibility_preferences.sql
\i drizzle/sql/verify_0005_calendar_visibility_preferences.sql
```

The migration is not written as a re-runnable `IF NOT EXISTS` script: an already-present table should trigger investigation rather than a second application. The verification script is safe to repeat. Inspect `pg_constraint`, `pg_indexes`, `pg_policies`, and `pg_tables` if the structure differs; do not attempt to repair it by blindly rerunning the migration. Record the project reference, timestamp, SQL checksum, and result in the deployment/issue log.

### Test suites

From `backend/`, Vitest loads `.env.test`. Verify `DATABASE_URL` targets Supabase Test and `CALENDAR_TEST_PROJECT_REF` matches the dashboard. Only the opt-in flags are needed on the command line:

```sh
CALENDAR_DB_TEST=yes npx vitest run tests/integration/calendarPreferences.db.test.ts --no-file-parallelism
CALENDAR_HTTP_TEST=yes npx vitest run tests/integration/calendarPreferences.http.test.ts --no-file-parallelism
```

The database test directly exercises the Drizzle service. The HTTP test creates Better Auth fixtures, starts an in-process Express server, and exercises cookie-based authorization through the Calendar routes. **Both create and remove test records and must never point to production.** See `backend/tests/integration/README.md` in the application repository for preflight and cleanup details.

> [!WARNING]
> Production migration is deferred until frontend hydration and end-to-end Calendar acceptance (#191/#192) pass, with a coordinated backend/frontend deployment. A production backend must not call these routes against a database lacking the new tables.

## RLS integration tests

The RLS suite is separate from Better Auth runtime tests. It uses Supabase's Data API and Auth, with administrative credentials for setup and cleanup and restricted authenticated clients for assertions. It **mutates** the target Supabase project and must never run against production.

```bash
cd backend
# First verify .env.test points entirely to the intended TEST Supabase project.
npm run test:rls -- --run --no-file-parallelism
```

The current `package.json` script invokes `vitest tests/rls.*.test.ts`. Without `--run` it enters watch mode. Sequential files reduce concurrency but **do not reduce total logins** if `setupRLSTest()` signs in two users before each test.

In November 2026, the test suite contained 7 files and 45 tests. The production project passed 45/45 during an investigation run, but **running these tests on production is not safe operational practice and must not be repeated**. The test project passed 30/45 before HTTP 429 auth rate limiting interrupted later setup calls. The observed project sign-up/sign-in limits were 30 requests/5 minutes (test) and 60 requests/5 minutes (production), per IP. Worker-count changes alone did not solve this. These are historical diagnostic results, not permanent assertions about service configuration.

> [!WARNING]
> The harness was observed to use a legacy administrative `SERVICE_ROLE_KEY`. Replace it with a project secret (`sb_secret_...`) through a separately tested migration before Supabase retires legacy keys. As of Supabase's October 29, 2026 guidance, legacy `anon` and `service_role` keys are planned for deprecation by the end of 2026. Do not expose either key to the browser or Git. See [Supabase API key migration](https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys).

### Troubleshooting

| Symptom | Likely cause / next check |
| --- | --- |
| `password authentication failed` | Wrong `DATABASE_URL`, stale shell `PG*` variables, or credentials for a different project; inspect *redacted* host/project ref |
| `psql` opens then immediately exits from `node <<'NODE'` | Heredoc consumed stdin; use the interactive `/dev/tty` wrapper above rather than inheriting Node's EOF |
| `pg_dump` rejects server version | Old client; use PostgreSQL 17 client for PostgreSQL 17 server |
| `pg_dump` outputs appear unexpectedly identical | Ensure each export succeeded and came from the intended project; inspect exit codes, timestamps, and sanitized endpoint |
| `Could not query the database for the schema cache` | In the 2026 incident, stale `SUPABASE_URL` and API keys in `.env.test`; verify those **before** changing PostgREST schema settings |
| `PGRST205` table missing from schema cache | Verify Data API's exposed schema/table and service role grants (separate from RLS policies) |
| HTTP `429 over_request_rate_limit` | Supabase Auth sign-in requests; compare **Authentication → Rate Limits**, reduce repeated sign-ins, and use an isolated test project |
| `teardownRLSTest` receives undefined `context` | Setup failed first; teardown must guard incomplete initialization and safely clean up partially created users |
| Tests pass against one Supabase project only | Check URLs, project refs, rate limits, key provenance, and whether `.env.test` overrides or inherits shell environment |
| RLS enabled but backend reads unrestricted rows | Inspect DB role and authorization: direct Better Auth/Drizzle queries do not automatically use `auth.uid()`; privileged roles can bypass RLS |
| `db:migrate` encounters existing objects or missing migration files | Stop: migration metadata is incomplete. Do not bypass errors with journal edits or `db:push` on shared projects |

## Related documentation

- [Environment Variables](../env/) — Backend and test-only secrets.
- [Local Development](../running-locally/) — Start the services.
- [Row-Level Security](../../securities/row-level-security-testing/) — Security model and test design.
- [Route Protection](../../securities/route-protection/) — Better Auth authorization boundaries.
- [Calendar Schema](../../architecture/calendar-visibility-schema/) — Implemented backend preference tables, currently deployed to Supabase Test only.
- [Calendar Preference API](../calendar-preference-api/) — Endpoint contract and integration-test workflow.
