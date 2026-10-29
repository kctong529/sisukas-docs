---
weight: 2
title: "Data Pipeline"
description: "How Sisukas ingests, reconciles, and publishes active and historical course catalogues."
---

> [!NOTE]
> This page is part of the Developer Guide. It documents how course data is
> produced, validated, and distributed to runtime systems.

## Overview

Sisukas uses two upstream interfaces for different kinds of course data:

| Source | Purpose | Access pattern |
| --- | --- | --- |
| [Aalto Course API (SISU)](https://3scale.apps.ocp4.aalto.fi/docs/swagger/open_courses_sisu) | Course offering metadata for browsing and filtering | Authenticated, scheduled ingestion into Google Cloud Storage (GCS) |
| [SISU Kori API](https://sisu.helsinki.fi/kori/docs/index.html) | Course details, study groups, teaching events, and locations | On-demand requests through `sisu-wrapper` |

This page covers the scheduled Course API ingestion and publication workflow, not the entire end-to-end data architecture. For how the canonical catalogues connect to historical discovery, runtime SISU requests, backend snapshots, curriculum metadata, and IndexedDB caching, see [Course Data Architecture](../data-architecture/). The upstream term *course unit realisation* (or *offering*) corresponds to a course *instance* in Sisukas.

## API Access and Authentication

The metadata pipeline uses Aalto University's authenticated [Course API (SISU)](https://3scale.apps.ocp4.aalto.fi/docs/swagger/open_courses_sisu), managed through the [Aalto API Gateway](https://3scale.apps.ocp4.aalto.fi/).

The API key is supplied through the `AALTO_USER_KEY` environment variable, stored as a GitHub Actions secret. Credentials must never be committed to the repository.

> [!IMPORTANT]
> Aalto IT confirmed on 28 October 2026 that:
> - Existing active integrations, including Sisukas, may continue operating.
> - API keys can be rotated for existing applications.
> - New developers requiring API access should contact **it-integ@aalto.fi** for approval.
> 
> Aalto plans to redesign its API management gateway over approximately seven months and will contact existing users about the transition.

This confirmation concerns the Course API application in 3scale; it does not establish a policy for the separate SISU Kori API.

## Ingestion and publication

**Workflow:** `.github/workflows/check_course_updates.yml`

**Triggers:** daily at 06:00 UTC; manual `workflow_dispatch`; pushes to `main` or `dev`.

1. **Load baselines**  
   Download and validate existing `courses.json` and `historical.json` from the selected GCS bucket. Both are required for normal operation; first-time bootstrap is a separate procedure.

2. **Fetch and transform**  
   `scripts/fetch_latest_courses.py` requests realisations with `startTimeAfter=2024-01-01` and writes `latest_fetch.json`. `scripts/transform_courses.py` produces `latest.json`, retaining fields needed for course discovery (e.g., identifiers, names, dates, credits, organisations, instructors, language, and enrolment dates).

3. **Validate and reconcile**  
   Validate `latest.json`, then use `scripts/reconcile_active_courses.py` to compare it with the previous active catalogue. The reconciliation produces the next active catalogue, archive candidates, and carried-forward records. An unexpectedly large archive transition (over 20% of the previous active catalogue) is blocked unless explicitly approved in a manual run with the exact reviewed candidate count.

4. **Detect changes**  
   `scripts/report_course_changes.py` reports added, removed, and updated records. `scripts/report_reactivated.py` checks whether records from the historical catalogue have become active again.

5. **Update history when needed**  
   When removals or reactivations occur, `scripts/merge_expired_into_historical.py` produces the next historical catalogue. Validate the result and enforce disjointness between active and historical datasets.

6. **Publish changed data**  
   Generate hashes, gzip JSON, and upload artifacts to GCS only when active or historical content requires publication. Historical files are uploaded only when the historical catalogue changes. Change logs are uploaded when present.

The workflow separates `prepare_data` (ingestion, validation, reconciliation) from `upload_to_gcs` (publication). GCS authentication uses GitHub's Workload Identity Federation.

### Published files

| File | Purpose |
| --- | --- |
| `courses.json` | Active course catalogue; stored with gzip content encoding |
| `historical.json` | Historical course catalogue; stored with gzip content encoding |
| `courses.hash.json` | Uncached active-catalogue change indicator |
| `historical.hash.json` | Uncached historical-catalogue change indicator |
| `logs/course_changes_*.json` | Change reports |

`main` publishes to `gs://sisukas-core`; `dev` publishes to `gs://sisukas-core-test`. The frontend selects the corresponding GCS base URL through `VITE_GCS_BUCKET`, checks the hash metadata, and caches downloaded course data in IndexedDB for offline use. This separation prevents ordinary page loads from depending on the upstream Course API.

## Local development

Run commands from the repository root unless otherwise indicated.

```bash
# Requires an approved API key; do not commit or share it.
export AALTO_USER_KEY="your_api_key"
python scripts/fetch_latest_courses.py
python scripts/transform_courses.py latest_fetch.json latest.json
python scripts/validate_course_catalog.py latest.json
```

To exercise reconciliation, use existing, valid active and historical baselines rather than treating the latest response as a complete replacement:

```bash
python scripts/reconcile_active_courses.py \
  --previous courses.json --latest latest.json \
  --active-out artifacts/courses.next.json \
  --archive-out artifacts/archive_candidates.json \
  --retained-out artifacts/carried_forward.json \
  --max-archive-fraction 0.20
python scripts/validate_course_catalog.py artifacts/courses.next.json
python scripts/report_course_changes.py \
  --old courses.json --new artifacts/courses.next.json
```

Create `artifacts/` first if running these commands outside the workflow. The command above does not publish anything; the GitHub Actions workflow contains the full historical merge and publication steps.

For frontend development:

```bash
cd frontend/course-browser
npm run dev
```

Use `VITE_GCS_BUCKET` to change the catalogue source (for example, `https://storage.googleapis.com/sisukas-core-test`). If the source is unavailable, an existing IndexedDB cache can support offline browsing. For isolated tests, mock the cache/data-fetching boundary rather than using production credentials.

## Monitoring and recovery

Check the **Check Course Updates** workflow in GitHub Actions and the change logs under the bucket's `logs/` prefix.

| Symptom | Check |
| --- | --- |
| Missing `AALTO_USER_KEY` | GitHub Actions secret or local environment |
| 401/403 or unexpected API access failure | Credential validity, 3scale application status, and Aalto IT (`it-integ@aalto.fi`) |
| Empty or sharply reduced upstream response | Upstream availability/schema changes; inspect reconciliation and archive safeguards before publishing |
| Missing baseline catalogue | Confirm bucket selection and published files; normal runs require both active and historical baselines |
| GCS upload failure | Workload Identity Federation configuration, write permissions, and bucket availability |

Do not bypass catalogue validation or the archive threshold merely to restore a failing workflow. An upstream failure should not overwrite the last valid published catalogue.

## Extending the pipeline

When changing the ingested schema, update the relevant fetch/transform scripts, validators, reconciliation behavior, and change-report fields together. Test against representative active and historical baselines, then run the workflow on `dev` before publishing to `main`. When introducing another upstream interface, assess its access requirements and caching behavior independently of the Course API.

## References

- [Aalto Course API documentation](https://3scale.apps.ocp4.aalto.fi/docs/swagger/open_courses_sisu)
- [Aalto API Gateway](https://3scale.apps.ocp4.aalto.fi/)
- [GitHub Actions documentation](https://docs.github.com/en/actions)
