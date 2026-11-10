---
weight: 5
title: "Calendar Visibility Persistence Schema Proposal"
description: "Proposed sparse PostgreSQL tables, constraints, lifecycle rules, and design alternatives for #189/#190."
---

> [!WARNING]
> **Proposal, not a migration.** The supplied materials establish Calendar and upstream identity contracts but do not contain a checked backend Drizzle schema. The SQL below is *illustrative PostgreSQL DDL*, not guaranteed to match actual Plan primary-key types, table names, foreign-key ownership, or migration conventions. Confirm those in `backend/` during #190 before translating to Drizzle and generating migrations.

## Design objectives

Store user-specific **Calendar visibility** without copying SISU teaching groups or expanded events into the Sisukas backend. Preserve #92's group-level hidden state and occurrence-level hidden/explicit-visible overrides, scoped to a Sisukas plan. Keep an empty preference collection representable, and make resetting to inherited visibility simple and idempotent.

### Why two sparse tables?

| Alternative | Benefits | Trade-offs | Decision |
| --- | --- | --- | --- |
| One JSONB preferences document per plan | Single read/write, flexible schema | Concurrent edits require whole-document merge or optimistic version; difficult per-override constraints and deletes | Not selected for initial contract |
| One generic `target_kind` + `target_id` table | Fewer tables | Polymorphic constraints; nullable identifiers; harder uniqueness and correctness checks | Not selected |
| **Hidden groups + explicit occurrence overrides** | Natural keys, strong uniqueness, sparse writes, independent updates, explicit `visible` value | Two tables, likely one read transaction/query pair | **Preferred** |
| Full canonical event table with FK preferences | Referential integrity to events | Requires synchronizing SISU canonical data the backend does not currently own | Explicitly rejected |

The table split is about **different semantics**, not future attendance preferences. Do not add `attendance` or a general-purpose user-event entity for #189.

## Logical relational schema

```text
existing Plan (id, owner relationship, ...)
    │
    ├── calendar_hidden_groups
    │     PK (plan_id, course_offering_id, study_group_id)
    │     FK plan_id → existing Plan.id, cascade on plan delete
    │
    └── calendar_occurrence_overrides
          PK (plan_id, course_offering_id, study_group_id, occurrence_key)
          FK plan_id → existing Plan.id, cascade on plan delete
          visibility ∈ {hidden, visible}
```

No SQL foreign key is possible to `course_offering_id`, `study_group_id`, or `occurrence_key`: these are external SISU/derived references, not backend-owned canonical rows. That is intentional and does not imply ignoring referential checks on **plan ownership**.

### Illustrative DDL

The `uuid` plan ID below is a **placeholder assumption**. Substitute the exact existing Plan PK type and identifier spelling. If the Plan table has a different primary key, no cast or shadow UUID should be introduced merely for these preferences.

```sql
-- DESIGN SKETCH ONLY; do not execute as-is.
CREATE TABLE calendar_hidden_groups (
    plan_id uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    course_offering_id text NOT NULL,
    study_group_id text NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (plan_id, course_offering_id, study_group_id),
    CHECK (length(course_offering_id) > 0),
    CHECK (length(study_group_id) > 0)
);

CREATE TABLE calendar_occurrence_overrides (
    plan_id uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    course_offering_id text NOT NULL,
    study_group_id text NOT NULL,
    occurrence_key text NOT NULL,
    visibility text NOT NULL
        CHECK (visibility IN ('hidden', 'visible')),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (
        plan_id, course_offering_id, study_group_id, occurrence_key
    ),
    CHECK (length(course_offering_id) > 0),
    CHECK (length(study_group_id) > 0),
    CHECK (length(occurrence_key) > 0)
);
```

**SQL index caution:** PostgreSQL composite B-tree indexes over multiple unconstrained `text` fields have practical index-entry size limits. Before deploying, inspect realistic and worst-case occurrence-key lengths, define API length bounds, and consider a verified deterministic digest plus collision-safe raw-key comparison **only if needed**. Do not invent a lossy truncated key that could redirect visibility to another event.

### Column and constraint rationale

| Column/constraint | Reason |
| --- | --- |
| `plan_id` (FK) | Plan-specific choices; enforce deletion and authorization through the existing plan model |
| `course_offering_id` | Distinguishes the same group ID if reused across offerings; matches active-plan `instanceIds` |
| `study_group_id` | Distinguishes groups, including those with the same display name or type |
| `occurrence_key` | References a currently known derived occurrence without storing its canonical body |
| `visibility` occurrence enum/check | Allows explicit `visible` to override a hidden group; absence represents inherit |
| No group `visibility` column | The only nondefault group preference is hidden; presence of row already means hidden |
| Composite primary keys | Prevent duplicate per-target preference rows; enable idempotent upsert/delete |
| `updated_at` | Diagnoses modifications and supports future reconciliation; not a complete conflict-resolution protocol |
| No duplicate `user_id` | Owner is already derived from Plan; avoid redundant IDs that could disagree. Add only if real schema/RLS requires it and enforce consistency |
| No canonical event FK | Backend does not store guaranteed current SISU occurrences; FK would create false ownership and synchronization overhead |

### Database mutation semantics

- Hide group → `INSERT ... ON CONFLICT ... DO UPDATE SET updated_at = now()` (or `DO NOTHING` if timestamp freshness is not important).
- Restore group → `DELETE` by the exact plan/offering/group tuple; deleting a nonexistent row is successful/idempotent.
- Set occurrence override → `INSERT ... ON CONFLICT (...) DO UPDATE SET visibility = EXCLUDED.visibility, updated_at = now()`.
- Reset occurrence → `DELETE` by exact compound key; deleting a missing row is successful/idempotent.
- Read preferences → query both tables filtered by a **server-authorized** plan ID. An empty pair of successful result sets means **confirmed-empty**, not loading.
- Never delete an occurrence override automatically just because the current upstream projection cannot resolve it.

Consider an atomic read transaction or a single consistent server response combining both record sets if concurrent writes could otherwise produce a torn view. A basic beta implementation can define read semantics explicitly and ensure frontend readiness only after **both** collections arrive.

## Ownership, isolation, and security

1. Authenticate using the backend's established session mechanism.
2. Resolve requested plan ownership **on the server** before any read, upsert, or delete. Do not accept a caller-chosen `user_id` as proof of ownership.
3. Use the same existing user/Plan authorization and deletion conventions as other plan-scoped endpoints; scope every mutation by the authorized plan ID.
4. Ensure a foreign plan returns the existing backend's established unauthorized/not-found behavior rather than exposing another user's preference details.
5. Clear or replace frontend preference state across sign-out, account changes, and plan switches; account-specific local replicas (if introduced) must be partitioned and invalidated independently.
6. Parameterize SQL/Drizzle queries; reject oversized identifiers and malformed values rather than normalizing them silently.

The schema does **not** independently prove that a SISU group or occurrence exists. That validation is context-dependent and belongs to the current Calendar projection. The server guarantees plan authorization and valid persisted reference shape, not live upstream identity.

## Serialization and API shape (contract to finalize in #190)

Possible server response for `GET /plans/:id/calendar-visibility`:

```json
{
  "groups": [
    {"courseOfferingId": "offering-A", "studyGroupId": "H1"}
  ],
  "occurrences": [
    {"courseOfferingId": "offering-A", "studyGroupId": "H1", "occurrenceKey": "<opaque-key>", "visibility": "visible"}
  ]
}
```

The endpoint path is illustrative. The authenticated backend should establish successful *empty* retrieval through a 2xx response containing two empty arrays. Errors should not be converted into empty arrays. The frontend maintains readiness (`unknown`, `loading`, `ready`, `error`, potentially `ready-from-cache`) separately.

Per-record PUT/DELETE endpoints or one PATCH endpoint are both viable; prefer whichever fits the backend's established routing and transactional patterns. For concurrent edits, decide whether the server needs a revision token/ETag or whether last-write-wins per key is sufficient for beta. **`updated_at` alone does not guarantee that an old in-flight write cannot overwrite a newer write.** The frontend must also track pending writes and ignore obsolete reads; this race needs explicit tests in #191/#192.

## Lifecycle decisions to resolve in #190

| Scenario | Recommended treatment | Why |
| --- | --- | --- |
| Plan deletion | FK cascade | Avoid abandoned user-specific preference rows |
| Plan duplication | Explicitly decide whether to clone overrides; if cloned, rebind only to copied plan's offering IDs | Prevent accidental inheritance between otherwise distinct plans |
| Offering removed from plan | Prefer retaining unmatched rows initially; consider explicit cleanup later | Prevent accidental data loss when removal is temporary |
| Plan membership changed, same offering remains | Reapply existing relevant preferences | Preferences are plan/offering scoped |
| Upstream reschedule | Leave old key unmatched; do not remap heuristically | Source does not provide guaranteed occurrence identity |
| Multi-device preference updates | Server is authoritative for saved values; define conflict behavior before claiming no lost updates | Local optimistic state alone does not prevent server write reordering |
| Browser snapshot not present | Fetch server preferences before event projection; unknown ≠ confirmed-empty | Avoid a transient flash of hidden events |

> [!NOTE]
> **Deliberate scope limit:** A local preference snapshot for instant startup is a later frontend concern under #191, and full teaching-event browser persistence is #182. Neither requires changing these sparse backend tables.

## Schema validation checklist

Before generating a Drizzle migration:

- [ ] Inspect actual `backend/` Plan table, primary key type, ownership relation, cascade convention, and migration tooling.
- [ ] Inspect Calendar #92's **actual** occurrence key encoder, serialization, ambiguity markers, and allowed override targets.
- [ ] Agree on maximum external-reference lengths and whether occurrence keys need a format-version field.
- [ ] Decide plan cloning and offering-removal behavior with tests.
- [ ] Decide API write conflict semantics and how frontend pending writes are acknowledged.
- [ ] Add migration tests for uniqueness, enum/check constraints, plan FK cascade, and cross-account isolation.
- [ ] Check that migration does not create or assume an authoritative SISU events table.

## References

- [Calendar Visibility Preference Contract](../calendar-visibility-preferences/) — identity, precedence, and reconciled application.
- [Study Calendar Design](../../under-dev/study-calendar/) — product scope.
- [Study-event and Location Contract](../../dev-guide/study-event-contract/) — upstream guarantees and limitations.
- [#189](https://github.com/kctong529/sisukas/issues/189) — contract workstream; [#190](https://github.com/kctong529/sisukas/issues/190) — backend implementation; [#191](https://github.com/kctong529/sisukas/issues/191) — frontend hydration; [#192](https://github.com/kctong529/sisukas/issues/192) — end-to-end validation.
