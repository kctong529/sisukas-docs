---
weight: 4
title: "Calendar Visibility Preference Contract"
description: "Plan-scoped visibility identity, inheritance, and reconciliation contract for Calendar persistence (#189)."
---

> [!NOTE]
> **Status: proposed design for #189; not an implemented persistence API.** This page records the decisions to validate before #190 (database/API) and #191 (frontend hydration). The current in-memory behavior was delivered in #92. Attendance and default-group selection are separate work (#101).

## Purpose and ownership

Calendar combines institutional teaching events, retrieved on demand from SISU through `sisu-wrapper`, with user-owned **display** decisions. The Sisukas backend does **not** need a canonical teaching-event table to save those decisions: it stores opaque source references and preferences, and the frontend applies them to the currently available teaching data.

| Owner | What it owns | What it does not own |
| --- | --- | --- |
| SISU / `sisu-wrapper` | Course realisations, groups, event series, expanded occurrences | User visibility |
| Sisukas backend | Authenticated, plan-scoped persisted visibility records | Canonical teaching events, verified SISU foreign keys |
| Calendar preference runtime | Known/unknown readiness, local edits, pending saves, account/plan isolation | Institutional event mutations |
| Calendar projection | Deterministic application of known preferences to available source occurrences | Persistence or fetching |

This contract does not confer SISU registration, attendance intention, scheduling equivalence, or enrollment status. Hiding affects only Calendar presentation.

## Identity: three distinct layers

1. **Plan identity:** An authenticated Sisukas plan, identified by the application's existing plan primary key. A preference is scoped to a plan rather than to the current active-plan flag. Backend authorization resolves plan ownership from its existing relationship, not from a user ID supplied by the browser.
2. **Group association:** `(course_offering_id, study_group_id)` within the plan. The offering identifier is the course-instance/realisation identifier already stored in `Plan.instanceIds`. The group ID alone must not be assumed globally unique. Group visibility is attached to this association, not a group name, type, or display order.
3. **Occurrence association:** `(course_offering_id, study_group_id, occurrence_key)` within the plan. `occurrence_key` is the **existing Calendar domain's derived key** for a particular expanded occurrence, not `StudyEvent.id`, which may be a compatibility/index-based value. The exact derivation must be reused from #137/#92 source code; do not invent a second encoder in the API or database.

The upstream event-series ID is **not** an individual occurrence ID. `sisu-wrapper` has observed series IDs and expanded `events[]`, but no guaranteed stable occurrence identifier. A derived occurrence key may change if SISU changes the original start time or association. See [Study-event and Location Contract](../../dev-guide/study-event-contract/) and #89/#137.

> [!WARNING]
> **Identity is conditional, not eternal.** A key uniquely identifying an occurrence in a current projection is sufficient to apply a saved override **only while that key maps unambiguously**. It does not guarantee continuity across rescheduling or upstream data revisions. Do not match a stored override to the nearest event by date, group, room, or title.

### Identifier normalization

- Preserve SISU-issued offering and study-group IDs as opaque, case-sensitive strings. Do not lowercase, trim, translate, parse as UUIDs, or infer meaning from their formatting at read/write time.
- Use a single canonical occurrence-key generator from the Calendar domain, with a documented key-format version for persisted records. Key creation and collision diagnostics remain frontend responsibilities; the backend treats the key as opaque.
- Reject empty strings and impose reasonable maximum lengths at the API boundary. Exact bounds and whether a key version is stored separately must be confirmed against the current TypeScript implementation before #190 migrations are finalized.
- The plan ID and external references together determine persistence scope. No human-readable group/event names, timestamps, or entire `StudyEvent` payloads are required to enforce this contract.

## Sparse persisted state

Persist **only deviations** from defaults. Absence of a preference row means *inherit*; it is not a durable `visible` record for every group and event.

### Group visibility

A group preference has just one meaningful persisted value: **hidden**. By default, groups are shown when the source projection otherwise includes them.

- `hide group` → upsert a hidden-group row.
- `show group / restore default` → delete that row.
- Group-level visibility never alters whether a student plans to attend that group.

### Occurrence visibility

An occurrence override has two persisted values: **hidden** and **visible**. No row means *inherit*.

- `hide occurrence` → upsert `hidden`.
- `explicitly show occurrence` → upsert `visible` (important when its group is hidden).
- `reset occurrence to inherited` → delete the row, **not** upsert a third `inherit` state.

**Explicit `visible` is different from no override.** Removing an explicit-visible occurrence row in a hidden group makes that occurrence hidden again.

### Precedence and effective visibility

For a source occurrence that is eligible for Calendar presentation:

```text
if source excluded from the projection:
    not displayed (preference cannot restore it)
else if unambiguous occurrence override exists:
    visible if override == visible; hidden if override == hidden
else if its offering/group association has a hidden-group row:
    hidden
else:
    visible by default
```

| Group hidden? | Occurrence override | Effective visibility |
| --- | --- | --- |
| No | Inherit (no row) | Visible |
| No | Hidden | Hidden |
| No | Visible | Visible (explicit) |
| Yes | Inherit (no row) | Hidden |
| Yes | Hidden | Hidden |
| Yes | Visible | **Visible** |

The group and occurrence associations remain distinct even when two events have identical start/end times. A group hide applies only to the matching offering/group. An override must not bleed across an adjacent offering or similarly named group.

## Missing, ambiguous, rescheduled, and exceptional events

| Case | Policy | Rationale |
| --- | --- | --- |
| Same occurrence key resolves to **exactly one** eligible source association | Apply its override | Satisfies the local identity contract |
| No current matching association | Keep preference stored but **unapplied** | Could be rescheduled, removed, temporarily missing, or unavailable |
| Multiple current associations resolve to the same persisted occurrence identity | **Do not apply** occurrence override; surface ambiguous diagnostic | Prefer a visible unresolved decision over silently hiding the wrong event |
| Occurrence rescheduled and its derived key changes | Old override stays unmatched; new event inherits normal group/default visibility | No authoritative mapping between old and new occurrence exists |
| Source event marked cancelled | Preserve source cancellation state; apply visibility only if Calendar still presents that occurrence and its identity is unambiguous | Visibility does not change cancellation semantics |
| Source event excluded/omitted by projection | Never resurrect it through an explicit-visible override | Source eligibility precedes presentation preferences |
| Teaching data missing/stale/failed | Do not declare stored references invalid based only on absent data | Completeness is independent of preference matching |
| Offering removed from plan | Preference remains plan-associated until explicit policy/cleanup; must not affect other offerings | Avoid implicit destructive actions during transient edits |

> [!IMPORTANT]
> **Unresolved reference ≠ delete.** The frontend may report stale/unmatched overrides, but should not automatically rewrite a key to a nearby occurrence, nor erase data just because a network response omitted an offering. Cleanup and plan-duplication semantics belong to #190/#192.

### Ambiguity and write safety

#92 already disallows changing visibility for an ambiguous occurrence. Maintain that safeguard for newly created overrides. The server cannot independently prove SISU occurrence uniqueness without fetching canonical data; it should validate shape and plan access, while the frontend validates identity against the *current complete projection* before offering a control. Reconciliation must re-check ambiguity after teaching data changes.

## Loading and snapshot readiness

A **confirmed-empty** preference collection is not the same as an **unknown** collection:

| State | Meaning | Event projection |
| --- | --- | --- |
| `unknown` / `loading` | No authoritative or accepted local preference snapshot yet | Do not assume default visibility or render event cards using empty preferences |
| `ready` with zero rows | Successful response or accepted snapshot confirms no overrides | Default visibility is valid |
| `ready` with rows | Known applicable preference state | Apply precedence above |
| `error` and no accepted snapshot | Preferences unavailable | Show an explicit incomplete/loading-error state; avoid flashing hidden events as visible |
| `ready-from-cache` | Last-known applicable snapshot accepted for this account/plan | May render last-known projection and reconcile; **not** proof of current server state |

#93 may initially wait for authenticated server hydration. #182 may later add browser teaching snapshots, but it must coordinate them with **known** preferences rather than projecting first with an empty object. Per-user/plan snapshot partitioning and generation guards are required when local persistence is introduced.

### Mutation ordering

Optimistic edits should update the current projection immediately, mark the changed preference unconfirmed until acknowledged, and prevent older in-flight reads or writes from overwriting a newer local choice. The server is authoritative for acknowledged persistence; the local runtime must expose failed/unconfirmed writes. The exact revision, API, and retry protocol are designed in #190/#191, not assumed here.

## Logical serialized example (not a finalized API)

```json
{
  "planId": "<existing-plan-id>",
  "status": "ready",
  "groups": [
    {"courseOfferingId": "offering-A", "studyGroupId": "H1", "hidden": true}
  ],
  "occurrences": [
    {"courseOfferingId": "offering-A", "studyGroupId": "H1", "occurrenceKey": "<opaque-calendar-key>", "visibility": "visible"},
    {"courseOfferingId": "offering-A", "studyGroupId": "H2", "occurrenceKey": "<another-key>", "visibility": "hidden"}
  ]
}
```

`status` is shown for clarity as **frontend hydration state**; it need not be a field inside a successful backend response. A successful response with empty `groups` and `occurrences` arrays constitutes confirmed-empty. The example placeholders must **not** be used as an occurrence-key format specification.

## Contract test matrix for #189 / #192

1. No persisted rows → confirmed-empty → eligible events shown by default.
2. Hidden group plus no occurrence row → its eligible occurrences hidden.
3. Hidden group plus explicit-visible occurrence → that occurrence visible; siblings hidden.
4. Visible/default group plus explicit-hidden occurrence → that occurrence hidden.
5. Reset a hidden occurrence in a hidden group → inherited hidden; reset a visible override in that group → inherited hidden.
6. Repeated source associations and derived-key collision → ambiguous occurrence override ignored and diagnosed.
7. Same group ID in separate offerings → independent preferences.
8. Changed start/derived key → old override unmatched; replacement occurrence not automatically hidden.
9. Cancelled event retains cancellation metadata; excluded event cannot be restored by preference.
10. Partial/missing teaching data → no automatic deletion or stale misclassification.
11. Unknown/pending preference hydration → no default-state event-card flash; confirmed-empty is distinct.
12. Serialization → deserialization preserves explicit-visible vs inherited absence, and no source metadata is invented.

These are **required test cases**, not a claim that the repository's current unit tests already cover persistence.

## Decisions for #190 and #191

- Adopt sparse plan-scoped rows for group hides and occurrence explicit overrides (see [Schema Proposal](../calendar-visibility-schema/)).
- Keep `occurrence_key` opaque, generated by the existing Calendar domain helper; verify its exact format/version in the application source before migration.
- Prefer plan-owned foreign keys and server-derived authorization over trusting client-supplied user ownership.
- Keep attendance, default teaching group, recurring exceptions, and browser teaching-event snapshots outside this workstream.

## References

- [Study Calendar Design](../../under-dev/study-calendar/) — product behavior and feature scope.
- [Study-event and Location Contract](../../dev-guide/study-event-contract/) — observed upstream identity limits.
- [Schema Proposal](../calendar-visibility-schema/) — relational representation and trade-offs.
- [#89](https://github.com/kctong529/sisukas/issues/89), [#90](https://github.com/kctong529/sisukas/issues/90), [#92](https://github.com/kctong529/sisukas/issues/92), [#93](https://github.com/kctong529/sisukas/issues/93), [#189](https://github.com/kctong529/sisukas/issues/189), [#190](https://github.com/kctong529/sisukas/issues/190), [#191](https://github.com/kctong529/sisukas/issues/191), [#192](https://github.com/kctong529/sisukas/issues/192).
