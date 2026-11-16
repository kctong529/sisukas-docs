---
weight: 9
title: "Authentication Data Model"
description: "Canonical identity and provider-account mapping, sessions, verification state and domain ownership."
---

> [!NOTE]
> The diagrams show **logical relationships**, not necessarily every table column. The exact schema should be checked against the active Better Auth/Drizzle implementation before changing migrations.

## Identity records

![Authentication ER model](/images/architecture/auth/data-model.svg)

| Record | Identity and relation | Purpose |
| --- | --- | --- |
| `user` | `id` is the canonical Sisukas user key | Stable application identity; email is not its substitute |
| `account` | `user_id → user.id`; external identity is `(provider_id, account_id)` | Associates a provider identity with an existing user; may store provider tokens |
| `session` | `user_id → user.id`, unique session token | Distinct login sessions for one user across browsers/devices |
| `verification` | Transient identifier/value and expiry | Temporary email verification and OAuth-related state, not durable ownership |

A user may have **zero or more** `account` rows and **zero or more** sessions. Email magic-link users may have **no** `account` rows at all. Do not infer available sign-in methods solely from the count of linked accounts.

> [!NOTE]
> **Verified on Test (16 November 2026, #217):** both magic-link → explicit Google linking → Google sign-in and Google-created account → magic-link sign-in resolve to the same canonical `user.id`, retaining existing application data. Magic-link sign-in does **not** imply a separate provider `account` row. The Google association is created only by explicit linking (or initial Google registration); matching emails do not silently merge users.

`account.id` is the internal row key. `account.account_id` is the external provider's subject/identity identifier; the two fields have different meanings. `session.id` and session tokens are independent of the canonical user key.

## Provider-identity uniqueness

Migration `backend/drizzle/sql/0006_account_provider_identity_unique.sql` introduces the database unique index `account_provider_identity_unique` on `(provider_id, account_id)`. The index prevents a particular external identity from being assigned to two Sisukas users, including under concurrent requests. The separate `account_userId_idx` supports lookup by internal user.

The `0006` migration is verified on **Supabase Test**, not confirmed applied to Production. Do not run it through `drizzle-kit push` while migration-history reconciliation [#197](https://github.com/kctong529/sisukas/issues/197) is unresolved. See [Release Procedure](../../dev-guide/release-procedure/).

## Ownership does not change during linking

Application ownership follows these logical relationships:

```text
user.id ──> plans.user_id
        ├─> favourites.user_id
        ├─> course_grades.user_id
        └─> session.user_id

plans.id ──> calendar_hidden_groups.plan_id
         └─> calendar_occurrence_overrides.plan_id

account.user_id ──> user.id   (authentication association only)
```

Explicit linking inserts/associates an `account` with the **existing** user. It does not re-key plans or copy preferences. Independent accounts are **not** merged based on matching email. In the Test linking acceptance flow, the original `user.id`, account creation timestamp and saved data remained unchanged across subsequent Google and magic-link sessions. Current policy requires the linked Google email to match the Sisukas account email; the separate user-profile email is not automatically replaced by provider data (`updateUserInfoOnLink: false`).

For the wider Calendar ownership and schema constraints, see [Calendar Schema](../calendar-visibility-schema/) and [Calendar Visibility](../calendar-visibility-preferences/).
