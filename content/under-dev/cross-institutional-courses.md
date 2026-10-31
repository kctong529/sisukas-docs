---
weight: 5
title: "Cross-institutional Course Discovery"
description: "Verified SISU Kori discovery behavior, course-unit boundaries, and the proposed Sisukas integration."
---

> [!NOTE]
> **Investigation completed 31 October 2026; implementation proposed.** The endpoints below were verified in a logged-in Aalto Sisu browser session, not as a production Sisukas ingestion job. The existing Aalto course catalogues, browser, and study calendar do not automatically include these external course units. See [issue #126](https://github.com/kctong529/sisukas/issues/126) for the investigation record.

## Why external course units need a separate path

The scheduled [Data Pipeline](../../dev-guide/data-pipeline/) fetches Aalto course-unit realisations from the authenticated Aalto Course API and publishes normalized, dated course instances to `courses.json` and `historical.json`. The current record contract (`scripts/course_catalog.schema.json`) requires instance and course-unit IDs, start and end dates, and other normalized offering fields. It is not a generic catalogue of course units.

Aalto Sisu's cross-institutional search also exposes courses provided by other institutions. Some have no curriculum-period IDs, have no activity period in the search result, or lack a published realisation. Publishing such units as dated instances would either reject useful courses or invent data. The proposed extension therefore distinguishes course-unit discovery from dated offering normalization.

## Verified Kori discovery

The following requests returned HTTP 200 from `https://sisu.aalto.fi/kori/api/` on 31 October 2026:

```http
GET /kori/api/cooperation-networks/by-university-org-id/aalto-university-root-id
GET /kori/api/course-unit-search?limit=20&start=0&uiLang=en&cooperationNetworkId={sisu-network-id}&cooperationNetworkIdsForUniversityOrgId=aalto-university-root-id&excludeUniversityOrgId=aalto-university-root-id&validity=ONGOING_AND_FUTURE
GET /kori/api/course-units/{course-unit-id}
GET /kori/api/assessment-items/{assessment-item-id}
GET /kori/api/course-unit-realisations/published?assessmentItemId={assessment-item-id}
```

The network endpoint returned 43 Aalto-associated cooperation networks with names, membership records, and validity intervals. Each record has both `id` and `networkId`; the course-search filter expects the Sisu `id` (for example, `otm-26d38c04-1fb4-3683-aff3-5d36659529e7`), not `networkId`.

| Network | Reported course units | Verified result retrieval |
| --- | ---: | --- |
| Software Security | 3 | 3 records on the first page |
| Advanced courses in mathematics and statistics | 210 | 20 records each at offsets 0, 20, and 40; all 60 IDs distinct |

All three mathematics requests returned HTTP 200 with `truncated: false`. This verifies pagination across three pages, not complete retrieval of all 210 records. Without `cooperationNetworkId`, the observed search reported 1,261 matches but returned no records (`truncated: true`). Network-specific pagination is the verified discovery strategy to explore further.

Aalto's network association does **not** imply that every listed course is open for registration by every Aalto student.

## Identity and temporal data

The relevant upstream identifiers are different concepts:

| Identifier | Meaning |
| --- | --- |
| `courseUnit.id` | Unique course-unit record, the deduplication key across network results |
| `courseUnit.groupId` | A separate upstream course-unit grouping identity |
| `assessmentItem.id` | Completion-method assessment item used to find realisations |
| `courseUnitRealisation.id` | A dated implementation, when one is published |
| `cooperationNetwork.id` | Sisu record ID used by the network search filter |
| `cooperationNetwork.networkId` | Distinct network identifier; do not substitute for `id` |

Course codes are not globally unique across institutions. Preserve both the providing institution and the Sisu course-unit ID; do not deduplicate external records by code. A course may belong to several networks, so deduplication must retain the full association set.

Validity also has separate meanings: network validity, each institution's membership interval, and the course's network association. A network marked `documentState: ACTIVE` may have a validity end date in the past. Treat a missing end date as an open interval, not guaranteed perpetual participation.

For course units, `curriculumPeriodIds` may be empty, and `activityPeriods` may be null or include historical ranges. `validity=ONGOING_AND_FUTURE` does not imply that every period on every returned record is in the future. Do not require an Aalto curriculum association for discovery.

## Teaching implementations and calendar limits

Published realisations were retrieved for three representative courses:

| Course | Realisation activity period | Linked study events |
| --- | --- | ---: |
| JYU KYBS2001 | 22 March – 31 May 2027 | 0 |
| Turku DTEK8102 | 26 October – 21 December 2026 | 0 |
| Tampere COMP.SEC.300 | 11 January – 21 May 2027 | 0 |

Event IDs are nested under `studyGroupSets[].studySubGroups[].studyEventIds`. The JYU and Tampere realisations indicate `usesExternalStructure: true`. Their empty event lists do **not** establish that teaching has no timetable. The [Study-event and Location Contract](../../dev-guide/study-event-contract/) describes current wrapper behavior for events that are actually available.

Available activity and enrolment periods can be shown as metadata, but the proposed integration must not promise complete lecture schedules, conflict-free calendar slots, or automatic enrolment.

## Proposed Sisukas boundary

The following is **not implemented** in the current production pipeline:

1. Retrieve networks associated with Aalto, evaluate effective membership/validity, and search each selected network with bounded pagination.
2. Deduplicate by Sisu course-unit ID, preserving provider and network associations; validate and publish a separate external discovery dataset atomically.
3. Display external course units in an explicit browser section without changing the Aalto-first default or manufacturing dated instances.
4. Convert a published external realisation to a plan-compatible offering only when the required identity and date fields are available and validated.
5. Treat detailed teaching events as optional; investigate their presence separately for calendar integration.

The existing `sisu-wrapper` can retrieve course units, realisations, and study events, but a browser-session HTTP 200 does not establish the authentication, permission, or operational contract for unattended collection. Confirm any new integration use with Aalto IT (`it-integ@aalto.fi`) before production deployment. The [Data Pipeline](../../dev-guide/data-pipeline/) documents the distinct access policy of the authenticated Aalto Course API.

Registration availability, individual eligibility, and acceptance into a degree are separate matters and must not be inferred from discovery results. Never publish session cookies, credentials, or student-specific responses with the dataset.

## Tracking and related documentation

- [Issue #126](https://github.com/kctong529/sisukas/issues/126) — completed technical feasibility investigation and recorded API observations.
- [Course Data Architecture](../../dev-guide/data-architecture/) — existing canonical, runtime, and snapshot responsibilities.
- [Data Pipeline](../../dev-guide/data-pipeline/) — implemented Aalto offering publication and operational safeguards.
- [Study-event and Location Contract](../../dev-guide/study-event-contract/) — implemented event normalization and known limitations.
