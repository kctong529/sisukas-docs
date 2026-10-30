---
weight: 8
title: "Security"
description: "Authentication, route authorization, database access, and the role of RLS tests in Sisukas."
---
> [!NOTE]
> This overview describes the **current** session and authorization boundaries. The [RLS guide](./row-level-security-testing/) explains PostgreSQL RLS and the separate Supabase-based test setup.

Security in Sisukas is enforced at several boundaries. An authenticated session identifies a user; route and resource checks determine what that user may do; and database credentials determine which data the server can access. These mechanisms should not be conflated with the older Supabase-based RLS test environment.

## In this section: current runtime controls

| Boundary | Implementation | Responsibility |
| --- | --- | --- |
| User session | Better Auth, configured in `backend/src/lib/auth.ts` | Establish caller identity |
| Protected API request | `extractSession`, `requireAuth`, and resource checks | Reject unauthenticated or unauthorized requests |
| Admin access | Separate expiring token sessions, `requireAdmin` | Protect designated administrative endpoints |
| Database persistence | PostgreSQL accessed through Drizzle | Persist user records and runtime snapshots |

Authentication alone does not prove resource ownership. For example, `GET /api/users/:id` compares the requested ID with `res.locals.user.id` and returns `403` for another user's profile. See [Route Protection](./route-protection/) for the code paths and examples.

> [!IMPORTANT]
> Authentication identifies a caller; it does not by itself authorize access to another user’s records. Each relevant route still needs ownership or permission checks.

## Where RLS fits

**Row-Level Security (RLS)** is a PostgreSQL mechanism for restricting accessible rows through database policies. It can provide a useful additional boundary, but only when enabled and enforced for the roles and identity context used by an application.

The repository contains a Supabase-based RLS test suite in `backend/tests/`. Its use of Supabase Auth and `auth.uid()` is distinct from the current Better Auth/Drizzle runtime. These tests illustrate and check the Supabase policy model; they do **not**, by themselves, verify deployed RLS protection for the current backend. See [Row-Level Security](./row-level-security-testing/) for the concept, policy examples, and test instructions.

## Defense in depth

Independent controls reduce the consequences of individual mistakes when they are correctly implemented and applied. They are not interchangeable: a successful session check does not grant permission to every resource, and an RLS policy is not automatically active simply because the database is PostgreSQL.

A useful security review asks whether a route authenticates the request, checks ownership or permissions, uses appropriate database credentials, and tests unauthorized access. This is more reliable than assuming any single middleware or database feature protects the entire system.

## Related documentation

- [Route Authentication and Authorization](./route-protection/) — User sessions, admin tokens, and ownership checks.
- [Row-Level Security](./row-level-security-testing/) — PostgreSQL policies and existing tests.
- [System Overview](../system-overview/) — System responsibilities.
