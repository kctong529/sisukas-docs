---
weight: 2
title: "Study-group Loading"
description: "Authoritative full-data caching, shared retrieval, failure handling, and reactive integration boundaries."
---

> [!NOTE]
> **Implementation status — 9 November 2026.** The shared full-data runtime is the production retrieval path. Centralized authenticated active-plan loading (#173), consumer migration (#174), and legacy-store/service cleanup (#175) are complete. The in-memory architecture was benchmarked against #161; optional browser persistence remains tracked by [#182](https://github.com/kctong529/sisukas/issues/182).

## Why this architecture exists

The legacy `studyGroupStore` grew around Favourites, where visible offerings were prioritized and other offerings could load in the background. The active-plan Calendar instead needs **complete study-group records** for a specific set of offerings. The [#161 performance investigation](https://github.com/kctong529/sisukas/issues/161) also identified redundant requests and queue coordination problems.

The new design separates **data ownership**, **cache-aware retrieval decisions**, **global request scheduling**, and **HTTP normalization**. It does not change the published course catalogue or the source-preserving study-event contract. The legacy loading path has been removed following consumer migration.

## Component responsibilities

![Study-group cache, loader, and coordinator responsibilities](/images/study-groups/study-group-component-roles.svg)

| Component | Owns | Does not own |
| --- | --- | --- |
| `StudyGroupCache` | Authoritative full `StudyGroup[]` entries, state transitions, timestamps, errors, and change notifications | Fetching, freshness policy, scheduling, persistence |
| `StudyGroupCacheLoader` | `ensure()`/`refresh()` decisions, shared loader promises, cache outcome application, and invalidation of its lifecycle | Batch size, transport concurrency, HTTP normalization |
| `StudyGroupRequestCoordinator` | Per-offering pending work, FIFO queue, microtask coalescing, batching, global concurrency, outcome delivery, cancellation generation | Cache availability, active-plan policy, Svelte reactivity |
| `createStudyGroupTransport()` / `StudyGroupService` | One strict HTTP request per coordinator batch and source-preserving normalization | Cross-caller queueing or a second scheduler |
| `createStudyGroupEntryStore()` | Read-only, per-offering Svelte `Readable<StudyGroupEntry>` snapshots and notification subscriptions | Data ownership, fetching, freshness decisions |
| `StudyGroupDataRuntime` | Shared composition and public `entry()`/`ensure()`/`refresh()`/`clear()` operations | Active-plan selection, automatic hydration, TTL policy |

`createStudyGroupDataRuntime({ service, now?, chunkSize?, concurrency? })` constructs an isolated cache, coordinator, loader, and transport for testing or controlled use. `getStudyGroupDataRuntime()` lazily constructs a shared browser-side runtime using the configured wrapper API. Both forms are inert until retrieval is requested, and the facade does not expose mutable cache operations or coordinator internals. The Svelte adapter is a view over this same cache, not a second authoritative dataset.

The coordinator's default configuration is `chunkSize: 20` and `concurrency: 2`. These are **transport-batch** limits, not per-component or per-caller limits. The strict service operation rejects more than 50 offerings in one call. The old multi-chunk service scheduler and `fetchStudyGroupsBatch()` have been removed; all production study-group HTTP retrieval uses the shared coordinator and strict `fetchStudyGroupsChunk()` transport boundary.

## Public runtime API

The [shared runtime](https://github.com/kctong529/sisukas/issues/172) is the production retrieval entry point for consumers. It exposes four methods:

| Method | Behavior |
| --- | --- |
| `entry(request)` | Returns a read-only Svelte `Readable<StudyGroupEntry>` for one offering; observing it does **not** trigger HTTP |
| `ensure(requests)` | Joins pending retrievals and fetches only offerings without full cached data; a successful empty array counts as available |
| `refresh(requests)` | Joins existing pending work or explicitly fetches again, retaining previously successful groups during refresh |
| `clear()` | Delegates to the loader to clear entries and invalidate outstanding logical requests; cancelled operations reject |

```ts
import { getStudyGroupDataRuntime } from "@modules/study-groups";

const runtime = getStudyGroupDataRuntime();
const request = { courseUnitId: "unit-id", courseOfferingId: "offering-id" };
const entry = runtime.entry(request); // Observation only; no HTTP.

// Reading an entry is passive; retrieval is coordinated by the application lifecycle or explicit ensure().
await runtime.ensure([request]);
```

`entry()` creates a lightweight observable view of a shared authoritative cache. It listens to changes for its offering and to global `clear` events; unrelated offering updates are ignored. The Svelte store subscribes to the cache while it has consumers, unsubscribes when the last one leaves, and rereads current state on resubscription. Returned snapshots are defensive copies of cached groups, but consumers should still treat store snapshots as immutable.

All migrated production consumers share the browser-side runtime cache and coordinator. The authenticated application lifecycle triggers default active-plan loading (#173); the runtime itself remains policy-neutral and does not implement time-based refresh. It is memory-only and is reset across page reloads.

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

`markReady()` clones input groups with `structuredClone()`, while `get()` clones cached groups before returning them. This prevents mutation through caller-owned references. The #175 browser benchmark measures end-to-end loading; it does not isolate the cost of defensive cloning.

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

The coordinator queues requests and coalesces synchronous callers through a microtask. It calls the injected transport with bounded batches; that transport makes **one POST** via `StudyGroupService.fetchStudyGroupsChunk()`, using the existing normalization functions. There is no nested chunking/concurrency layer in this route. The old service multi-chunk method and its independent scheduler have been removed.

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

The implemented `createStudyGroupEntryStore(cache, request)` converts those notifications to a per-offering Svelte `Readable<StudyGroupEntry>`. The shared runtime's `entry(request)` exposes that adapter without returning the mutable cache. This uses the standard Svelte readable-store interface; the existing [State Conventions](../../dev-guide/stores/) conventions describe broader UI-store patterns and do not require this adapter to expose `.state`, `.read`, or `.actions`. Neither the cache observer nor the Svelte adapter performs HTTP retrieval.

## Current scope, guarantees, and validation

The production retrieval path is `StudyGroupDataRuntime → StudyGroupCacheLoader → StudyGroupRequestCoordinator → createStudyGroupTransport() → StudyGroupService.fetchStudyGroupsChunk() → POST /api/courses/batch/study-groups`. Cache entries are authoritative, complete `StudyGroup[]` records; successful empty responses are valid. The coordinator deduplicates offering requests, coalesces batches, and limits concurrent transport requests. The application lifecycle selects the active plan and initiates default loading, while the runtime owns neither plan selection nor persistence.

The legacy `studyGroupStore` and obsolete service retrieval methods have been deleted. An architectural regression test under `tests/scripts/study-group-retrieval-boundary.test.js` guards construction, transport ownership, and absence of superseded APIs. Existing unit and integration tests cover request sharing, caching, cancellation, normalization, and completeness.

### Authenticated browser benchmark (#161 → #175)

The original 6 November 2026 #161 benchmark contained one run per scenario. The 9 November 2026 #175 follow-up used three runs per scenario, with the same 65-offering active plan, Chromium, blocked service workers, and 1.5-second idle observation interval.

| Metric | #161 baseline (1 run) | #175 median (3 runs) |
| --- | ---: | ---: |
| Cold complete | 97,003 ms | 9,466 ms |
| Reload complete | 96,715 ms | 8,310 ms |
| Warm navigation complete | 1,925 ms | 1,918 ms |
| Cold requests | 20 | 4 |
| Reload requests | 22 | 4 |
| Cold peak concurrency | 12 | 2 |
| Reload peak concurrency | 10 | 2 |

All nine #175 runs completed with 65/65 offerings available, no failed or missing entries, no HTTP/network errors, and no pending study-group requests. The observed cold and reload completion improvements are approximately 10.2× and 11.6×, respectively. These are local benchmark observations, **not guaranteed speedups**: the #161 baseline is a single run and upstream cache conditions were not controlled. Warm navigation required zero requests both before and after the redesign. Completion times include the benchmark's idle observation interval.

The benchmark was adjusted to tolerate transient `plan="none"` during authenticated initialization before declaring an invalid active plan. See `frontend/course-browser/scripts/README.benchmark161.md` for reproducible instructions.

**Scope boundary:** Browser persistence of complete study-group data remains separate under [#182](https://github.com/kctong529/sisukas/issues/182). The runtime cache is memory-only: warm navigation reuses entries, while reload requires network retrieval. The current implementation does not physically abort dispatched HTTP requests during invalidation.

| Work item | Scope |
| --- | --- |
| [#167](https://github.com/kctong529/sisukas/issues/167) | Shared request coordinator |
| [#172](https://github.com/kctong529/sisukas/issues/172) | Cache, loader, transport, and runtime |
| [#173](https://github.com/kctong529/sisukas/issues/173) | Authenticated default active-plan loading |
| [#174](https://github.com/kctong529/sisukas/issues/174) | Consumer migration |
| [#175](https://github.com/kctong529/sisukas/issues/175) | Legacy cleanup and authenticated performance comparison |
| [#182](https://github.com/kctong529/sisukas/issues/182) | Optional persistent full-data browser caching |

## Related documentation

- [Course Data](../course-data/) — Published catalogues, runtime resolution, and the separate on-demand teaching-data path.
- [Teaching Events](../teaching-events/) — Source event identity, timestamps, and locations.
- [State Conventions](../../dev-guide/stores/) — Svelte 5 store conventions and consumer APIs.
- [Study Calendar](../../under-dev/study-calendar/) — Active-plan completeness and calendar behavior.
- [SISU Wrapper API](../../dev-guide/api/) — Study-group endpoint contracts and normalization boundary.
