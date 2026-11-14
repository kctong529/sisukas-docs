---
weight: 7
title: "Calendar Schema"
description: "Implemented sparse Calendar visibility schema, identity constraints, and deployment boundary."
---

> [!NOTE]
> Migration `0005` was structurally verified against Supabase Test, not Production. Its database behavior is covered by #192. For repeatable commands and test evidence, see [Calendar Visibility Testing](../../dev-guide/calendar-visibility-testing/). Production migration-history review remains tracked by #135.

## Design objectives

Store user-specific **Calendar visibility** without copying SISU teaching groups or expanded events into the Sisukas backend. Preserve #92's group-level hidden state and occurrence-level hidden/explicit-visible overrides, scoped to a Sisukas plan. Keep an empty preference collection representable, and make resetting to inherited visibility simple and idempotent.

### Why two sparse tables?

| Alternative | Benefits | Trade-offs | Decision |
| --- | --- | --- | --- |
| One JSONB preferences document per plan | Single read/write, flexible schema | Concurrent edits require whole-document merge or optimistic version; difficult per-override constraints and deletes | Not selected for initial contract |
| One generic `target_kind` + `target_id` table | Fewer tables | Polymorphic constraints; nullable identifiers; harder uniqueness and correctness checks | Not selected |
| **Hidden groups + explicit occurrence overrides** | Natural keys, strong uniqueness, sparse writes, independent updates, explicit `visible` value | Two tables, likely one read transaction/query pair | **Implemented** |
| Full canonical event table with FK preferences | Referential integrity to events | Requires synchronizing SISU canonical data the backend does not currently own | Explicitly rejected |

The table split is about **different semantics**, not future attendance preferences. Do not add `attendance` or a general-purpose user-event entity for #189.

## Implemented relational schema

```text
plans (id UUID, user_id text)
    │
    ├── calendar_hidden_groups
    │     PK (plan_id, course_offering_id, study_group_id)
    │     FK plan_id → plans.id ON DELETE CASCADE
    │     row present = hidden
    │
    └── calendar_occurrence_overrides
          PK (plan_id, course_offering_id, study_group_id,
              occurrence_key_version, occurrence_key_hash)
          FK plan_id → plans.id ON DELETE CASCADE
          occurrence_key = exact serialized JSON identity (unindexed)
          occurrence_key_hash = lowercase SHA-256 hex of UTF-8 key
          visibility ∈ {hidden, visible}
```

The hash is a **physical index representation**, not a replacement for the logical identity `(plan, offering, group, version, original key)`. PostgreSQL validates hash consistency using `encode(sha256(convert_to(occurrence_key, 'UTF8')), 'hex')`; the service refuses conflicting digests rather than modifying another serialized key.

The choice follows a PostgreSQL 17 probe: a 2,489-byte low-compressibility fallback key fitted the original full-key B-tree index, while 3,589- and 5,089-byte keys failed with SQLSTATE `54000` (index entry exceeds 2,704 bytes). Hash-backed indexes avoid that limit for the occurrence key. No input is silently truncated.

Both tables store `course_offering_id varchar(100)`, `study_group_id text` (1–1,024 UTF-8 bytes), and `updated_at timestamptz NOT NULL DEFAULT now()`. Occurrence overrides also store `occurrence_key_version smallint` (currently 1), `occurrence_key text` (1–65,536 UTF-8 bytes), `occurrence_key_hash varchar(64)`, and constrained `visibility text`. Database `CHECK` constraints enforce lengths, supported version, allowed visibility, digest syntax, and digest equality.

No foreign key references `plan_instances`, which allows saved preferences to remain **dormant** when an offering leaves the plan. The service requires offering membership for *new writes*, but allows resets for absent offerings. Deleting a plan cascades to both tables. The backend does not store canonical SISU occurrences.

For authoritative DDL, read the tracked migration rather than copying a schema sketch from this page. See [Database Operations](../../dev-guide/database-operations/) for deployment verification and [Calendar Preference API](../../dev-guide/calendar-preference-api/) for HTTP semantics.

### Column and constraint rationale

| Column/constraint | Reason |
| --- | --- |
| `plan_id` (FK) | Plan-specific choices; enforce deletion and authorization through the existing plan model |
| `course_offering_id` | Distinguishes the same group ID if reused across offerings; matches active-plan `instanceIds` |
| `study_group_id` | Distinguishes groups, including those with the same display name or type |
| `occurrence_key` | Exact output of `deriveCalendarOccurrenceKey()`, unchanged, stored outside the primary key |
| `occurrence_key_hash` | SHA-256 of the exact UTF-8 serialized key, stored as a lowercase 64-character hexadecimal digest and verified by a database `CHECK` |
| `occurrence_key_version` | Explicit format revision; v1 matches the current JSON array encoder (do not prefix the key) |
| `visibility` occurrence enum/check | Allows explicit `visible` to override a hidden group; absence represents inherit |
| No group `visibility` column | The only nondefault group preference is hidden; presence of row already means hidden |
| Composite primary keys | Prevent duplicate groups and digest-scoped occurrence rows; full occurrence keys are checked on update/delete |
| `updated_at` | Diagnoses modifications and supports future reconciliation; not a complete conflict-resolution protocol |
| No duplicate `user_id` | Ownership is derived from `plans.user_id` (text); do not create a second owner field that can disagree |
| No `plan_instances` FK | Preserve preferences across temporary offering removal; validate membership for new writes and keep absent references unapplied |
| No canonical event FK | Backend does not store guaranteed current SISU occurrences; FK would create false ownership and synchronization overhead |

### Database mutation semantics

- Hide group → `INSERT ... ON CONFLICT ... DO UPDATE SET updated_at = now()` (or `DO NOTHING` if timestamp freshness is not important).
- Restore group → `DELETE` by the exact plan/offering/group tuple; deleting a nonexistent row is successful/idempotent.
- Set occurrence override → hash-backed upsert; update only when the stored original `occurrence_key` matches the supplied key; otherwise report a collision.
- Reset occurrence → look up the digest-scoped row, reject a different original key, and delete using the exact serialized key; deleting a missing row is successful/idempotent.
- Read preferences → query both tables filtered by a **server-authorized** plan ID. An empty pair of successful result sets means **confirmed-empty**, not loading.
- Never delete an occurrence override automatically just because the current upstream projection cannot resolve it.

The current service uses independent Drizzle statements rather than an explicit transaction. A GET combines both collections into one response, but does not claim a single MVCC snapshot across the two reads. Concurrent mutations follow database execution order; #191 must handle pending writes and out-of-order responses. Ownership cannot transfer, and plan deletion is protected by foreign-key cascade. Membership checks can race with offering removal, yielding a supported dormant preference.

## Ownership, isolation, and security

1. Authenticate using the backend's established session mechanism.
2. Resolve requested plan ownership **on the server** before any read, upsert, or delete. Do not accept a caller-chosen `user_id` as proof of ownership.
3. Use the same existing user/Plan authorization and deletion conventions as other plan-scoped endpoints; scope every mutation by the authorized plan ID.
4. Ensure a foreign plan returns the existing backend's established unauthorized/not-found behavior rather than exposing another user's preference details.
5. Clear or replace frontend preference state across sign-out, account changes, and plan switches; account-specific local replicas (if introduced) must be partitioned and invalidated independently.
6. Parameterize SQL/Drizzle queries; reject oversized identifiers and malformed values rather than normalizing them silently.

The schema does **not** independently prove that a SISU group or occurrence exists. That validation is context-dependent and belongs to the current Calendar projection. The server guarantees plan authorization and valid persisted reference shape, not live upstream identity.

### Input lengths and stored keys

The v1 key retains the exact frontend JSON serialization (`series` or `fallback`). The backend validates its structure and embedded offering/group scope; it does not look up SISU events or repair rescheduled keys.

- Offering IDs: 1–100 characters (`varchar(100)`).
- Group IDs: 1–1,024 UTF-8 bytes.
- Occurrence key: 1–65,536 UTF-8 bytes; exact serialization retained.
- Occurrence key version: `1`.

These are enforced in application validation and database constraints. The PostgreSQL probe showed that direct full-text B-tree indexing was unsafe for long fallback keys, motivating the verified SHA-256 physical index. See #190 progress history for measurements and the `backend/scripts/calendar-key-index-probe.sql` diagnostic.

## Boundary with the HTTP API

The schema stores opaque, offering-scoped references; it does not resolve SISU teaching events. All writes must be authorized against the owning plan, and new writes require that the offering currently belongs to the plan. The endpoint shapes, JSON examples, statuses and frontend write lifecycle are documented in [Calendar Preference API](../../dev-guide/calendar-preference-api/); this page intentionally does not duplicate them.

## Lifecycle policies

| Scenario | Recommended treatment | Why |
| --- | --- | --- |
| Plan deletion | FK cascade | Avoid abandoned user-specific preference rows |
| Plan duplication | Start empty unless a deliberate clone feature copies preferences transactionally with matching offering IDs | Keep independent plans independent by default |
| Offering removed from plan | Keep rows dormant and unapplied while membership is absent; validate current membership on new writes | Prevent accidental data loss when removal is temporary |
| Plan membership changed, same offering remains | Reapply existing relevant preferences | Preferences are plan/offering scoped |
| Upstream reschedule | Leave old key unmatched; do not remap heuristically | Source does not provide guaranteed occurrence identity |
| Multi-device preference updates | Server is authoritative for saved values; define conflict behavior before claiming no lost updates | Local optimistic state alone does not prevent server write reordering |
| Browser snapshot not present | Fetch server preferences before event projection; unknown ≠ confirmed-empty | Avoid a transient flash of hidden events |

> [!NOTE]
> **Deliberate scope limit:** The #191 frontend intentionally uses server-first hydration without a `localStorage` preference snapshot; offline or instant-start preference caching is **not a completion requirement** for #191. Full teaching-event browser persistence is separately tracked by #182. Neither requires changing these sparse backend tables.

## Schema verification status

- Migration `0005` was inspected on **Supabase Test**: two preference tables, 12 columns, 13 constraints, two primary-key indexes, eight Calendar RLS policies, and eight authenticated-role grants, with no anonymous table grants.
- The PostgreSQL integration suite passed **7/7** tests, including the synthetic I04 case where two offerings in one plan reuse the same study-group ID. It checks group preferences and occurrence overrides without relying on a real SISU collision.
- The restricted-role RLS suite passed **7/7** tests. That establishes policy behavior under simulated Supabase JWT subjects, independently from Better Auth route authorization.
- Production migration deployment is **not** implied; coordinate it after the migration-history review in #135.

For the exact verification workflow, environment guard and test commands, see [Calendar Visibility Testing](../../dev-guide/calendar-visibility-testing/).

## References

- [Calendar Visibility](../calendar-visibility-preferences/) — identity, precedence, and reconciled application.
- [Study Calendar](../../under-dev/study-calendar/) — product scope.
- [Teaching Events](../teaching-events/) — upstream guarantees and limitations.
- [#189](https://github.com/kctong529/sisukas/issues/189) — contract workstream; [#190](https://github.com/kctong529/sisukas/issues/190) — backend implementation; [#191](https://github.com/kctong529/sisukas/issues/191) — frontend hydration; [#192](https://github.com/kctong529/sisukas/issues/192) — end-to-end validation.
