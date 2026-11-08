---
weight: 2
title: "Course Data Architecture"
description: "System boundaries and data lifecycles for canonical catalogues, runtime resolution, teaching details, and browser-side composition."
---

> [!NOTE]
> This page explains **where course data originates, which system owns it, and how the browser combines it**. For workflow triggers, exact processing commands, publication safeguards, and recovery, see [Data Pipeline](../data-pipeline/).

## Why several data flows exist

Sisukas cannot rely on a single live upstream endpoint for every course view. Discovery needs a stable, validated catalogue; planning needs current teaching details; earlier study periods need records that may disappear upstream; and imported plans may refer to courses absent from both published catalogues.

The architecture therefore separates canonical published datasets, temporary runtime course snapshots, on-demand study groups and events, and curated curriculum and organization metadata. Their refresh, validation, storage, and failure rules are intentionally different.

## End-to-end system map

[![Sisukas course data architecture showing system boundaries, publication, runtime services, and browser-side composition](/images/course-data-architecture.svg)](/images/course-data-architecture.svg)

| Data path | Owner and source | Browser consumption |
| --- | --- | --- |
| Canonical catalogue | GitHub Actions publishes Aalto Course API data to GCS | Active and historical course indexes |
| Runtime snapshots | Node.js backend and PostgreSQL, resolving through `sisu-wrapper` | Best-effort augmentation of historical records |
| Study groups and teaching events | SISU Kori via `sisu-wrapper` | Independent study-group cache and scheduling views |
| Curriculum and organization metadata | Curated frontend repository data | Curriculum- and organization-aware features |

**Canonical publication and runtime enrichment are separate ownership boundaries.** Runtime snapshots may supplement what a user sees, but they are not automatically promoted into published `historical.json`. Delayed candidate processing is a proposal, not part of the deployed publication job.

## 1. Canonical catalogue: scheduled publication

**Upstream:** authenticated Aalto Course API. **Orchestrator:** GitHub Actions. **Published storage:** Google Cloud Storage (GCS).

The workflow `.github/workflows/check_course_updates.yml` loads the previous active and historical baselines, fetches current course realisations, transforms and validates them, and reconciles the latest response with previously published data. Reconciliation preserves appropriate existing records and identifies archive candidates; the latest upstream response is **not** blindly substituted for the active catalogue.

The pipeline updates history when removals or reactivations require it, checks the resulting active/historical datasets, and publishes validated changes. Its stages include fetch, transformation, reconciliation, historical maintenance, and publication; the diagram shows the ownership and direction of the resulting data transfers.

| Published artifact | Architectural purpose |
| --- | --- |
| `courses.json` | Canonical current active course catalogue |
| `historical.json` | Canonical accumulated historical course records |
| Hashes and change metadata | Change detection, integrity/revalidation, and publication reporting |

**Source of truth:** the published GCS catalogues—not raw upstream responses, IndexedDB contents, or runtime PostgreSQL snapshots. The operational rules, including exact workflow jobs, archive thresholds, hash publishing, authentication, and recovery procedures, are documented in [Data Pipeline](../data-pipeline/).

### Historical discovery is different from routine archiving

The routine reconciliation path preserves instances leaving the active catalogue. Historical crawling can discover older instances that were **never present in the previous active baseline**. It uses SISU Kori relationships to discover course-unit realisation identifiers and the Aalto Course API to retrieve corresponding payloads.

Crawl output is checkpointed, deduplicated, and normalized before it is considered for catalogue maintenance; it is not canonical merely because it was fetched. See [Historical Course Records](../historical/) for the collection procedure and its safeguards.

## 2. Runtime course resolution and snapshot storage

**Systems:** `sisu-wrapper` (FastAPI), Sisukas backend (Node.js), PostgreSQL. **Upstream:** SISU Kori.

Missing-course recovery supplies course instances absent from the published catalogues, without requiring an immediate canonical publication:

1. The frontend requests resolution through `POST /api/course-snapshots/resolve` on the backend.
2. The backend invokes the wrapper's `/api/courses/resolve` endpoint, which resolves the required upstream information.
3. `CourseSnapshotsService.ts` saves eligible matches in PostgreSQL, keyed for upsert by course code and realisation identifier.
4. The browser retrieves saved snapshots from the backend snapshot endpoint when building its historical view.

The current resolution route uses a **180-day expiry policy**. These stored records are **noncanonical, temporary runtime enrichments**. PostgreSQL is private to the backend: the browser accesses snapshots through the API, not through a database connection.

> [!IMPORTANT]
> Storing or displaying a resolved snapshot does **not** update `historical.json`, publish anything to GCS, or establish a validated canonical record.

The separate [Runtime Course Recovery and Backfill](../../under-dev/snapshot-backfill/) documentation includes a proposed delayed canonical backfill process. Do not confuse that proposal with deployed snapshot recovery.

## 3. Browser-side catalogue composition

**Owner:** Svelte frontend. **Inputs:** `courses.json`, `historical.json`, and backend runtime snapshots.

The browser constructs the course catalogue views locally. The three inputs do not have equal authority, and the merge is more than a simple concatenation.

### Load the canonical baselines

`RemoteCourseLoader.ts` loads `courses.json` and `historical.json` using the configured `VITE_GCS_BUCKET` URLs. `CourseParser.ts` validates individual records and skips invalid entries.

`courseIndexStore.svelte.ts` builds indexes by instance identifier and course code:

- **Active index:** current records from `courses.json`.
- **Historical baseline:** records from `historical.json`.

### Augment historical records with snapshots

The frontend retrieves eligible resolved snapshots through the backend. `SnapshotHistoricalMerge.ts` normalizes supported payloads to the course parser contract. Snapshot fetching and augmentation are **best-effort**; the canonical historical baseline is still required for historical bootstrap.

The effective composition is:

1. Start with the historical baseline from `historical.json`.
2. Append eligible resolved snapshots, skipping duplicate instance identifiers.
3. Prune historical entries whose instance IDs overlap with the active index.
4. Keep active records authoritative when forming a combined view.

This produces an **augmented historical index**, in browser memory, without writing the result back to GCS or PostgreSQL.

| View | Composition |
| --- | --- |
| **Active** | Active index from `courses.json` |
| **All courses** | Active index plus augmented historical index, preferring active records on overlap |

### Distribution and browser caching

`LargeFileCache.ts` stores downloaded canonical files in IndexedDB keyed by data URL. On a cached visit, it can return the existing copy immediately and check the published hash in the background. Without a cached copy, loading must obtain network data.

**Implication:** a returning user may temporarily see an older catalogue during revalidation. IndexedDB resilience does not guarantee immediate UI freshness or a successful first-time offline load. This browser-local cache is distinct from the backend's PostgreSQL snapshot storage.

## 4. Study groups and teaching events: a separate runtime path

**Upstream:** SISU Kori. **Adapter:** `sisu-wrapper`. **Consumer:** frontend study-group cache and teaching/calendar functionality.

Teaching arrangements are fetched on demand, independently of canonical catalogue ingestion and snapshot augmentation. The frontend selects the relevant **course unit and offering** and uses `StudyGroupService.ts` to fetch normalized study-group data through the wrapper (including the study-group route `/api/courses/{id}/study-groups` and supported batch requests).

The results are associated with the requested course unit/offering and retained in a **separate study-group cache**. Consumers use these groups and their teaching events for detailed course and calendar functionality. They are **not appended to the course catalogue**, and failed study-group retrieval does not change GCS datasets.

The cache tracks more than the presence of a value: it can distinguish missing, loading, ready, and failed data, including refresh states that retain previously loaded groups if refresh fails. This is a separate lifecycle from loading the active or historical course indexes.

For full-data cache ownership, loader and coordinator boundaries, state transitions, notifications, and invalidation, see [Study-group Data Management](../../architecture/study-group-loading/). See also [SISU Wrapper API](../api/) and [Study-event and Location Contract](../study-event-contract/) for the transport interfaces and normalized event model.

## 5. Curriculum and organization metadata

**Owner:** curated Sisukas frontend data, principally YAML under `frontend/course-browser/src/data/` and the review catalogue.

Curriculum membership, programme modules, requirements, and organization metadata are maintained independently of fetched course realisations. Frontend loaders such as `CurriculumLoader.ts` and `OrganizationLoader.ts` make this metadata available to curriculum-aware views and planning functionality.

Metadata is **combined at the point of use**, not inserted into the historical snapshot merge. A valid curriculum reference may identify a historical-only course or a course missing from the current published dataset, and should not be silently removed for that reason.

See [Curriculum Metadata](../curriculum-metadata/) for sources, verification, and maintenance rules.

## Data ownership and failure boundaries

| Boundary | Responsibility | Failure or stale-data behavior |
| --- | --- | --- |
| Aalto Course API | Official catalogue source | Fetch can fail without replacing the last valid published catalogue. |
| GitHub Actions validation/reconciliation | Prepare authoritative publications | Invalid output or unsafe transitions block publication. |
| GCS | Published canonical catalogues | Fresh downloads may fail; an existing IndexedDB copy may remain available. |
| SISU Kori / `sisu-wrapper` | On-demand course and teaching details | Runtime details or resolution may fail independently of canonical browsing. |
| Backend / PostgreSQL | Temporary course snapshots | Recovery and snapshot fetch may fail without changing the GCS catalogues. |
| IndexedDB | Browser-local canonical file cache | Cached files may be stale; first-time load needs the network. |
| Study-group cache | Course-unit/offering teaching state | A failed refresh can leave previously loaded groups available. |
| Curated curriculum YAML | Curriculum and organization structure | Incorrect references affect curriculum-aware features, not canonical publication. |

## Architectural constraints and implementation notes

- **Canonical publication is gated.** A raw response or temporary snapshot cannot bypass validation and become canonical by itself.
- **Historical discovery is not routine archiving.** Historical crawl output requires its own maintenance and validation steps.
- **Runtime snapshot augmentation is best-effort.** It must not be mistaken for updating canonical history.
- **The backend's current resolution window is fixed:** `2022-09-01` through `2025-12-31`. This limitation warrants separate review.
- **Delayed canonical promotion is not implemented** merely because it is discussed in backfill documentation.

### When changing a data contract

Review **all** affected boundaries: upstream fetch/normalization, validators, reconciliation/history maintenance, published artifact formats and hashes, `CourseParser.ts`, snapshot normalization, frontend indexing, study-group normalization, and curriculum reference validation. A contract change in one system does not automatically update the others.

### Implementation entry points

| Concern | Relevant entry points |
| --- | --- |
| Scheduled publishing | `.github/workflows/check_course_updates.yml` (operational detail in [Data Pipeline](../data-pipeline/)) |
| Runtime adapter | `sisu-wrapper/api/routers/courses.py` |
| Snapshot API/persistence | `backend/src/routes/courseSnapshots.ts`, `backend/src/services/CourseSnapshotsService.ts` |
| Canonical loading and caching | `RemoteCourseLoader.ts`, `LargeFileCache.ts` |
| Parsing and browser composition | `CourseParser.ts`, `courseIndexStore.svelte.ts`, `SnapshotHistoricalMerge.ts` |
| Study groups | `StudyGroupCache.ts`, `StudyGroupCacheLoader.ts`, `StudyGroupRequestCoordinator.ts`, `StudyGroupService.ts` (new application pipeline; production integration pending) |
| Curated metadata | `CurriculumLoader.ts`, `OrganizationLoader.ts` |

Frontend filenames above refer to components within `frontend/course-browser/src/`.

## Related documentation

- [Data Pipeline](../data-pipeline/) — Exact scheduled workflow, safeguards, publication, and recovery.
- [Historical Course Records](../historical/) — Historical discovery and maintenance.
- [SISU Wrapper API](../api/) — Runtime adapter interfaces.
- [Study-event and Location Contract](../study-event-contract/) — Teaching events and locations.
- [Curriculum Metadata](../curriculum-metadata/) — Curated metadata maintenance.
- [Runtime Course Recovery and Backfill](../../under-dev/snapshot-backfill/) — Implemented snapshots and proposed promotion.
- [Cross-institutional Course Discovery](../../under-dev/cross-institutional-courses/) — Verified Kori discovery and proposed external course-unit boundary.
