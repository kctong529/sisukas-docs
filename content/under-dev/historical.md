---
weight: 1
title: "Historical Course Records"
description: "How Sisukas builds and maintains a historical course dataset to support the year timeline and tracking past courses."
---

> [!NOTE]
> This describes how we build a historical course realisation dataset (course instances / implementations) from Sisu + Aalto Course API, and how we process it into a frontend-friendly JSON file.

The pipeline is designed to be:

- interruptible (Ctrl+C at any time)
- resumable (continue from last checkpoint)
- append-only (JSONL crawl output)
- dedupable (post-pass by CUR id)
- normalizable (reduce to the same core fields as active `courses.json`)

## Why we keep a historical course record

> [!TIP]
> Originally, Sisukas only needed live Sisu data, since the focus was on discovering and planning upcoming courses. With the introduction of the year timeline, this assumption no longer holds.

Users now want to see and reason about past academic years, including courses they have already taken. However, Sisu’s published APIs are optimized for current and upcoming teaching, and older course implementations gradually disappear from the available endpoints.

The historical course record exists to support this shift. By preserving past course implementations as a stable dataset, Sisukas can display coherent timelines across years, allow users to keep track of completed courses, and provide context about how courses are actually offered over time. Storing this data also keeps the frontend fast and predictable, without relying on fragile or incomplete historical queries against upstream APIs.

## Data sources

### 1) Sisu KORI API (public)

Used to discover historical **course unit realisation ids (CUR ids)**.

* Base: `https://sisu.aalto.fi/kori/api`
* We use:

  * `GET /course-units/{courseUnitId}` to get completion methods → `assessmentItemIds`
  * `GET /course-unit-realisations?assessmentItemId=...` to list realisations (unfiltered, includes older years)

### 2) Aalto Course API (requires key)

Used to fetch the detailed historical payload for each CUR id.

* Base: `https://course.api.aalto.fi/api/sisu/v1`
* We use:

  * `GET /courseunitrealisations/{CUR_ID}?USER_KEY=...`

The API key must be provided via environment variable (see below).

## Output artifacts

We produce three files:

1. **Crawl output (append-only)**
   `historical_realisations.jsonl`
   One JSON object per line (raw historical record).

2. **Deduped crawl output**
   `historical_realisations_deduped.jsonl`
   Same format, but duplicates removed by `id` (CUR id).

3. **Final normalized dataset**
   `historical_courses.json`
   A flat JSON array of reduced course objects (frontend-friendly).

## 0. Prerequisites

Set the Course API key:

```
export AALTO_COURSE_API_KEY="..."
```

Make sure you run from a place where `python -m sisu_wrapper` resolves to the local package.

## 1. Crawl: fetch historical records (resumable)

This step:

* reads `courses.json`
* extracts unique `courseUnitId`s
* for each course unit:

  * fetches course unit metadata (assessment items)
  * fetches all course-unit realisations for those assessment items
  * filters them by date (by start date)
  * fetches full records from Course API by CUR id
* appends each fetched record to JSONL output
* writes a checkpoint after each course unit (or every N course units)

Run:

```
cd sisu-wrapper
python -m sisu_wrapper \
  --courses-json ../courses.json \
  --out ../historical_realisations.jsonl \
  --state ../historical_state.json
```

### Resume after interruption

If you Ctrl+C during the crawl, a checkpoint is written and the program exits cleanly.

Resume:

```
python -m sisu_wrapper \
  --courses-json ../courses.json \
  --out ../historical_realisations.jsonl \
  --state ../historical_state.json \
  --resume
```

### Relevant flags

* `--out`
  JSONL file to append records to.

* `--state`
  Checkpoint state JSON, stores the `next_index` to resume from.

* `--resume`
  Uses `next_index` from `--state` if available.

* `--start-index N`
  Override resume state and start from a specific 0-based courseUnitId index.

* `--from-date YYYY-MM-DD` / `--to-date YYYY-MM-DD`
  Date filter for realisations (based on the realisation start date).
  Default range is configured in `__main__.py` (currently ends at 2025-12-31).

### Notes on 404s (expected)

Some CUR ids returned from Sisu discovery may not exist in the Course API. You may see errors like:

* `404 Client Error: Not Found for url: ... /courseunitrealisations/{CUR}`

These are expected and are skipped (we continue crawling).

## 2. Deduplicate JSONL output

Because the crawl is resumable and the output is append-only, resuming may cause some duplicates. Deduping is done by the record `id` (CUR id).

Run:

```
python scripts/dedupe_jsonl.py \
  ../historical_realisations.jsonl \
  ../historical_realisations_deduped.jsonl
```

This keeps the **first occurrence** of each CUR id and discards the rest.

## 3. Normalize to frontend format (flat list)

The deduped JSONL is still “raw-ish”. We normalize it to match the minimal schema we use for active course objects.

Recommended output: a **flat JSON array** (not keyed/mapped).

Example schema (subset):

* `id`, `code`, `startDate`, `endDate`, `type`
* `name`
* `summary.prerequisites`, `summary.level`
* `organizationName`, `credits`, `courseUnitId`
* `languageOfInstructionCodes`, `teachers`
* `enrolmentStartDate`, `enrolmentEndDate`

Run your normalizer (or the flat transformer) to produce:

```
python scripts/transform_historical_flat.py \
  ../historical_realisations_deduped.jsonl \
  ../historical_courses.json \
  --from 2022-09-01 --to 2025-12-31
```

(If your transformer expects JSON rather than JSONL, either adapt it to read JSONL or convert JSONL → list first.)

### Why a flat list?

* simpler frontend store shape (`HistoricalCoursesStore: Course[]`)
* easy to filter/sort/search
* cheap to stream or chunk later

## Suggested operational workflow

For a full rebuild:

```
# 1) Crawl (can be interrupted/resumed)
python -m sisu_wrapper --courses-json ../courses.json --out ../historical_realisations.jsonl --state ../historical_state.json

# 2) Deduplicate
python scripts/dedupe_jsonl.py ../historical_realisations.jsonl ../historical_realisations_deduped.jsonl

# 3) Normalize
python scripts/transform_historical_flat.py ../historical_realisations_deduped.jsonl ../historical_courses.json --from 2022-09-01 --to 2025-12-31
```

For incremental runs (when tweaking logic), keep the JSONL + dedupe pattern—don’t try to rebuild one giant JSON in-memory during crawl.

## Debugging tips

* Test on a small slice first:

  * use `--limit-course-units 20` (if supported)
  * or `--start-index` with a short range
* If you’re seeing rate limits / slowdowns:

  * increase timeouts
  * consider adding a small sleep or backoff
  * later improvement: parallelize Course API fetches with a small thread pool + max concurrency cap
