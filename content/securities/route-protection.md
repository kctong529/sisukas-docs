---
weight: 2
title: "Route Authentication and Authorization"
description: "How Better Auth sessions, route authorization, and separate admin tokens protect the current Express backend."
---
> [!NOTE]
> This guide covers Express route authentication and authorization in the current backend. User sessions and administrative token checks have different responsibilities.

## User authentication and authorization

The Better Auth configuration lives in `backend/src/lib/auth.ts`. `extractSession` calls `auth.api.getSession` using incoming request headers and stores the session and user in `res.locals`. `requireAuth` returns `401 Unauthorized` if no authenticated user was found.

Authentication establishes identity; individual handlers still need to enforce ownership. For example, `GET /api/users/:id` and `DELETE /api/users/:id` check that the URL ID matches `res.locals.user.id` and return `403 Forbidden` on a mismatch.

The server mounts `extractSession` for `/api/users`, then again for later user-scoped routes. Route-specific protection should always be inspected rather than inferred from the presence of global middleware.

## Admin tokens are separate

The admin mechanism in `backend/src/middleware/auth.ts` is independent of Better Auth sessions:

1. `POST /api/admin/login` checks `ADMIN_USERNAME` and `ADMIN_PASSWORD` and creates an in-memory token.
2. Tokens expire after one hour and are lost when the process restarts.
3. `requireAdmin` looks for a bearer token, then `admin_token` cookie, then `admin_token` query parameter.
4. `GET /api/admin/logout` invalidates the token and clears its cookie.

The login route also provides an HTML form at `GET /api/admin/login`. The cookie is HTTP-only, `sameSite: 'strict'`, and secure in production; the API response also returns a token to the caller.

**Security consideration:** Passing administrator tokens through URLs increases the risk of exposure through history, logs, or copied links. Although currently supported by `requireAdmin`, query-string authentication is not a recommended pattern for new routes. The token generator and token logging should also be reviewed before treating the admin scheme as hardened production security.

## Representative routes

| Route | Requirement | Ownership / behavior |
| --- | --- | --- |
| `GET /api/users` | `requireAdmin` | Lists all users |
| `GET /api/users/:id` | `requireAuth` | Caller may only view their own profile |
| `POST /api/users` | Public route | Uses user service for registration |
| `DELETE /api/users/:id` | `requireAuth` | Caller may only delete their own account |
| `GET /api/admin/login` | Public route | Serves administrator login form |
| `POST /api/admin/login` | Public route | Checks admin credentials and issues token |
| `GET /api/admin/logout` | `requireAdmin` | Revokes an admin token |

The table describes the checked-in route definitions, not an exhaustive inventory of the backend API. Registration also exists through Better Auth integration; do not assume the custom user route is the only account-creation flow.

## Testing the boundaries

When changing protected routes, test at least an unauthenticated request, a correctly authenticated owner, and an authenticated user requesting someone else's resource. For admin routes, also test missing, expired, and revoked tokens.

With a running local backend and a valid administrator token:

```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3000/api/users
```

The actual listening port should match your local environment configuration. Better Auth browser sessions are normally conveyed by session cookies; an arbitrary bearer string is **not** a substitute for a valid user session.

## Relationship to database security

Route checks enforce application permissions. Database RLS can supplement these checks in deployments where relevant policies are configured and used by the querying role. The existing [RLS testing guide](../row-level-security-testing/) explains that mechanism and the limits of the Supabase-oriented tests; it does not establish that current production queries use the same policy context.

## Related documentation

- [Security](../) — How the security boundaries fit together.
- [Row-Level Security](../row-level-security-testing/) — Database policy concepts and the test harness.
- [System Overview](../../system-overview/) — Backend responsibilities.
