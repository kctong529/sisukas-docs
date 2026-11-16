---
weight: 8
title: "Authentication Architecture"
description: "Canonical user identity, authentication boundaries, sessions, providers, and their relationship to application data."
---

> [!NOTE]
> **Implementation status — 16 November 2026.** Email magic links and the #215 explicit-linking policy are implemented. Feature-gated Google sign-in (#216, PR #221) has been deployed and manually verified on **Test** for new users, repeated sign-in and session/data persistence. Google remains disabled in Production; GitHub and the connected-methods UI (#217) are not implemented. Error recovery (#222) and full identity/Production acceptance (#218) remain pending.

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
│   ├── socialProviders.ts
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
│   ├── google.ts
│   ├── identity.ts
│   ├── magicLink.ts
│   └── session.ts
├── config/
│   └── availableMethods.ts
└── infrastructure/
    └── authClient.ts
```

The backend retains `src/middleware/auth.ts` for Express middleware **and a separate admin-token mechanism**; the frontend retains `src/app/auth/` for application data lifecycle. These components are not interchangeable and were deliberately not collapsed into the authentication capability. The older `backend/src/lib/auth.ts`, `backend/src/lib/accountLinkingPolicy.ts`, and `frontend/course-browser/src/lib/authClient.ts` compatibility exports were removed in the #215 boundary refactor. Tests prevent consumers from importing internal authentication infrastructure directly.

## Current and future authentication paths

**Implemented:** an email magic link is sent using Resend; Better Auth verifies it and establishes a session for `user.id`. A magic-link user need not have an `account` row.

**Verified with controlled OAuth provider (#215):** an existing linked identity resolves to its established user; explicit linking adds a provider identity to the signed-in user; rejected linking scenarios cannot reassign another user's provider identity.

**Deployed on Test (#216):** Google OAuth registers a new identity, returns an authenticated session, and preserves application data on repeat sign-in. A Google-created user can subsequently use a magic link to access the same observed data. Attempting unlinked Google sign-in with an existing magic-link email returns `account_not_linked`, but currently redirects to the backend root without useful recovery (#222). The same-`user.id` property still requires explicit deployed verification (#218).

**Feature configuration:** backend `GOOGLE_OAUTH_ENABLED` with `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` controls Better Auth provider registration; the frontend build flag `VITE_GOOGLE_OAUTH_ENABLED` controls whether the Google action is shown. Client credentials must remain backend-only. Test uses `https://api.test.sisukas.eu/api/auth/callback/google` as the authorized callback. Production remains disabled.

**Remaining:** connected-method UI and authenticated Connect Google (#217), OAuth error recovery (#222), and complete acceptance/Production readiness (#218). GitHub OAuth remains separate under #37. A provider addition does not change how application features identify users.

## Related documentation

- [Authentication Data Model](./authentication-data-model/) — tables, keys and ownership.
- [Account Linking](../../securities/account-linking/) — policy, failure paths and security invariants.
- [Authentication Testing](../../dev-guide/authentication-testing/) — reproducible verification and Test-only safeguards.
- [Frontend Organization](../frontend-organization/) — capability-oriented ownership conventions.
