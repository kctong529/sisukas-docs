---
weight: 2
title: "Study-group Loading Architecture"
description: "Proposed full-data caching and request coordination for Calendar, Favourites, and LEGO."
---

> [!IMPORTANT]
> **Proposed design — not implemented.** This page records the target contracts for [#167](https://github.com/kctong529/sisukas/issues/167), following the performance investigation in [#161](https://github.com/kctong529/sisukas/issues/161). The current frontend still has legacy summary caching and priority queues. Backend request orchestration and location caching are separate follow-ups ([#168](https://github.com/kctong529/sisukas/issues/168), [#169](https://github.com/kctong529/sisukas/issues/169)).

## Why this needs to change

The existing `studyGroupStore` was designed around Favourites View: visible offerings were prioritized, while other offerings could refresh in the background. The active-plan Calendar requires *complete full study-group records* for a defined set of offerings to compute and display its projection reliably. Profiling in #161 also revealed concurrent queue flushes and possible redundant requests. The existing summary cache, localStorage fallback, and per-flush concurrency make it difficult to reason about completeness and request ownership.

This redesign targets the frontend only. It keeps the wrapper's current response contract and the existing normalization of study-event occurrences, status, and source location IDs.

## Responsibilities and boundaries

| Component | Owns | Does not own |
|---|---|---|
| Calendar / Favourites / LEGO | Required offering set and view-specific loading policy | Global fetch coordination |
| `studyGroupStore` | Full-data entries, reactive read API, freshness and errors | SISU HTTP normalization |
| Request coordinator | Pending/in-flight deduplication, batching, global concurrency, result delivery | Svelte state, display summaries |
| `StudyGroupService` | Wrapper HTTP transport and response normalization | Cross-consumer scheduling |
| `sisu-wrapper` | Source retrieval and enrichment | Frontend completeness criteria |

Follow the existing [Frontend State Management](../../dev-guide/stores/) convention: `.state`, pure `.read`, and mutating/IO `.actions`.

## Data identity and availability

The offering identity is the pair `(courseUnitId, courseOfferingId)`. The currently deployed service serializes the pair as `unitId:offeringId`; implementations should centralize this conversion and verify that the key convention is unambiguous for supported identifiers.

The authoritative cache stores **full `StudyGroup[]` records only**. A `null`/absent value means no successful full response has been received. An empty `[]` means the response succeeded and the offering genuinely has no study groups. An omitted response key or transport failure is **not** equivalent to `[]`.

For each offering, the store exposes availability (`missing`, `queued`, `loading`, `ready`, `failed`), data freshness, and any refresh error. Cached full data remains readable during refresh and, where appropriate, after a failed refresh. Summaries needed for display are derived from full data; no independent summary cache is maintained after migration.

> [!NOTE]
> Availability and freshness are separate dimensions. The final state representation is subject to characterization tests before implementation.

## Request coordination invariants

1. Simultaneous consumers requesting the same offering share one pending or in-flight fetch.
2. A key is never dispatched twice concurrently, including during stale or forced refresh.
3. The configured concurrency limit applies **globally** across store-initiated HTTP batches, not per caller or flush.
4. Results can complete progressively, but missing response keys and errors remain observable per offering.
5. A successful empty response marks the offering ready.
6. `clear()`/account reset invalidates old results; responses from an obsolete generation cannot repopulate current state.
7. Failures or retries for one offering do not prevent unrelated offerings from completing.
8. Fetch priority, if later required, does not bypass deduplication or global concurrency.
9. Transport and coordinator can be unit-tested without Svelte or live SISU requests.

## Consumer requirements

**Calendar:** Request exactly the offerings required by the currently active plan; derive completeness from those keys rather than the entire store. Distinguish loading, missing, failed and successful empty results. A plan switch must not count unrelated earlier requests toward current completeness.

**Favourites:** Render full data progressively for relevant visible offerings. No summary-only fallback is required by the target architecture. The exact prefetch scope should be evaluated before replacing the current eager fetching behavior.

**LEGO and course details:** Reuse full cached or in-flight data for their own required offerings. Preserve the source-preserving normalized study groups used by scheduling and calendar consumers.

For temporal identities, occurrence flags, and location semantics, continue to use the [Study-event and Location Contract](../../dev-guide/study-event-contract/). This redesign must not collapse separate occurrences sharing a time range.

## Incremental migration

1. Characterize the existing store and consumers with tests; define full-data entry types.
2. Build a framework-independent coordinator behind an injected batch transport; test deduplication, bounded concurrency, partial failure and reset behavior.
3. Adapt the current store to the coordinator behind its existing read/actions API.
4. Remove the old high/low queues after all request paths use the coordinator.
5. Migrate Favourites, Calendar, LEGO and debug consumers in small steps.
6. Retire the summary/localStorage cache once no consumers depend on it; update fixtures that directly mutate internal state.
7. Run frontend checks and the authenticated benchmark documented in `frontend/course-browser/scripts/README.benchmark161.md`; compare completeness, request count, latency, and failure behavior against #161.

## Deferred decisions

- Freshness/TTL and whether forced refresh waits for an in-flight request or schedules a subsequent refresh.
- Optional cancellation of obsolete HTTP work (distinct from discarding late responses).
- Durable offline storage and versioned dataset publication (not part of #167; see #161).
- Backend bounded concurrency and shared location caching (#168 and #169).

## Related documentation

- [Frontend State Management](../../dev-guide/stores/) — `.state`, `.read`, `.actions` conventions.
- [Study Calendar](../../under-dev/study-calendar/) — Active-plan completeness and calendar intent.
- [Study-event and Location Contract](../../dev-guide/study-event-contract/) — Source event and location invariants.
- [Course Data Architecture](../../dev-guide/data-architecture/) — Published catalogue and on-demand data boundaries.
