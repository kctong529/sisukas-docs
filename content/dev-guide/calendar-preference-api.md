---
weight: 9
title: "Calendar Preference API"
description: "Authenticated plan-scoped Calendar preference endpoints, semantics, errors, and test workflow."
---

> [!NOTE]
> **Backend implemented; Supabase Test only.** The routes are present in `backend/src/routes/calendarPreferences.ts` and tested against Supabase Test. Migration `0005` has **not** been applied to Supabase Production. Frontend hydration and end-to-end acceptance remain #191/#192.

## Purpose and scope

The API stores *presentation preferences* for a plan. It does not copy canonical SISU study groups or events. See [Calendar Visibility](../../architecture/calendar-visibility-preferences/) for inheritance and [Calendar Schema](../../architecture/calendar-visibility-schema/) for the physical key and lifecycle contract.

All endpoints are mounted beneath `/api/plans/:planId/calendar`, require a Better Auth session, and authorize ownership using `plans.user_id`. The request must not contain a trusted `userId`; ownership is derived from the session. Requests for missing or foreign plans return `404`.

## Endpoints

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `GET` | `/api/plans/:planId/calendar` | No body | `200` preference collections |
| `PUT` | `/api/plans/:planId/calendar/groups` | `courseOfferingId`, `studyGroupId`, `hidden: boolean` | `204` |
| `PUT` | `/api/plans/:planId/calendar/occurrences` | Offering/group scope, version/key, `visibility: "visible" \| "hidden" \| null` | `204` |

### Read both preference collections

```http
GET /api/plans/11111111-1111-4111-8111-111111111111/calendar
```

```json
{
  "hiddenGroups": [
    { "courseOfferingId": "offering-A", "studyGroupId": "H1" }
  ],
  "occurrenceOverrides": [
    {
      "courseOfferingId": "offering-A",
      "studyGroupId": "H1",
      "occurrenceKeyVersion": 1,
      "occurrenceKey": "[\"series\",\"offering-A\",\"H1\",\"series-1\",1790000000000]",
      "visibility": "visible"
    }
  ]
}
```

Two empty arrays are **confirmed-empty**, not loading or a failed database request. The backend checks plan ownership, then issues independent queries for the two arrays; they are returned together but are not guaranteed one atomic snapshot against concurrent writes.

### Hide or restore a group

```http
PUT /api/plans/11111111-1111-4111-8111-111111111111/calendar/groups
Content-Type: application/json
```

```json
{ "courseOfferingId": "offering-A", "studyGroupId": "H1", "hidden": true }
```

`hidden: true` upserts one sparse hidden-group row; `false` deletes it and restores default visibility. No row means visible by default, subject to source eligibility and occurrence overrides. Repeating either operation is idempotent.

### Set or reset an occurrence

```http
PUT /api/plans/11111111-1111-4111-8111-111111111111/calendar/occurrences
Content-Type: application/json
```

```json
{
  "courseOfferingId": "offering-A",
  "studyGroupId": "H1",
  "occurrenceKeyVersion": 1,
  "occurrenceKey": "[\"series\",\"offering-A\",\"H1\",\"series-1\",1790000000000]",
  "visibility": "hidden"
}
```

`"visible"` or `"hidden"` stores an explicit occurrence override; `null` deletes it to **inherit group visibility**. An absent override is not equivalent to explicit `"visible"` when the group is hidden. The exact serialized v1 JSON key must match the offering/group scope and is hashed for physical indexing; the original key is retained. Unsupported versions, malformed/cross-scoped JSON, or oversized keys are rejected. The backend does not guarantee that the referenced SISU event still exists or is unambiguous; that remains a Calendar projection responsibility.

**New writes** require the offering to belong to the plan. **Resets** are allowed for removed offerings, preserving the option to clean up dormant preferences. Removing an offering does not itself delete saved preferences; deleting a plan cascades to both tables.

## Error handling

| Status | Meaning |
| --- | --- |
| `200` | Successful GET, including confirmed-empty |
| `204` | Successful mutation, no response body |
| `400` | Invalid plan UUID, request body, visibility, or occurrence-key identity |
| `401` | Missing session |
| `404` | Plan missing or not owned by the authenticated user |
| `409` | Offering not in plan for a new write, or digest collision |
| `500` | Unexpected persistence failure; never interpreted as confirmed-empty |

The service uses direct Drizzle statements. Conflicting writes and resets follow database execution order, not necessarily user action order. A concurrent offering removal may result in a supported dormant preference; plan deletion is protected by the foreign-key cascade. For #191, keep distinct `unknown`, loading, ready/confirmed-empty, and error states, and guard optimistic mutations against out-of-order responses.

## Verification and deployment

The test suites and their opt-in `.env.test` configuration are documented in `backend/tests/integration/README.md` in the application repository. From `backend/`:

```sh
npm run build
npx vitest run --exclude 'tests/rls.*.test.ts' --exclude 'tests/integration/*'
CALENDAR_DB_TEST=yes npx vitest run tests/integration/calendarPreferences.db.test.ts --no-file-parallelism
CALENDAR_HTTP_TEST=yes npx vitest run tests/integration/calendarPreferences.http.test.ts --no-file-parallelism
```

The database suite validates persistence and lifecycle rules, the HTTP suite exercises actual Better Auth sessions and ownership authorization, and the focused service tests simulate digest collisions. They do **not** establish browser synchronization, Magic Link delivery, or production readiness.

> [!WARNING]
> The Supabase Test migration is verified. **Do not apply `0005` to production or enable production Calendar persistence until #191 and #192 have passed and the backend/frontend release is coordinated.** See [Database Operations](../database-operations/) for the reviewed migration and verification commands.
