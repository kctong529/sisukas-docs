---
weight: 2
title: "Transcript Import"
description: "How Sisukas imports transcript-derived favourites, plan instances, and grades in one transactional operation."
---

> [!NOTE]
> This page documents the transcript import pipeline: how parsed transcript rows are turned into a single bulk request, and how the backend applies the changes atomically.

The design is optimized for:

* single-request import (no per-row API spam)
* transactional consistency (all-or-nothing)
* idempotency (safe to retry)
* clear separation of responsibilities (frontend intent, backend authority)

## Overview

Transcript import is a bulk operation that updates three user-facing areas:

1. **Favourites**: ensure course codes are favourited
2. **Plan instances**: add or replace course instances in the active plan
3. **Grades**: upsert numeric grades (0–5) per course unit

The frontend resolves transcript rows to concrete course instances (by date), computes deltas, and sends a single request. The backend validates plan ownership and applies all writes inside one database transaction.

## Why bulk import

> [!TIP]
> The main goal is to avoid ending up with a half-imported state when importing many transcript rows.

A per-row approach would:

* make dozens of network requests
* be slow on high latency links
* produce inconsistent intermediate UI states
* be harder to recover from failures

Bulk import keeps the operation fast and consistent: either everything applies, or nothing applies.

> [!NOTE]
> Observed performance impact: on a local machine, importing a real transcript went from ~20 seconds (row-by-row API calls) to ~1 second with the bulk import approach.

## API

### Endpoint

```
POST /api/transcript/import
```

Auth is required (`requireAuth`).

### Request body

```ts
type BulkImportInput = {
  planId: string;
  favouriteCourseIds: string[];
  addInstanceIds: string[];
  removeInstanceIds: string[];
  grades: Array<{ courseUnitId: string; grade: number }>;
};
```

Rules:

* `planId` is required.
* Arrays may be empty.
* Grades must be integers `0..5`.

### Response

```ts
type BulkImportResult = {
  addedFavourites: number;
  removedInstances: number;
  addedInstances: number;
  upsertedGrades: number;
};
```

These counts are authoritative (what the database actually changed).

## Frontend pipeline

### 1. Ensure local baseline state

Before computing deltas, the importer loads missing state once:

* favourites (if empty)
* course grades (if not loaded)
* active plan (ensure one exists)

### 2. Resolve transcript rows

For each transcript row, the importer:

* parses the transcript date
* resolves the best matching course instance by `code` on/before date
* extracts:

  * `instanceId` (for plan instances)
  * `courseUnitId` (for grades)

Rows that cannot be resolved are added to `skipped` with a reason.

### 3. Compute deltas

The importer accumulates bulk operations:

* favourites to add (by course code)
* plan instances to add
* plan instances to remove (replacement)
* grades to upsert (numeric only)

Important detail: replacement is decided client-side.

* If the plan already has the target instance, do nothing.
* If the plan has a different instance for the same course code, remove it and add the target.

The bulk lists are de-duped before sending.

### 4. One backend call + refresh

The importer calls the backend once and then refreshes stores once:

* `favouritesStore.load()`
* `plansStore.load()`
* `courseGradeStore.load()`

A notification summarizes the outcome.

## Backend implementation

### Route

**File:** `backend/src/routes/transcript.ts`

* `POST /import`
* basic validation (`planId` must be a string)
* delegates to `TranscriptService.importTranscriptBulk`

### Service

**File:** `backend/src/services/TranscriptService.ts`

The service:

1. checks plan ownership (`plans.id` + `plans.user_id`)
2. normalizes input (trim strings, de-dupe arrays)
3. filters grades to integers in `0..5`
4. runs all writes in a single transaction

Transactional steps:

1. **Favourites**

   * bulk insert `(user_id, course_id)`
   * `ON CONFLICT DO NOTHING`

2. **Plan instances**

   * bulk delete by `(plan_id, instance_id)`
   * bulk insert-ignore new instances

3. **Course grades**

   * bulk upsert `(user_id, course_unit_id)`
   * updates `grade` and `updated_at`

## Database constraints

### Favourites uniqueness

To guarantee idempotency and avoid duplicate favourites, we enforce:

* unique `(user_id, course_id)`
* index on `user_id`

This matches the backend bulk insert strategy (`ON CONFLICT DO NOTHING`).

## Error handling

Backend responses:

* `400` validation error (missing/invalid `planId`)
* `404` plan not found or not owned by user
* `500` unexpected errors

Frontend behavior:

* shows a single error notification
* does not partially update local state

## Design principles

* backend database is the source of truth
* bulk import is atomic (transaction)
* safe to retry the same import
* frontend decides intent; backend enforces safety + consistency

## Future extensions

* dry-run / preview mode
* configurable replacement strategies (keep vs replace)
* grade mapping options (pass/fail handling)
* transcripts in other languages
