---
weight: 8
title: "Authentication Architecture"
description: "Canonical user identity, authentication boundaries, sessions, providers, and their relationship to application data."
---

> [!NOTE]
> **Implementation status — 16 November 2026 (#215).** Magic-link sign-in and the explicit linking policy are implemented. Real Better Auth OAuth callback behavior has been exercised with a **controlled test provider**, but Google (#216), GitHub, and connected-method UI (#217) are **not yet enabled**. The refactored authentication modules have passed local regression tests; deployment to Test is pending in this record.

## Why identity is independent of sign-in method

A Sisukas user is uniquely identified by **`user.id`**, not by email address, a provider account ID, or a browser cookie. An authenticated session resolves to that ID. Study plans, favourites, and grades are associated with it; Calendar preferences are owned indirectly through the user's plans.

A person may first authenticate by email magic link and subsequently **explicitly link** an external provider. The additional account association points to the *existing* `user.id`, so there is no second Sisukas user and no data migration. A separate, unlinked registration can create a different user; Sisukas does not merge identities simply because email addresses happen to match. See [Authentication Data Model](../authentication-data-model/).

![Authentication system and trust boundaries](/images/architecture/auth/system-architecture.svg)

## Runtime boundaries

| Boundary | Responsibility | Deliberately excluded |
| --- | --- | --- |
| Svelte `modules/auth` | Public sign-in/sign-out, session and identity adapters; internal Better Auth browser client | Loading plans or Calendar data |
| `src/app/auth/` | Guest-to-authenticated lifecycle, account-scoped loading and state reset | Provider identity and OAuth callbacks |
| Express `modules/auth` | Better Auth construction, magic-link delivery, session resolution, HTTP handler, linking policy | Per-route authorization of plans and other domain resources |
| Express middleware and routes | Session extraction, `requireAuth`, ownership/permission checks | Choosing a login provider |
| PostgreSQL | Identity, session and provider-account persistence; indexes and foreign keys | Automatic proof of user authorization merely because RLS policies exist |

**Authentication identifies the caller; authorization decides whether the caller may access a particular resource.** Application routes must check ownership using the resolved user identity. The historical Supabase-oriented RLS suite tests specific database roles and claims; it does not demonstrate that ordinary Better Auth/Drizzle queries execute under those claims. See [Route Authorization](../../securities/route-protection/) and [Row-Level Security](../../securities/row-level-security-testing/).

## Implemented module structure

![Implemented frontend and backend authentication module boundaries](/images/architecture/auth/module-boundaries.svg)

```text
backend/src/modules/auth/
├── index.ts                           # Public entry point
├── application/
│   ├── createEmailPasswordUser.ts
│   └── resolveAuthenticatedSession.ts
├── config/
│   ├── accountLinkingPolicy.ts
│   └── trustedOrigins.ts
├── domain/
│   └── AuthenticatedIdentity.ts
└── infrastructure/
    ├── authHttpHandler.ts
    ├── betterAuth.ts
    └── sendMagicLink.ts

frontend/course-browser/src/modules/auth/
├── index.ts                           # Public entry point
├── application/
│   ├── identity.ts
│   ├── magicLink.ts
│   └── session.ts
└── infrastructure/
    └── authClient.ts
```

The backend retains `src/middleware/auth.ts` for Express middleware **and a separate admin-token mechanism**; the frontend retains `src/app/auth/` for application data lifecycle. These components are not interchangeable and were deliberately not collapsed into the authentication capability. The older `backend/src/lib/auth.ts`, `backend/src/lib/accountLinkingPolicy.ts`, and `frontend/course-browser/src/lib/authClient.ts` compatibility exports were removed in the #215 boundary refactor. Tests prevent consumers from importing internal authentication infrastructure directly.

## Current and future authentication paths

**Implemented:** an email magic link is sent using Resend; Better Auth verifies it and establishes a session for `user.id`. A magic-link user need not have an `account` row.

**Verified with controlled OAuth provider:** an existing linked identity resolves to its established user; explicit linking adds a provider identity to the signed-in user; rejected linking scenarios cannot reassign another user's provider identity.

**Planned:** enabling Google OAuth (#216), the connected-methods user interface (#217), and rollout acceptance (#218). A provider addition should extend Better Auth configuration and public method actions without changing how application features identify a user.

## Related documentation

- [Authentication Data Model](./authentication-data-model/) — tables, keys and ownership.
- [Account Linking](../../securities/account-linking/) — policy, failure paths and security invariants.
- [Authentication Testing](../../dev-guide/authentication-testing/) — reproducible verification and Test-only safeguards.
- [Frontend Organization](../frontend-organization/) — capability-oriented ownership conventions.
