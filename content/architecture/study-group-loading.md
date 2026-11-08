---
weight: 2
title: "Study-group Data Management"
description: "Authoritative full-data caching, shared retrieval, failure handling, and reactive integration boundaries."
---

> [!NOTE]
> **Implementation status — November 2026.** `StudyGroupCache`, `StudyGroupCacheLoader`, `StudyGroupRequestCoordinator`, the strict HTTP transport adapter, and framework-independent cache notifications are implemented and tested. The new pipeline is **not yet wired into the production Svelte store or all consumers**. Reactive adapter and composition work remains under [#172](https://github.com/kctong529/sisukas/issues/172); loading policy, consumer migration, and legacy removal belong to [#173](https://github.com/kctong529/sisukas/issues/173), [#174](https://github.com/kctong529/sisukas/issues/174), and [#175](https://github.com/kctong529/sisukas/issues/175), respectively.

## Why this architecture exists

The legacy `studyGroupStore` grew around Favourites, where visible offerings were prioritized and other offerings could load in the background. The active-plan Calendar instead needs **complete study-group records** for a specific set of offerings. The [#161 performance investigation](https://github.com/kctong529/sisukas/issues/161) also identified redundant requests and queue coordination problems.

The new design separates **data ownership**, **cache-aware retrieval decisions**, **global request scheduling**, and **HTTP normalization**. It does not change the published course catalogue or the source-preserving study-event contract. The migration deliberately keeps the legacy frontend loading path operational until its consumers move to the new one.

## Component responsibilities

![Study-group cache, loader, and coordinator responsibilities](/images/study-groups/study-group-component-roles.svg)

| Component | Owns | Does not own |
| --- | --- | --- |
| `StudyGroupCache` | Authoritative full `StudyGroup[]` entries, state transitions, timestamps, errors, and change notifications | Fetching, freshness policy, scheduling, persistence |
| `StudyGroupCacheLoader` | `ensure()`/`refresh()` decisions, shared loader promises, cache outcome application, and invalidation of its lifecycle | Batch size, transport concurrency, HTTP normalization |
| `StudyGroupRequestCoordinator` | Per-offering pending work, FIFO queue, microtask coalescing, batching, global concurrency, outcome delivery, cancellation generation | Cache availability, active-plan policy, Svelte reactivity |
| `createStudyGroupTransport()` / `StudyGroupService` | One strict HTTP request per coordinator batch and source-preserving normalization | Cross-caller queueing or a second scheduler |
| Future reactive adapter and loading policy | Presentation-facing reads and triggers for relevant offerings | Another authoritative copy of full study-group data |

The coordinator's default configuration is `chunkSize: 20` and `concurrency: 2`. These are **transport-batch** limits, not per-component or per-caller limits. The strict service operation rejects more than 50 offerings in one call. The older `fetchStudyGroupsBatch()` retains its separate legacy scheduler for existing consumers; the **new path does not call that scheduler**.

## Offering identity and cache entry

A request identifies an offering using both `courseUnitId` and `courseOfferingId`. `studyGroupKey()` currently serializes this pair as `courseUnitId:courseOfferingId`, consistent with the wrapper response keys. The same key identifies entries in the cache, loader's pending map, and coordinator's in-flight map.

```ts
interface StudyGroupEntry {
  groups: StudyGroup[] | null;
  status: "missing" | "queued" | "loading" | "ready" | "failed";
  fetchedAt: number | null;
  error: string | null;
  refreshing: boolean;
}
```

**`groups === null` means full data is unavailable.** `groups: []` is a successful, complete response with no study groups, and populated `groups` are likewise complete. Neither an omitted response key nor a transport failure is converted into a successful empty array.

`fetchedAt` records the most recent **successful** full-data retrieval. A failed refresh retains both the old groups and that timestamp. `status: "queued"` is part of the type contract but is not set by the current `StudyGroupCache`/loader: whether work is queued or physically executing belongs to the coordinator, not the cache entry.

### Cache lifecycle

![Offering-level full-data cache state machine](/images/study-groups/study-group-cache-state-machine.svg)

| Cache condition | `groups` | `status` | `refreshing` | `error` |
| --- | --- | --- | --- | --- |
| Never loaded / cleared | `null` | `missing` | `false` | `null` |
| Initial request pending | `null` | `loading` | `false` | `null` |
| Initial request failed | `null` | `failed` | `false` | Failure message |
| Available result (including empty) | Array | `ready` | `false` | `null` |
| Refresh pending | Previous array | `ready` | `true` | `null` |
| Refresh failed | Previous array | `ready` | `false` | Failure message |

`markLoading()` rejects an entry already containing full data. `markRefreshing()` requires full data and retains the existing groups. `markReady(groups, time)` replaces the result and timestamp. `markFailed(error)` records an initial failure or, when groups exist, keeps the previous result available. `clear()` drops all entries. These methods change cache state **synchronously**; they do not schedule requests.

`markReady()` clones input groups with `structuredClone()`, while `get()` clones cached groups before returning them. This prevents mutation through caller-owned references. The cost of repeated cloning should be evaluated during the later [#175 benchmark](https://github.com/kctong529/sisukas/issues/175), not optimized prematurely.

## Retrieval, sharing, and batching

![Cache-aware retrieval and transport flow](/images/study-groups/study-group-retrieval-flow.svg)

`StudyGroupCacheLoader.ensure(requests)` deduplicates keys within its invocation, joins any loader-level pending operation, and otherwise **skips** offerings with available full data (`groups !== null`). Missing and initially failed offerings are marked loading and retrieved. A ready entry with a previous refresh error is still available and is not automatically refetched by `ensure()`.

`refresh(requests)` also joins existing pending work; it does **not** queue a second forced fetch behind a currently active one. Without pending work, it fetches even for ready entries: `markRefreshing()` retains old groups if present, or `markLoading()` is used if not.

![Shared offering requests and coordinator batching](/images/study-groups/study-group-request-sharing.svg)

Several levels of sharing have distinct purposes:

1. **Loader invocation:** a local `seen` set avoids repeated keys in one `ensure()` or `refresh()` call.
2. **Loader pending promises:** overlapping calls for the same offering await one cache-update operation.
3. **Coordinator in-flight map:** new coordinator callers join queued or running retrieval of the same offering.
4. **Global batch queue:** distinct offerings are grouped into HTTP transport batches, subject to one shared concurrency limit.

The coordinator queues requests and coalesces synchronous callers through a microtask. It calls the injected transport with bounded batches; that transport makes **one POST** via `StudyGroupService.fetchStudyGroupsChunk()`, using the existing normalization functions. There is no nested chunking/concurrency layer in this route. The old service's multi-chunk method remains available only to legacy consumers during migration.

### Progressive outcomes and independent failures

The coordinator exposes `loadSettled()` for per-offering outcomes. The loader's `onOutcome` callback updates each cache entry as it completes, even while other offerings remain pending. This makes partial progress observable without awaiting an entire request set.

A present result key with `[]` succeeds. An omitted requested key becomes a `StudyGroupRetrievalError`; rejected HTTP/transport calls produce failure outcomes. The loader records ordinary failures with `markFailed()` and allows subsequent retry. Successful results for other offerings remain intact. Failures while **applying** an outcome are also handled: the loader attempts to mark the entry failed rather than leaving it loading; an unrecoverable cache-update failure rejects the loader operation.

## Clearing and logical cancellation

![Logical invalidation and late transport completion](/images/study-groups/study-group-clear-timeline.svg)

`StudyGroupCacheLoader.clear()` increments its generation and performs three actions: `coordinator.clear()`, removal of loader pending promises, and `cache.clear()`. The coordinator's own generation invalidates queued and active logical requests and rejects pending promises with `StudyGroupRequestCancelledError`. The loader ignores callbacks from obsolete generations, and an old completion cannot remove a newer pending promise for the same key.

**Logical cancellation is not physical HTTP abort.** A previously dispatched transport may continue using an active concurrency slot until it settles. A fresh request after `clear()` is allowed, but it can remain queued if those slots are occupied. Obsolete responses do not restore cached data. Calling `cache.clear()` alone would not invalidate outstanding loader/coordinator work, so callers resetting the retrieval lifecycle should use the loader's `clear()`.

## Change notifications and reactive boundary

`StudyGroupCache.subscribe(listener)` provides a minimal, Svelte-independent observer API. Successful entry mutations synchronously emit `{ type: "entry", key }` **after** the cache has changed; `clear()` emits one `{ type: "clear" }` notification. `get()` does not notify. Subscription does not immediately replay the current entry, and the returned unsubscribe function stops later notifications.

```ts
const unsubscribe = cache.subscribe((change) => {
  if (change.type === "entry") {
    const entry = cache.get(change.key);
    // React to the updated offering entry.
  } else {
    // All previous offering entries were invalidated.
  }
});

// At the end of the consumer's lifecycle:
unsubscribe();
```

The notifications contain **keys, not mutable `StudyGroup[]` payloads**. Observers read the latest snapshot only when needed. Exceptions thrown by one observer do not prevent other observers from being notified or roll back a cache mutation. Notifications remain registered across `clear()` until explicitly unsubscribed.

The **Svelte-facing adapter is not yet implemented**. It should turn these notifications into reactive reads while retaining `StudyGroupCache` as the only owner of authoritative full data. The existing [Frontend State Management](../../dev-guide/stores/) conventions (`.state`, `.read`, `.actions`) govern the eventual public store API, not this framework-independent cache class.

## Current scope, guarantees, and migration

**Implemented and tested:** complete offering-level data with successful emptiness, safe refresh retention, common scheduling, progressive outcomes, bounded transport execution, reset-safe invalidation, and cache change notifications. Application-level integration tests cover progressive success/failure, shared retrieval, and clear during active transport.

**Not yet implemented in the new production path:** Svelte adapter/composition, active-plan and authentication-driven loading policy, freshness/TTL decisions, migration of Calendar/Favourites/LEGO/other consumers, persistent authoritative study-group storage, and physical cancellation of HTTP requests. None of those behaviors should be inferred from the standalone application tests.

| Work item | Scope |
| --- | --- |
| [#167](https://github.com/kctong529/sisukas/issues/167) | Request coordinator foundation |
| [#172](https://github.com/kctong529/sisukas/issues/172) | Authoritative cache, loader, transport and reactive/production integration |
| [#173](https://github.com/kctong529/sisukas/issues/173) | Centralized loading policy and lifecycle triggers |
| [#174](https://github.com/kctong529/sisukas/issues/174) | Calendar, Favourites, StudyGroupsSection and LEGO migration |
| [#175](https://github.com/kctong529/sisukas/issues/175) | Legacy cleanup and authenticated performance comparison with #161 |

## Related documentation

- [Course Data Architecture](../../dev-guide/data-architecture/) — Published catalogues, runtime resolution, and the separate on-demand teaching-data path.
- [Study-event and Location Contract](../../dev-guide/study-event-contract/) — Source event identity, timestamps, and locations.
- [Frontend State Management](../../dev-guide/stores/) — Svelte 5 store conventions and consumer APIs.
- [Study Calendar](../../under-dev/study-calendar/) — Active-plan completeness and calendar behavior.
- [SISU Wrapper API](../../dev-guide/api/) — Study-group endpoint contracts and normalization boundary.
