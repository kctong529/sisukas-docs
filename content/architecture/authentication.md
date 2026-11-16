---
weight: 8
title: "Authentication Architecture"
description: "Canonical user identity, authentication boundaries, sessions, providers, and their relationship to application data."
---

> [!NOTE]
> **Status — 16 November 2026.** Email magic links, explicit linking policy (#215), Google sign-in on Test (#216), callback error recovery (#222), and Account settings with authenticated Connect Google (#217) are implemented. Deployed Test checks confirmed matching canonical `user.id` across linking and both sign-in methods, including Google-created accounts using a magic link. **Google remains disabled in Production**; GitHub OAuth and broader release/rollback acceptance (#218) remain separate.

## Why identity is independent of sign-in method

A Sisukas user is uniquely identified by **`user.id`**, not by email address, a provider account ID, or a browser cookie. An authenticated session resolves to that ID. Study plans, favourites, and grades are associated with it; Calendar preferences are owned indirectly through the user's plans.

A person may first authenticate by email magic link and subsequently **explicitly link** an external provider. The additional account association points to the *existing* `user.id`, so there is no second Sisukas user and no data migration. A separate, unlinked registration can create a different user; Sisukas does not merge identities simply because email addresses happen to match. See [Authentication Data Model](../authentication-data-model/).

![Authentication system and trust boundaries](/images/architecture/auth/system-architecture.svg)

## Runtime boundaries

| Boundary | Responsibility | Deliberately excluded |
| --- | --- | --- |
| Svelte `modules/auth` | Public sign-in/sign-out, connected-provider discovery, explicit linking, callback verification and session/identity adapters; internal Better Auth browser client | Loading plans or Calendar data |
| `src/app/auth/` | Guest-to-authenticated lifecycle, account-scoped loading and state reset | Provider ownership and OAuth authorization policy |
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
│   ├── accountLinkCallback.ts
│   ├── connectedMethods.ts
│   ├── google.ts
│   ├── identity.ts
│   ├── linkGoogle.ts
│   ├── magicLink.ts
│   ├── oauthCallbackError.ts
│   └── session.ts
├── config/
│   └── availableMethods.ts
└── infrastructure/
    └── authClient.ts
```

The backend retains `src/middleware/auth.ts` for Express middleware **and a separate admin-token mechanism**; the frontend retains `src/app/auth/` for application data lifecycle. These components are not interchangeable and were deliberately not collapsed into the authentication capability. The older `backend/src/lib/auth.ts`, `backend/src/lib/accountLinkingPolicy.ts`, and `frontend/course-browser/src/lib/authClient.ts` compatibility exports were removed in the #215 boundary refactor. Tests prevent consumers from importing internal authentication infrastructure directly.

## Implemented authentication and linking paths

**Email magic link.** Better Auth sends a link via Resend and establishes a session for the existing or newly registered `user.id`. Magic-link users can have no OAuth `account` rows.

**Google sign-in on Test (#216).** The feature-gated provider supports new verified Google identities and repeat sign-in. An existing, *unlinked* magic-link account cannot be silently linked merely because its email matches; the rejected callback returns to the frontend with `account_not_linked` and actionable magic-link guidance (#222). Unknown errors have a safe fallback and callback error parameters are removed from the URL.

**Account settings and explicit Google linking (#217).** The authenticated dialog displays the current account email, magic-link availability, and Google connection state using Better Auth `listAccounts()`. It does not expose provider credentials. **Connect Google** calls authenticated `linkSocial()`, not `signIn.social()`, with an explicit callback. Account selection is requested using `additionalParams: { prompt: "select_account" }`, allowing users to retry with a different Google identity after an email mismatch. The same-email restriction is enforced by the backend.

**Callback verification.** A short-lived `sessionStorage` marker records the original `user.id` and creation time (15-minute validity). On return, the frontend checks that the session still identifies the original user **and** Better Auth reports a Google association before displaying success. The marker is a browser consistency check, not authorization or OAuth state security; Better Auth enforces the authenticated linking operation and provider state. Invalid, expired and mismatched returns do not produce success feedback. Failures are announced as alerts, successes as status messages.

**Deployed Test evidence (16 November 2026).** An existing magic-link identity was explicitly linked to a matching Google account, then reauthenticated using Google and magic links with the **same canonical `user.id` and saved application data**. The reverse direction, Google-created account followed by magic-link sign-in, was also confirmed at `user.id` level. A different-email attempt was rejected without changing the original identity or data, and retrying with the matching Google account worked using the chooser. Backend controlled-provider conflict/cancellation/expiry coverage complements the deployed browser checks; it is not equivalent to having manually exercised every provider cancellation UI path.

**Feature configuration.** Backend `GOOGLE_OAUTH_ENABLED`, `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` control provider availability; frontend build-time `VITE_GOOGLE_OAUTH_ENABLED` controls visibility. Credentials remain backend-only. Test's authorized callback is `https://api.test.sisukas.eu/api/auth/callback/google`. Production remains disabled pending #218 and the Production migration gate.

**Scope boundary.** Provider unlinking is not exposed because last-usable-method recovery is not proven. Cross-email linking, GitHub OAuth and extended profile/session management are future work. The broader automated browser acceptance matrix, monitoring, rollback and Production rollout remain #218.

## Related documentation

- [Authentication Data Model](../authentication-data-model/) — tables, keys and ownership.
- [Account Linking](../../securities/account-linking/) — policy, failure paths and security invariants.
- [Authentication Testing](../../dev-guide/authentication-testing/) — reproducible verification and Test-only safeguards.
- [Frontend Organization](../frontend-organization/) — capability-oriented ownership conventions.
