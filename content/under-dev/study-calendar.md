---
weight: 1
title: "Study Calendar"
description: "Design of an active-plan calendar that makes teaching events, overlaps, and intended attendance understandable."
---

> [!NOTE]
> **Status: beta under development.** The Calendar weekly view and display-visibility controls (#92), including authenticated server-backed persistence (#191), are implemented and locally verified. Group-selection shortcuts (#101) and direct-overlap actions (#103) are implemented in the frontend. The broader [#81 beta](https://github.com/kctong529/sisukas/issues/81), additional validation (#192), and production deployment remain pending.

## Why a calendar?

A Plan captures the courses a student intends to study, while teaching groups and their events give those courses actual times. A useful calendar brings those events together in a weekly view, making it easier to notice overlaps, inspect alternatives, and decide what to do next.

The first version should be valuable without asking students to resolve every conflict or maintain a detailed attendance model. Students should be able to open their active Plan, see its teaching events, navigate weeks, and hide irrelevant options.

## Relationship to assemblies

[Assemblies](../../concepts/assemblies/) are proposed configurations generated from selected LEGO blocks. They may include unavoidable conflicts and may eventually influence both active calendar courses and default study groups. Their generation and ranking are separate from calendar state.

> [!IMPORTANT]
> The calendar is independently editable. **Assembling or saving a candidate must not change it.** A future **Apply to calendar** action should preview and reconcile changes against existing course activity and Calendar group/occurrence preferences before user confirmation. This integration is not part of the initial read-only calendar beta.

An overlap can remain visible even after an assembly is applied. Users manage intended Calendar choices using the same group and occurrence visibility preferences. These choices do not register the student in SISU. Partial attendance remains separate future work. Earlier documentation called some conflict choices *Decision Slots*; that is no longer a mandatory separate workflow.

## Data and responsibility boundaries

| Concern | Source or owner | Design rule |
| --- | --- | --- |
| Active Plan membership | Authenticated user/Plan state | The beta projects course instances in the active Plan; future calendar-active course selection may be narrower after explicit application. |
| Teaching groups and occurrences | SISU data through `sisu-wrapper` | Preserve institutional times, identifiers, cancellation state, and notices; do not mutate upstream facts. |
| Calendar projection and layout | Frontend domain logic | Derive a locally queryable weekly view; week navigation should not require a backend round trip. |
| Calendar preferences | User/Plan-scoped group and occurrence visibility | Group selection and per-occurrence conflict choices use the same persisted visibility mechanism; neither changes SISU registration. |
| Runtime persistence | Authenticated backend | Server is authoritative for saved preferences; failed writes must be visible and recoverable. |

Issue [#89](https://github.com/kctong529/sisukas/issues/89) established the need to preserve source event series IDs, expanded occurrence times, statuses, and location metadata. Individual occurrences may lack a stable upstream ID, so derived occurrence keys and their behavior under rescheduling need explicit handling in the projection and persisted preferences ([#90](https://github.com/kctong529/sisukas/issues/90)).

> [!WARNING]
> A time-compatible alternative teaching group is not necessarily an academically equivalent or registration-eligible substitute. The interface must not imply that a student's calendar selection changes official SISU registration.

## Current Calendar behavior

For an authenticated active Plan, Calendar loads saved display preferences from the backend **before rendering event cards**. A successful empty response means default visibility; loading or failed preference requests do not briefly reveal saved-hidden events. Users may hide or restore teaching groups, or explicitly hide/show/reset an individual occurrence, and saved changes are restored after reload. Updates apply optimistically. Failed PUTs keep the local edit visible and offer Retry through a notification without shifting the Calendar layout; successful writes are silent.

These controls support the student’s Calendar preferences, including recurring teaching-group choices and per-occurrence alternatives. They do **not** change SISU registration, upstream teaching data, or saved LEGO assemblies. Persistence is verified in the Test-backed development environment, not yet released to Production.

## Current presentation conventions

The Calendar UI distinguishes a compact timetable event from the fuller details shown when an event or overlap is inspected. Cards show event time and, when available, classroom and building as separate unlabeled rows. The context panel and dense overlap dialog label **Location** (classroom) and **Building** explicitly; the time-slot alternatives list also preserves these details. Missing building information is omitted rather than inferred.

Visible selection-status labels were removed from compact event presentation. Calendar planning and visibility information remains available through its controls and accessible descriptions; neither a choice nor hiding an event confirms registration in SISU. The current tooltip describes event details and actions rather than obsolete selection language.

On narrow screens, the plan-manager controls are hidden below 810px and the course bar below 600px, while weekly navigation and the horizontally scrollable timetable remain available. The timetable does not deliberately reduce its vertical visible region below 700px. The shared frontend conventions, accessible focus behavior, and responsive verification guidance are described in [Frontend UI Conventions](../../dev-guide/frontend-ui-conventions/).

## Calendar beta: a useful weekly view

The first milestone ([#81](https://github.com/kctong529/sisukas/issues/81)) focuses on a practical calendar with minimal setup:

1. **Project active-Plan events.** Build a deterministic representation of fixed-time occurrences, source references, and diagnostics for missing or changed upstream data ([#90](https://github.com/kctong529/sisukas/issues/90)).
2. **Display a responsive week.** Show event times, course and group information, location when available, and accessible details. Dense overlaps should remain legible rather than collapsing into narrow columns ([#91](https://github.com/kctong529/sisukas/issues/91)).
3. **Control visibility.** Show or hide groups and specific occurrences without changing source data or claiming SISU registration ([#92](https://github.com/kctong529/sisukas/issues/92)).
4. **Persist preferences (implemented locally in #191).** Save user/Plan-scoped visibility preferences; handle failed requests, stale references, sign-out, and account switching explicitly. Further regression validation and production rollout remain pending ([#93](https://github.com/kctong529/sisukas/issues/93), [#192](https://github.com/kctong529/sisukas/issues/192)).
5. **Present flexible exam windows.** Distinguish a fixed exam from an availability period, which must not occupy every hour as if it were a booked sitting ([#100](https://github.com/kctong529/sisukas/issues/100)).
6. **Test the actual journeys.** Cover navigation, overlapping events, empty states, identity changes, and errors with deterministic Playwright fixtures ([#94](https://github.com/kctong529/sisukas/issues/94)).

> [!TIP]
> Start with a calendar that answers *“What could I attend this week?”* before asking users to answer *“What exactly will I attend?”* for every occurrence.

## Calendar preference shortcuts and planned features

The first three interactions now use the existing group and occurrence visibility preferences rather than separate attendance state:

- **Recurring group choices** ([#101](https://github.com/kctong529/sisukas/issues/101), implemented): Choose a teaching group, hide same-type alternatives, and Show all within an offering.
- **Occurrence overrides** ([#102](https://github.com/kctong529/sisukas/issues/102), underlying mechanism implemented): Show or hide one occurrence without changing the group-wide preference.
- **Direct overlap resolution** ([#103](https://github.com/kctong529/sisukas/issues/103), implemented in frontend): Keep an occurrence and hide only its direct overlaps; compare, preview and toggle cross-course alternatives, including hidden occurrences.
- **Partial attendance** ([#104](https://github.com/kctong529/sisukas/issues/104)): represent an intended portion of an occurrence without modifying the institutional event.
- **Planned e-exam sitting** ([#105](https://github.com/kctong529/sisukas/issues/105)): let the student place an intended sitting inside an availability window, clearly marked as *planned*, not externally booked.

Calendar choices remain scoped to occurrences or recurring groups and never silently rewrite an assembly or SISU registration.

## Constraints and open questions

- **Caching and offline use:** Previously obtained teaching data should support local projection and navigation where available. This does not imply complete offline editing or synchronization; the backend remains authoritative for persisted user intentions.
- **Temporal identity:** Rescheduled or cancelled occurrences need stable-enough matching, diagnostics, and explicit stale-reference behavior rather than silently applying old choices to new times.
- **Accessibility:** Hover previews may improve exploration, but keyboard and touch users need equivalent controls.
- **Conflict meaning:** The one-click action is a user-requested visibility choice, not proof that the student will attend or is registered. Flexible availability windows are not confirmed appointments.
- **Usability:** Validate the mental model with student scenarios before making advanced attendance controls part of the default experience ([#106](https://github.com/kctong529/sisukas/issues/106)).

## Related documentation

- [Calendar Visibility Preference Contract](../../architecture/calendar-visibility-preferences/) — Plan/group/occurrence identity, inheritance, and safe hydration (#189).
- [Calendar Visibility Persistence Schema](../../architecture/calendar-visibility-schema/) — Implemented preference schema (Supabase Test only) and rationale (#190).
- [Calendar Preference API](../../dev-guide/calendar-preference-api/) — Authenticated GET/PUT contract and frontend mutation lifecycle.
- [Calendar Visibility Testing](../../dev-guide/calendar-visibility-testing/) — Local acceptance checklist and remaining regression work.
- [Assemblies](../../concepts/assemblies/) — Candidate generation and explicit calendar application.
- [Legacy Decision Slots](../../concepts/decision-slots/) — Earlier conflict-handling proposal.
- [Plans](../../concepts/plans/) — Course selection and the planning context.
- [Teaching Events](../../architecture/teaching-events/) — Source event metadata and temporal semantics.
- [Course Data](../../architecture/course-data/) — Published catalogue and on-demand SISU data boundaries.
