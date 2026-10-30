---
weight: 4
title: "Study-event and Location Contract"
description: "SISU event identities, expanded occurrences, location enrichment, and verified limitations."
---
> [!NOTE]
> This contract distinguishes **observed upstream behavior** from the wrapper’s normalization decisions. Examples are representative, not a complete SISU specification.

# Study-event and location contract

This document records **observed** Aalto SISU Kori behavior from 27 October 2026,
and the **wrapper's chosen mapping**. The representative JSON bodies are in
`tests/fixtures/study_events/`; the manual HTTP probes are in
`examples/requests.http`. Those examples are not exhaustive SISU specifications.

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
- A prospective display key such as `(series_id, start)` is only a local
  convention. Rescheduling changes that key; it is **not** suitable as a
  promised durable key for attendance or user overrides. Stability across
  upstream revisions has not been verified.

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
  `location_ids` and omit missing objects from `locations`. They must not
  remove teaching occurrences. Lookups are deduplicated during a resolution
  operation; no persistent location cache is promised.

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
were resolved. See [API Reference](../api/) and `sisu-wrapper/examples/requests.http` for repeatable requests.

## Timezone and scheduling limitations

Naive SISU occurrence timestamps are **assumed** to be Europe/Helsinki local
time and converted with `datetime.replace(tzinfo=ZoneInfo(...))`. This does
not validate ambiguous or nonexistent local wall times at DST transitions.
Explicit offsets are retained by the parser. The wrapper does not infer
cancelled-session replacements or reconcile event identities after rescheduling.

## Verification and scope

- Observed fixtures: weekly lecture, non-recurring exam, and two real rooms.
- Synthetic tests: status flags, mixed active/cancelled/excluded events,
  location override/empty override, and HTTP serialization.
- Deferred: real relocation/cancellation examples, durable occurrence
  identity, DST ambiguity handling, and user preference persistence. These
  are **not** proven by the current tests.

## Related documentation

- [SISU Wrapper API](../api/) — Public wrapper endpoints.
- [Course Data Architecture](../data-architecture/) — Where runtime study details fit.
