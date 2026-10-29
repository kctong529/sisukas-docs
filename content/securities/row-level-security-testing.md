---
weight: 3
title: "Row-Level Security"
description: "How database row-level security works, what it protects, and how Sisukas tests user isolation."
---

# Row-Level Security (RLS)

## What is RLS?

Row-Level Security (RLS) is a PostgreSQL feature that controls which rows a database role may read or modify. Unlike ordinary table permissions, which grant access to an entire table, RLS allows the database to enforce policies for individual rows.

For example, two users may both be allowed to read the `plans` table, but a policy can restrict each user to their own plans:

| Request | Expected result |
| --- | --- |
| User A reads User A's plan | Allowed |
| User A reads User B's plan | Blocked by the policy |
| User B updates User A's plan | Blocked by the policy |

RLS is not automatic ownership protection. The database administrator must enable it on a table, define the appropriate policies, and ensure application queries use a database role and authenticated identity to which those policies apply. Incorrect policies, privileged database roles, or bypass mechanisms can undermine the protection.

## How does it work?

RLS policies specify which rows are visible or writable for operations such as `SELECT`, `INSERT`, `UPDATE`, and `DELETE`.

Two important clauses are:

- **`USING`** — controls which existing rows a role can see or target.
- **`WITH CHECK`** — controls which new or updated rows a role may create.

An *illustrative* policy for a table with an `owner_id` column might be:

```sql
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY plans_owner_select ON plans
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());
```

Here, `authenticated` and `auth.uid()` are Supabase-specific conventions, not built-in PostgreSQL mechanisms. The example illustrates the principle used by the existing Supabase-oriented tests; it is not a copy-paste policy for the current Sisukas backend. A PostgreSQL application without Supabase must provide identity and database-role context through an appropriate, securely configured mechanism.

For a complete owner-only design, policies must also cover writes and the relevant operations. The example above only controls reads.

## Why have RLS as well as API route protection?

Sisukas also checks authentication and authorization at its API routes. The two controls operate at different boundaries:

| Layer | Responsibility |
| --- | --- |
| API route protection | Authenticates the caller and checks whether a request is permitted. |
| Database RLS | Restricts which rows the database allows a querying role to access. |

When both are configured for the same identity model, database policies provide *defense in depth*: a missing authorization check in a route need not automatically expose another user's rows. **RLS is not a substitute for route authorization**, and route-level checks do not prove that RLS is active.

See [Security Overview](../) and [Route Protection](../route-protection/) for the broader security model.

## RLS tests in the repository

The repository contains a Supabase-based RLS test harness in `backend/tests/`. It creates two test users, signs them in, and checks whether one user's session can access another user's records. Both **positive cases** (owners can access their data) and **negative cases** (other users cannot) matter.

The current backend uses PostgreSQL, Drizzle, and Better Auth, whereas this test harness still uses `@supabase/supabase-js`, Supabase Auth sessions, and the `auth.uid()` identity convention. Consequently, the presence of these tests alone does not establish that the currently deployed backend has equivalent RLS policies or that they are being enforced. That requires separate verification of deployed database roles, policies, and query context.

### Running the existing tests

The harness expects an isolated Supabase test environment. Configure the following variables for the test process (never commit credentials):

```dotenv
SUPABASE_URL=https://your-test-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_test_publishable_key
SERVICE_ROLE_KEY=your_test_service_role_key
```

From `backend/`:

```bash
npm ci
npm run test:rls
```

The script is defined in `backend/package.json` and invokes the `tests/rls.*.test.ts` suites. The test setup reads variables from the process environment; merely creating `.env.test` does not guarantee it will be loaded. Ensure your chosen test runner configuration loads these variables.

**Use only a disposable test environment.** The harness creates and removes authentication users and database rows. Service-role credentials are privileged and must not be exposed to browsers, logs, or source control.

### What is tested?

The checked-in suites cover these areas:

| Suite | Isolation being tested |
| --- | --- |
| `rls.user.test.ts` | User profiles |
| `rls.plan.test.ts` | Study plans |
| `rls.session.test.ts` | Sessions |
| `rls.account.test.ts` | Linked accounts |
| `rls.favourites.test.ts` | Favourite courses |
| `rls.feedback.test.ts` | Feedback |
| `rls.course_grades.test.ts` | Course grades |

Core helpers include `tests/rls.setup.ts`, `tests/rls.session-helper.ts`, and `tests/rls.test-helpers.ts`. Do not rely on fixed passing-test counts, which change as the suite evolves.

### Understanding the test pattern

A typical isolation test follows four steps:

1. Create User A and User B with independent identities.
2. Create a record owned by User A.
3. Query the record using User B's non-privileged session.
4. Assert that User B cannot read or modify it; also verify that User A can.

The negative assertion only demonstrates RLS protection if the query actually runs under the intended restricted role and identity. An administrative or service-role query can bypass policies and is therefore unsuitable for proving user isolation.

## Troubleshooting and limitations

| Symptom | What to check |
| --- | --- |
| Test environment fails to initialize | Supabase URL, keys, expected schema, and how environment variables are loaded |
| Other users' rows are visible | Whether RLS is enabled, policy predicates are correct, and the query uses a restricted role |
| Owners cannot read their own rows | Identity context, row ownership fields, and policy coverage for the operation |
| Tests pass but the application may be unprotected | Whether the production database actually uses the same policies, roles, and identity propagation |

The current harness is a useful historical set of isolation tests, not proof of current production policy coverage. Any migration or redesign should validate the database's actual privilege boundaries as well as the route-level authorization tests.

## Further reading

- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Vitest](https://vitest.dev/)
