---
weight: 9
title: "Calendar Preference API"
description: "Authenticated plan-scoped Calendar preference endpoints, semantics, errors, and test workflow."
---

> [!NOTE]
> This page is the reference for the authenticated Calendar preference HTTP contract. The #192 acceptance runs passed on Test and staging; see [Calendar Visibility Testing](../calendar-visibility-testing/) for reproducible commands and results. Production migration remains gated by #135.

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

The service uses direct Drizzle statements. Conflicting writes and resets follow database execution order, not necessarily user action order. A concurrent offering removal may result in a supported dormant preference; plan deletion is protected by the foreign-key cascade. The #191 frontend distinguishes `unknown`, `loading`, `ready` (including confirmed-empty), and `failed`, and guards optimistic mutations against out-of-order completions.

## Frontend request and consistency lifecycle

The frontend service `frontend/course-browser/src/infrastructure/services/CalendarPreferencesService.ts` sends authenticated requests with browser credentials. The reactive store `frontend/course-browser/src/lib/stores/calendarVisibilitySessionStore.svelte.ts` is initialized through the authenticated active-plan lifecycle; `frontend/course-browser/src/components/calendar/CalendarView.svelte` renders only when the matching account and plan have a confirmed `ready` preference state.

1. After authentication and active-plan resolution, load `GET /api/plans/:planId/calendar`. An empty successful result is authoritative; missing, pending, or failed responses are **not** treated as default-visible.
2. For group Hide/Restore, optimistically update display state and `PUT /api/plans/:planId/calendar/groups`. For per-occurrence Hidden/Visible/Inherited, use `PUT /api/plans/:planId/calendar/occurrences` with the exact versioned identity; `null` restores inheritance. A successful mutation is acknowledged by `204 No Content`.
3. Serialize mutations per preference identity so a rapid Hide → Restore on one identity is saved in user-intent order. Independent identities may save concurrently. For an aggregated Calendar card, preserve and update each distinct source identity rather than using only its display representative.
4. Keep failed mutations visible but **unsaved** in the current session and expose Retry through the global notification container. Successful PUTs are silent. A failed initial GET instead blocks event rendering and provides Retry in the Calendar.
5. Ignore stale account responses, and do not refresh a plan's authoritative preference snapshot while its optimistic mutations are pending or failed. No browser `localStorage` preference snapshot or offline mutation queue is implemented.

> [!IMPORTANT]
> Per-identity serialization only orders writes from this frontend session. The API has **no server revision or ETag precondition** for simultaneous writes from other devices/clients. Conflicting cross-client updates resolve by database execution order; a GET retrieves the state currently stored on the server.

## Verification and deployment boundary

- Route authorization is exercised by `backend/tests/routes/calendarPreferences.test.ts` (11/11) and real Better Auth HTTP integration (`calendarPreferences.http.test.ts`, 4/4).
- Database constraints, offering identity and lifecycle are exercised by `calendarPreferences.db.test.ts` (7/7).
- Direct PostgreSQL policy enforcement is tested independently of Better Auth in `calendarPreferences.rls.test.ts` (7/7); see [Row-Level Security](../../securities/row-level-security-testing/).
- The full test commands, opt-in environment guards, and two-account Playwright setup are maintained only in [Calendar Visibility Testing](../calendar-visibility-testing/).

> [!WARNING]
> Passing Test/staging verification does not authorize Production migration. Review migration history (#135) and coordinate backend/frontend release deployment.
