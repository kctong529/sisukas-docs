---
weight: 3
title: "Runtime Course Recovery and Backfill"
description: "Implemented runtime course recovery and the separately proposed canonical historical backfill workflow."
---

> [!NOTE]
> **Implementation status:** Runtime course resolution, PostgreSQL snapshot persistence, and frontend snapshot consumption are implemented. Delayed candidate collection and automatic promotion into the canonical historical catalogue are **proposed**, not an operating scheduled pipeline.

## Why recovery is needed

Some course codes referenced in old curricula, imported transcripts, or saved plans are absent from the published active and historical catalogues. Sisukas can attempt to resolve these missing references on demand rather than treating their absence as a permanent error.

This recovery path supplements, but does not replace, the canonical dataset maintained by the [Data Pipeline](../../dev-guide/data-pipeline/). For the full system diagram, see [Course Data Architecture](../../dev-guide/data-architecture/).

## Implemented: runtime resolution and persistence

1. The backend receives `POST /api/course-snapshots/resolve` with a `courseCode` string.
2. It calls the `sisu-wrapper` endpoint `GET /api/courses/resolve`, passing `course_code` and its configured search window.
3. `CourseSnapshotsService` persists eligible returned course snapshots in PostgreSQL, with `source: user_request` and a 180-day TTL on this route.
4. The backend exposes snapshot status and retrieval endpoints. The frontend can normalize supported snapshots and merge them into its historical course index on a best-effort basis.

Relevant backend routes:

| Request | Purpose |
| --- | --- |
| `GET /api/course-snapshots/status?courseCode=...` | Check whether any or live snapshots exist |
| `GET /api/course-snapshots?courseCode=...` | Return non-expired snapshots for a course code |
| `POST /api/course-snapshots/resolve` | Resolve via wrapper and upsert matching snapshots |
| `GET /api/course-snapshots/all?liveOnly=1` | Enumerate stored snapshots, optionally live only |

The current resolver route passes a fixed window, `2022-09-01` through `2025-12-31`, and `limit_realisations=200`. These are implementation limits to review as course history expands; do not describe them as permanent upstream constraints.

**Data boundary:** Stored snapshots remain noncanonical. They are not published into `historical.json` by the runtime route, and a successful snapshot lookup does not prove that the published historical dataset has been updated.

## Proposed: delayed canonical backfill

The following is a design direction, **not** a description of currently deployed jobs. The aim is to turn successful runtime resolutions into candidate signals that can be reviewed and incorporated into historical maintenance without allowing individual user requests to rewrite the canonical catalogue.

### Candidate collection

A future implementation could record append-only metadata for successful resolutions: course code, match identifiers, confidence, retrieval time, source, and a snapshot hash. One proposed object layout is:

```text
gs://sisukas-backfill-candidates/YYYY/MM/DD.jsonl
```

This path is **illustrative** and should not be treated as an existing bucket or deployed integration.

### Delayed processing

A separately scheduled process could wait a configurable period before processing candidates, aggregate repeated requests, deduplicate matches, and distinguish automatically acceptable records from records requiring review. Its outputs would feed the normal historical validation and publication process, **not** bypass it.

The design should define checkpointing, retention, replay behavior, provenance, and handling of ambiguous or reused course codes before implementation. Candidate demand is evidence that a gap matters, not evidence that a candidate is correct.

## Invariants to preserve

- Runtime recovery does not directly mutate canonical GCS catalogues.
- User-triggered records need clear provenance and expiration.
- Historical publication requires normalization, validation, and reconciliation safeguards.
- Ambiguous resolutions must not silently become canonical course records.

## Implementation entry points

- `backend/src/routes/courseSnapshots.ts`
- `backend/src/services/CourseSnapshotsService.ts`
- `sisu-wrapper/api/routers/courses.py`
- `frontend/course-browser/src/infrastructure/loaders/SnapshotHistoricalMerge.ts`

## Related documentation

- [Course Data Architecture](../../dev-guide/data-architecture/) — Canonical versus runtime data.
- [Historical Course Records](../historical/) — Manual history collection and baseline construction.
