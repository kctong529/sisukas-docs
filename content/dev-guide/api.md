---
weight: 3
title: "API Reference"
description: "Reference for Sisukas APIs, including the SISU wrapper endpoints and how to find course and offering IDs."
---

## Sisu Wrapper REST API

Exposes study group and schedule data from Aalto's Sisu system via HTTP.

**Note:** This is a REST wrapper around the sisu-wrapper Python library. For 
programmatic access in Python, use the library directly:
```sh
pip install sisu-wrapper
```

### Endpoints

#### GET /study-groups

Returns all study groups for a course offering.

**Parameters:**
- `course_unit_id` (string) — Course unit ID (e.g. "aalto-OPINKOHD-1125839311-20210801")
- `offering_id` (string) — Course offering/realisation ID (e.g. "aalto-CUR-206690-3122470")

**Response:**
```json
[
  {
    "group_id": "H01",
    "name": "Exercise Group 1",
    "type": "Exercise",
    "study_events": [
      {
        "start": "2026-02-24T12:15:00+02:00",
        "end": "2026-02-24T14:00:00+02:00"
      }
    ]
  }
]
```

**Example:**
```bash
curl "http://127.0.0.1:8001/study-groups?course_unit_id=aalto-OPINKOHD-1125839311-20210801&offering_id=aalto-CUR-206690-3122470"
```

#### GET /course-offering

Returns complete course offering data including all study groups.

**Parameters:**
- `course_unit_id` (string)
- `offering_id` (string)

**Response:**
```json
{
  "course_unit_id": "aalto-OPINKOHD-1125839311-20210801",
  "offering_id": "aalto-CUR-206690-3122470",
  "name": "Programming 1",
  "study_groups": [...]
}
```

### Finding IDs

Course unit IDs and offering IDs are available in `courses.json`:
```json
{
  "courseUnitId": "aalto-OPINKOHD-1125839311-20210801",
  "id": "aalto-CUR-206690-3122470",
  ...
}
```

### Status

Currently used by the frontend to display study group details. The REST API is 
integrated into the application but not yet widely documented.

**Interactive docs:** [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs) (when running locally)

---

## Sisu Wrapper Python Library

Programmatic access to Sisu data in Python.

**Installation:**
```sh
pip install sisu-wrapper
```

**Documentation:** See the [sisu-wrapper GitHub repository](https://github.com/kctong529/sisukas/tree/main/sisu-wrapper)

**Quick example:**
```python
from sisu_wrapper import SisuClient, SisuService

with SisuClient() as client:
    service = SisuService(client)
    offering = service.fetch_course_offering(
        course_unit_id="aalto-OPINKOHD-1125839311-20210801",
        offering_id="aalto-CUR-206690-3122470"
    )
    print(f"Course: {offering.name}")
    print(f"Study groups: {len(offering.study_groups)}")
```

The library provides:
- Type-safe data models
- Connection pooling
- Comprehensive error handling
- Context manager support

For full documentation, see [sisu-wrapper README](https://github.com/kctong529/sisukas/blob/main/sisu-wrapper/README.md).

## Want to understand the bigger picture?
- **[Getting Started](../../getting-started/#running-backend-services)** – Using these services
- **[Architecture](../../architecture/)** – How APIs fit into the system
- **[Data Pipeline](../data-pipeline/)** – Course data source
