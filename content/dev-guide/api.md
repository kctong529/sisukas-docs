---
weight: 3
title: "API Reference"
description: "SISU Wrapper REST API routes, study groups, and optional location resolution."
---

## SISU Wrapper REST API

The wrapper provides read-only study group and schedule data from Aalto SISU. Run locally at `http://127.0.0.1:8001`; the live OpenAPI schema at `/openapi.json` is authoritative for the deployed version.

### Study groups

`GET /api/courses/study-groups`

| Query parameter | Required | Description |
|---|---|---|
| `course_unit_id` | Yes | SISU course-unit ID |
| `course_offering_id` | Yes | Course-unit realisation ID |
| `resolve_locations` | No | Boolean, defaults to `false`; enable room/building lookup |

```bash
curl -fsSG http://127.0.0.1:8001/api/courses/study-groups \
  --data-urlencode 'course_unit_id=aalto-CU-1151000764-20260801' \
  --data-urlencode 'course_offering_id=aalto-cur-P-c235941a-0fd6-11f1-8c99-0050569455c9' \
  --data-urlencode 'resolve_locations=true'
```

The response has `course_unit_id`, `course_offering_id`, and `study_groups`. Each group's `study_events` contains expanded occurrences, with `start`, `end`, `series_id`, `cancelled`, `excluded`, `notice`, `location_ids`, and `locations` (plus existing ISO fields). With the default `false`, `locations` remains empty, but location IDs are preserved. With `true`, resolved entries include room/building IDs, names, and an address when available. Location lookup failures do not remove study events.

### Batch study groups

`POST /api/courses/batch/study-groups?resolve_locations=true`

```json
{
  "requests": [
    {
      "course_unit_id": "aalto-CU-1151000764-20260801",
      "course_offering_id": "aalto-cur-P-c235941a-0fd6-11f1-8c99-0050569455c9"
    }
  ]
}
```

The flag defaults to `false` for both single and batch requests. See the running service's interactive documentation at `/docs` for the complete batch response structure and other routes.

### Finding identifiers

A course-unit realisation's `studyGroupSets[].studySubGroups[]` includes source `studyEventIds`. Course-unit IDs and offering IDs are also available in the course catalogue. They are different identifiers and must not be interchanged.

### Study-event semantics

Read the **[Study-event and Location Contract](../study-event-contract/)** for verified SISU fields, normalization, timezone assumptions, occurrence identity limitations, and provisional exception behavior. The wrapper's reproducible HTTP probes are in `sisu-wrapper/examples/requests.http` in the [sisukas source repository](https://github.com/kctong529/sisukas).

## SISU Wrapper Python library

Install with `pip install sisu-wrapper` and import `SisuClient` and `SisuService`. Python consumers can call `fetch_study_groups(...)` for unresolved events or `fetch_study_groups_with_locations(...)` for optional enrichment.

```python
from sisu_wrapper import SisuClient, SisuService

with SisuClient() as client:
    service = SisuService(client)
    groups = service.fetch_study_groups_with_locations(
        "aalto-CU-1151000764-20260801",
        "aalto-cur-P-c235941a-0fd6-11f1-8c99-0050569455c9",
    )
```

For setup and architecture, see [Running Sisukas Locally](../running-locally/) and the [Data Pipeline](../data-pipeline/).
