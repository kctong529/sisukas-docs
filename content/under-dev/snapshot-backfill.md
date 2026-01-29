---
weight: 3
title: "Course Backfill"
description: "How Sisukas resolves missing courses at runtime and feeds a delayed pipeline for historical data maintenance."
---

> [!NOTE]
> This page documents the on-demand course snapshot backfill flow: how missing courses are resolved at runtime, how snapshots are used immediately in the UI, and how backfill candidates are collected and processed by a delayed pipeline workflow.
>
> User-triggered snapshots are never canonical by default.

## Problem statement

Some courses referenced by students are missing from Sisukas because they are:

* no longer present in the active Sisu course catalog, and
* not included in the prebuilt historical dataset used by Sisukas.

These are typically older or retired courses whose course codes still appear in:

* degree requirements,
* archived study guides,
* student plans imported from transcripts.

> [!IMPORTANT]
> Course unit IDs are not stable over time, while course codes are user-facing and long-lived.
> A missing course is therefore treated as a data gap, not an error.

## Design goals

The snapshot backfill mechanism is designed to:

* allow users to recover missing courses immediately
* avoid polluting canonical course datasets
* keep ingestion deterministic and replayable
* maintain a strict separation between signal and source of truth

## High-level architecture

1. **Runtime resolution**  
   Missing courses are resolved via `sisu-wrapper` and stored as snapshots.

2. **Candidate logging**  
   Each successful resolution emits a backfill candidate record.

3. **Delayed pipeline workflow**  
   Candidates are processed after a fixed time window and fed into historical data maintenance.

## sisu-wrapper: course resolution endpoint

Sisukas relies on a dedicated resolver endpoint to fetch archived or inactive course metadata.

### Endpoint

```
GET /v1/courses/resolve
```

### Parameters

* `course_code` (required)
  User-facing course code (e.g. `CS-A1140`).

* `lang` (optional)
  Preferred language for display fields. All available language variants are still returned.

### Resolution outcomes

The resolver returns a status, not just raw data:

* `active` – course exists in the active catalog
* `historical` – course exists in the historical dataset
* `archived` – course found via broader or archival resolution
* `ambiguous` – multiple plausible matches (e.g. reused codes)
* `not_found` – no matching course could be resolved

Each response includes:

* resolution status and confidence
* one or more candidate matches
* provenance (source endpoints, retrieval time)
* raw payload for audit and debugging

> [!IMPORTANT]
> The resolver does not decide whether a course is canonical.
> It only reports what can be resolved and with what confidence.

## Snapshot storage in Sisukas

Resolved courses are stored as snapshots, not as canonical course units.

Snapshots are written to a dedicated store (for example `course_snapshots`) containing:

* requested `course_code`
* resolution `status` and `confidence`
* full snapshot payload
* fetch timestamp
* expiration timestamp (TTL)
* request counters

This ensures:

* snapshots remain clearly distinguishable from curated data
* outdated or incorrect data expires automatically
* repeated requests for the same course are coalesced

## UI behavior

### Missing course state

When a course code is not found in canonical datasets, the UI shows:

* a clear “course not in catalog” message
* a primary action to fetch archived snapshot

Missing data is treated as a recoverable state, not a failure.

### Snapshot-backed course pages

If a snapshot exists:

* the course page is rendered from snapshot data
* a visible badge indicates the course is archived / snapshot-based
* features requiring realisations or scheduling data may be disabled

Snapshots remain usable for:

* favourites
* plan inclusion
* transcript-derived references

### Ambiguous resolution

If the resolver returns multiple matches:

* the user is prompted to select the correct version
* options are differentiated by:

  * validity period
  * name
  * credits (if available)

The selected match is persisted to keep subsequent visits stable.

## Expiration and refresh

Snapshots are temporary by design.

* archived or historical snapshots use a longer TTL
* `not_found` results may use a short TTL to avoid repeated lookups
* expired snapshots are re-fetched on demand

This prevents the snapshot store from becoming a second historical database.

## Backfill candidate logging

When Sisukas successfully resolves a snapshot (status not `not_found`), it emits a backfill candidate record.

Candidate records are:

* append-only
* lightweight (metadata only)
* time-partitioned

> [!NOTE]
> These records are signals, not authoritative data.
> Canonical datasets are updated only via a separate maintenance pipeline.

## Backfill candidate storage layout

Candidates are written to Google Cloud Storage as daily JSONL files:

```
gs://sisukas-backfill-candidates/YYYY/MM/DD.jsonl
```

Each line represents a single resolution event:

```json
{
  "requested_at": "2026-01-29T00:41:12Z",
  "course_code": "CS-A1140",
  "resolver_status": "archived",
  "resolver_confidence": "high",
  "course_unit_ids": ["aalto-CUR-209198-3124630"],
  "snapshot_hash": "sha256:...",
  "sisukas_version": "0.9.3",
  "source": "user-triggered"
}
```

Files are append-only and never modified after the day closes.

## Time windowing and sliding

The backfill pipeline operates on fixed time windows, not individual events.

### Write window

* candidates are written during a fixed window (e.g. one calendar day)
* files are open for appends only

### Processing delay (X)

* files are not processed immediately
* a fixed delay `X` (e.g. 24–48 hours) is applied to:

  * absorb duplicates
  * avoid race conditions
  * allow safe replays

### Processing window

At `now ≥ file_date + X`, files become eligible for processing.

This behaves like a sliding window:

* recent files are writable
* older files are immutable and queued
* processed files roll out of the active window

## Pipeline workflow

A scheduled pipeline (CI/CD or batch job) performs the following steps.

### 1. File discovery

* list candidate files in the bucket
* select files older than `X`
* skip files already processed

### 2. Deduplication and aggregation

Across the selected window:

* deduplicate by `(course_code, course_unit_id)`
* count occurrences to measure demand
* prefer the most recent snapshot hash

This converts noisy user requests into stable candidates.

### 3. Classification

Candidates are classified into two buckets:

Auto-acceptable

* high resolver confidence
* single unambiguous unit ID
* consistent metadata

Review-required

* ambiguous resolution
* reused course codes
* conflicting metadata

### 4. Output artifacts

The pipeline produces:

* an accepted list for the next historical build
* a review list for manual inspection
* metrics (volume, popularity, failure rates)

Canonical datasets are updated only through this controlled process.

### 5. Post-processing

After successful processing, files are:

* moved to `gs://sisukas-backfill-processed/`, or
* deleted after a retention period

The system remains replayable and auditable.

## Guarantees and invariants

> [!TIP]
>
> * Runtime requests never mutate canonical datasets
> * All pipeline inputs are append-only and time-partitioned
> * Historical builds are reproducible
> * User-triggered data is treated as signal, not truth

## Why this design

This design:

* keeps the product responsive
* keeps data ingestion boring and deterministic
* avoids accidental semantic drift
* scales naturally with usage

Most importantly, it ensures **v1 stability** even as historical gaps are discovered organically.
