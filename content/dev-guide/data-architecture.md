---
weight: 2
title: "Course Data Architecture"
description: "End-to-end overview of course ingestion, historical data, runtime resolution, caching, and their ownership boundaries."
---
> [!NOTE]
> This page connects the scheduled course-catalogue workflow with independent runtime and frontend paths. For operational commands and publication safeguards, see [Data Pipeline](../data-pipeline/).

## Why several data flows exist

Sisukas cannot rely on a single live upstream endpoint for every course view. Discovery needs a stable, validated catalogue; planning needs current teaching details; earlier study periods need records that may disappear upstream; and an imported plan may refer to courses absent from either published catalogue.

The system therefore separates canonical published course datasets, runtime study details, and noncanonical runtime snapshots. These paths have different refresh, validation, and persistence rules.

## End-to-end map

![Verified Sisukas course data architecture, showing separate scheduled, runtime, and frontend data paths](/images/course-data-architecture.png)

The diagram separates scheduled catalogue publication from independent runtime requests. Runtime snapshots can supplement the historical view, but they are not automatically promoted into the published `historical.json`. Delayed candidate processing is a proposal, not part of the deployed publication job.

## 1. Canonical catalogue: scheduled production

**Source:** authenticated Aalto Course API. **Orchestrator:** `.github/workflows/check_course_updates.yml`.

The workflow fetches realisations (`scripts/fetch_latest_courses.py`), normalizes them (`scripts/transform_courses.py`), validates the normalized contract, and reconciles the latest response against the previously published active catalogue (`scripts/reconcile_active_courses.py`). The latest upstream response is **not** blindly substituted for the active dataset.

Reconciliation creates the next active dataset plus archive candidates. A safeguard blocks unusually large archive transitions unless the manual override provides the exact reviewed candidate count. When removals or reactivations occur, `scripts/merge_expired_into_historical.py` updates the historical dataset. The workflow validates the output and checks active/historical disjointness before publication.

The `prepare_data` job runs before `upload_to_gcs`. GitHub Actions uses workload identity to publish `courses.json`, `historical.json`, hash files, and change logs to environment-specific GCS buckets. Historical objects and their hashes are only published when historical content changes.

**Source of truth:** published GCS catalogues, not the raw response, the frontend cache, or a runtime snapshot. For exact commands, authentication, schedules, and recovery safeguards, read [Data Pipeline](../data-pipeline/).

## 2. Historical discovery and maintenance

The historical crawl uses SISU Kori relationships to discover older course-unit realisation identifiers and the Aalto Course API to retrieve corresponding payloads. It supports checkpointed JSONL collection, deduplication by realisation identifier, and normalization before historical records are considered for catalogue maintenance.

This discovery path differs from routine archiving: reconciliation preserves instances that leave the active catalogue, whereas a historical crawl can discover earlier instances never present in the previous active baseline. Neither raw crawl output nor a runtime snapshot is automatically a validated canonical record.

See [Historical Course Records](../../under-dev/historical/) for the documented crawl procedure. Its date defaults and commands should be verified before use.

## 3. Runtime study details

The `sisu-wrapper` calls SISU Kori endpoints for course details, study groups, events, and locations on demand. These records serve operational scheduling needs; they are not produced by `courses.json` ingestion. Changes or failures in SISU Kori can therefore affect detailed teaching views independently of the last valid published catalogue.

See [API](../api/) and [Study Event Contract](../study-event-contract/) for the relevant interfaces.

## 4. Browser distribution and caching

`RemoteCourseLoader.ts` loads `courses.json` and `historical.json` from the configured `VITE_GCS_BUCKET` URLs. `LargeFileCache.ts` stores files in IndexedDB, keyed by their data URLs. It returns existing cached content immediately and checks the published hash in the background; without a cached copy, loading must obtain network data.

`CourseParser.ts` validates individual records and skips invalid entries. `courseIndexStore.svelte.ts` builds indexes by instance identifier and course code. It supports an active-only view and a combined active/historical view, with active instances preferred when identifiers overlap.

**Operational implication:** a cached visit can show an older catalogue during background revalidation. Cache resilience is not a guarantee of an immediately refreshed UI or a successful first-time offline load.

> [!IMPORTANT]
> Runtime PostgreSQL snapshots are **not** automatically published into the canonical historical dataset.

## 5. Missing-course recovery: runtime snapshots

A missing course code can be resolved through the backend `POST /api/course-snapshots/resolve`, which calls the wrapper's `/api/courses/resolve`. `CourseSnapshotsService.ts` stores eligible returned matches in PostgreSQL, keyed for upsert by course code and realisation identifier, with an expiry policy (currently 180 days for this route).

The frontend loads live snapshots through the backend snapshot endpoint and `SnapshotHistoricalMerge.ts`, normalizes supported payloads into the same course parser contract, and appends them to the historical index after the base historical catalogue has loaded. Snapshot merging is best-effort; the canonical historical dataset remains required for a successful historical bootstrap.

**Important distinction:** storing and displaying a snapshot does not publish it to GCS and does not make it canonical. The current backend route passes a fixed resolution window (`2022-09-01` to `2025-12-31`), which should be reviewed as a separate implementation task.

The existing [Course Backfill](../../under-dev/snapshot-backfill/) page mixes implemented runtime behavior with a proposed delayed canonical backfill pipeline. Do not treat that delayed promotion workflow as deployed without implementation evidence.

## 6. Curriculum metadata is curated independently

Curriculum membership and module metadata are maintained separately from fetched course realisations, principally in `frontend/course-browser/src/data/` YAML and the review catalogue. A valid curriculum reference may be historical-only or missing from a particular published course dataset; it should not be silently deleted solely on that basis.

See [Curriculum Metadata](../curriculum-metadata/).

## Data ownership and failure boundaries

| Layer | Ownership | Effect of failure or stale data |
| --- | --- | --- |
| Aalto Course API | Upstream, externally controlled | Scheduled ingestion can fail; safeguards should preserve previously valid published data. |
| Validation and reconciliation | Sisukas pipeline | Publication must stop on invalid datasets or unsafe archive transitions. |
| Published GCS catalogues | Sisukas canonical publication | Browser cannot obtain fresh catalogue; existing IndexedDB may continue to serve cached data. |
| SISU Kori and wrapper | External data + Sisukas adapter | On-demand study details or missing-course resolution may be unavailable independently of browsing. |
| PostgreSQL snapshots | Sisukas backend | Previously published catalogues remain distinct; live snapshot recovery/merge may fail. |
| IndexedDB | User browser | Cache can be stale; first load requires network access. |
| Curriculum YAML | Manually curated Sisukas metadata | Incorrect/missing membership impacts filtering rather than automatically modifying course catalogues. |

## When changing the data contract

Review **all** affected boundaries: upstream fetch and normalization, validators, reconciliation/history merge, published artifact format and hashes, `CourseParser.ts`, snapshot normalization, frontend indexing, and curriculum reference validation. Do not assume a change in one pipeline automatically updates the others.

## Implementation entry points

- `.github/workflows/check_course_updates.yml`
- `scripts/fetch_latest_courses.py`, `scripts/transform_courses.py`, `scripts/reconcile_active_courses.py`, `scripts/merge_expired_into_historical.py`
- `sisu-wrapper/api/routers/courses.py`
- `backend/src/routes/courseSnapshots.ts`, `backend/src/services/CourseSnapshotsService.ts`
- `frontend/course-browser/src/infrastructure/loaders/RemoteCourseLoader.ts`, `SnapshotHistoricalMerge.ts`
- `frontend/course-browser/src/infrastructure/services/LargeFileCache.ts`
- `frontend/course-browser/src/lib/stores/courseIndexStore.svelte.ts`
- `frontend/course-browser/src/domain/parsers/CourseParser.ts`

## Related documentation

- [Data Pipeline](../data-pipeline/) — Scheduled publication workflow.
- [Historical Course Records](../../under-dev/historical/) — Manual historical discovery.
- [Runtime Course Recovery and Backfill](../../under-dev/snapshot-backfill/) — Snapshots and proposed promotion.
