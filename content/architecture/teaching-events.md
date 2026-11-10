---
aliases:
  - "/dev-guide/study-event-contract/"
weight: 2
title: "Teaching Events"
description: "Teaching-data flow, SISU event identities, Calendar occurrence keys, location enrichment, frontend consumers, and verified limitations."
---
> [!NOTE]
> This contract distinguishes **observed upstream behavior** from the wrapper’s normalization decisions. Examples are representative, not a complete SISU specification.

# Teaching Events

This document records **observed** Aalto SISU Kori behavior from 27 October 2026,
and the **wrapper's chosen mapping**. The representative JSON bodies are in
`tests/fixtures/study_events/`; the manual HTTP probes are in
`examples/requests.http`. Those examples are not exhaustive SISU specifications.

## Data flow

Teaching events take a separate path from the published course catalogue. The diagram shows which component owns each step: SISU Kori is the source, `sisu-wrapper` normalizes it, and the browser's shared study-group runtime serves it to every frontend consumer. The Sisukas backend supplies plans; it does not relay or store teaching events.

![Teaching data flow from SISU Kori through sisu-wrapper to the frontend](/images/teaching-events/teaching-data-flow.svg)

- **Canonical teaching data** (solid arrows) is held only transiently outside SISU. `sisu-wrapper` memoizes normalized offerings in-process (`lru_cache(maxsize=128)` on `SisuService.fetch_course_offering()`) and reuses successful location lookups (see [Location references and enrichment](#location-references-and-enrichment)). A repeated request served by the same wrapper process may therefore return an earlier snapshot. The browser runtime is memory-only; persistent browser storage remains a proposal ([#182](https://github.com/kctong529/sisukas/issues/182)).
- **User-owned inputs** (dashed, labelled) are the active plan, stored by the backend, and Calendar visibility preferences. Visibility is currently kept in memory per plan and resets on reload. Its persistence is designed in [Calendar Visibility](../calendar-visibility-preferences/) and [Calendar Schema](../calendar-visibility-schema/), but not implemented (#190, #191).
- Requests identify an offering by `courseUnitId` and `courseOfferingId`; the frontend resolves the unit from the published course index ([Course Data](../course-data/)), which the diagram omits.

## Source hierarchy and identities

`Course unit → course-unit realisation → study-group set → study subgroup →
study-event series → expanded occurrence`.

- A realisation's `studyGroupSets[].studySubGroups[]` provides the subgroup `id`
  and `studyEventIds`.
- A study-event record has an `id` for the **series** and a list of expanded
  `events[]`. Neither the weekly lecture nor the single exam response exposed
  a separate occurrence ID.
- The wrapper's `StudyEvent.series_id` is the parent record ID, **not** a
  unique occurrence identifier. Several `StudyEvent` objects can have the
  same `series_id`.
- Calendar derives its own snapshot-scoped occurrence key from the offering,
  group, `series_id`, and start (see [Occurrence identity](#occurrence-identity)).
  Rescheduling changes that key; it is **not** a promised durable key for
  attendance or user overrides. Stability across upstream revisions has not
  been verified.

## Occurrence identity

Calendar needs a key for each occurrence so that it can attach a hide or show override, but SISU exposes series IDs, not occurrence IDs. The diagram follows `CalendarOccurrenceIdentity.ts` and its use in `CalendarProjection.ts`: which events receive a key, how the key is built, and when it is withheld.

![Calendar occurrence identity derivation and ambiguity handling](/images/teaching-events/occurrence-identity.svg)

- Keys are JSON-encoded arrays, so identifiers containing separators cannot collide through concatenation. The series form requires a non-empty `seriesId`. The fallback form includes `excluded`, but it is always `false` there because excluded occurrences are dropped before identity is derived.
- The collision check runs once over all candidates in the active-plan projection. Every colliding candidate keeps its entry with `occurrenceKey: null`; Calendar neither merges them nor assigns positional IDs. Group visibility still applies, and occurrence-level controls are disabled for those entries.
- A key is valid only for the teaching-data snapshot it was derived from. A changed start (either form), or changed rooms, status, or notice in the fallback form, produces a new key. A stored override for the old key must remain unmatched rather than be reattached; see [Calendar Visibility](../calendar-visibility-preferences/#missing-ambiguous-rescheduled-and-exceptional-events).

## Expanded occurrences and status

The wrapper uses SISU's expanded `events[]`, rather than expanding recurrence
rules. It preserves `start`, `end`, `cancelled`, `excluded`, and `notice`, with
missing Boolean flags defaulting to `False`. It also supplies `start_iso` and
`end_iso` and preserves the existing `start_datetime` / `end_datetime` accessors.

A real weekly lecture had `recursEvery: WEEKLY` and six expanded occurrences;
a real exam had `recursEvery: NEVER` and one occurrence. Both had empty
`exceptions`, `cancellations`, and `overrides` and no cancelled/excluded
occurrences. **Real exceptional-occurrence semantics are unverified**.
Synthetic test cases check only that the wrapper preserves flags, notices, and
location overrides. The wrapper does not automatically discard a cancelled or
excluded occurrence: calendar consumers must choose how to display it.

## Location references and enrichment

- Series-level `locationIds` is the default list of source room IDs.
- Each occurrence may contain `irregularLocationIds`. Current wrapper behavior:
  `null`/missing inherits series locations; non-null list (including `[]`)
  replaces them. This replacement interpretation is **provisional**, not
  confirmed from a real relocated occurrence.
- `StudyEvent.location_ids` always contains the *effective source IDs*.
  Each occurrence has an independent list.
- Optional resolution retrieves `GET /locations/v1/{id}`. A location can
  include `name`, `buildingId` and an embedded `building` with name/address.
  `StudyLocation` keeps the room ID, name, building ID/name, and street address.
- Localized names use the first nonempty value in `en`, `fi`, `sv` order,
  falling back to another nonempty translation. Observed room names used `fi`.
- Failed, absent, or malformed location lookups leave unresolved IDs in
  `location_ids` and omit missing objects from `locations`. They must not remove teaching occurrences.
- Lookups are deduplicated within an enrichment operation. Successful, validated
  locations are also reused across calls by a bounded, per-service, in-process
  LRU (#169). Failed lookups remain retryable. This is not durable storage or a
  cache shared between wrapper processes.

## Python and REST interfaces

Python consumers can call `fetch_study_groups(...)` without location lookups,
`fetch_study_groups_with_locations(...)` for enrichment, or
`resolve_study_group_locations(groups)` on previously fetched groups.
Enrichment must not mutate the unresolved cached objects.

Both `GET /api/courses/study-groups` and
`POST /api/courses/batch/study-groups` accept the optional query parameter
`resolve_locations` (default `false`). With `false`, occurrences still expose
`series_id`, `cancelled`, `excluded`, `notice`, and `location_ids`, while
`locations` is empty. With `true`, `locations` contains resolved room/building
objects when available. A lookup failure is nonfatal. Existing response
shapes and the group/occurrence counts are unchanged by enrichment.

For a real offering, compare resolved/unresolved responses after removing
only every `locations` property. This was manually verified for Introduction
to Space (`aalto-CU-1151000764-20260801`,
`aalto-cur-P-c235941a-0fd6-11f1-8c99-0050569455c9`); four distinct rooms
were resolved. See [API Reference](../../dev-guide/api/) and `sisu-wrapper/examples/requests.http` for repeatable requests.

## Timezone and scheduling limitations

Naive SISU occurrence timestamps are **assumed** to be Europe/Helsinki local
time and converted with `datetime.replace(tzinfo=ZoneInfo(...))`. This does
not validate ambiguous or nonexistent local wall times at DST transitions.
Explicit offsets are retained by the parser. The wrapper does not infer
cancelled-session replacements or reconcile event identities after rescheduling.

## Frontend consumers

Every production feature reads study groups from the shared runtime described in [Study-group Loading](../study-group-loading/); none calls `sisu-wrapper` itself. The diagram shows what each consumer needs and how it requests data.

![Frontend consumers of the shared study-group runtime](/images/teaching-events/consumer-usage.svg)

- Observing an entry never triggers HTTP. Network demand comes only from `ensure()` or `refresh()`: the authenticated active-plan loading and the request mode shown on each consumer.
- Calendar is the only consumer that derives occurrence keys or applies visibility. Favourites (through `StudyGroupsSection`) and LEGO use groups and events as normalized; they do not read the `cancelled` or `excluded` flags.
- Schedule analysis sends a derived payload to the backend's analytics endpoint for one calculation; the backend does not keep the teaching events. Development debug panels also read the runtime and are omitted.

## Verification and scope

- Observed fixtures: weekly lecture, non-recurring exam, and two real rooms.
- Synthetic tests: status flags, mixed active/cancelled/excluded events,
  location override/empty override, and HTTP serialization.
- Deferred: real relocation/cancellation examples, durable occurrence
  identity, DST ambiguity handling, and user preference persistence. These
  are **not** proven by the current tests.

## Related documentation

- [SISU Wrapper API](../../dev-guide/api/) — Public wrapper endpoints.
- [System Overview](../../system-overview/) — Component responsibilities.
- [Course Data](../course-data/) — Where runtime study details fit.
- [Study-group Loading](../study-group-loading/) — The shared frontend runtime.
- [Calendar Visibility](../calendar-visibility-preferences/) — Preference identity and reconciliation.
- [Calendar Schema](../calendar-visibility-schema/) — Proposed persistence tables.
