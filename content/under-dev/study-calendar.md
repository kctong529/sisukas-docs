---
weight: 1
title: "Study Calendar Design"
description: "Design of an active-plan calendar that makes teaching events, overlaps, and intended attendance understandable."
---

> [!NOTE]
> **Status: under development.** The calendar beta is tracked in [issue #81](https://github.com/kctong529/sisukas/issues/81). The design below distinguishes the initial beta from later attendance features; it should not be read as a list of already available capabilities.

## Why a calendar?

A Plan captures the courses a student intends to study, while teaching groups and their events give those courses actual times. A useful calendar brings those events together in a weekly view, making it easier to notice overlaps, inspect alternatives, and decide what to do next.

The first version should be valuable without asking students to resolve every conflict or maintain a detailed attendance model. Students should be able to open their active Plan, see its teaching events, navigate weeks, and hide irrelevant options.

## Relationship to Decision Slots

[Schedule Pairs](../../concepts/schedule-pairs/) help compare combinations of study groups. [Decision Slots](../../concepts/decision-slots/) describe the *planning decision* that remains when chosen events overlap: which session to attend, skip, or attend partially.

The calendar addresses a closely related, but broader, question: what is happening in a particular week, and what does the student currently intend to attend? It must represent recurring teaching groups, changes to individual weeks, cancelled events, and flexible exam windows even when no Schedule Pair or Decision Slot has been selected.

> [!IMPORTANT]
> The calendar is not dependent on LEGO blocks, Schedule Pairs, or Decision Slots. These are complementary concepts, not a shared technical workflow. The calendar derives its source events from the active Plan and SISU teaching data. Any future integration should reuse compatible overlap semantics without making one feature's state authoritative for another.

For example, two lectures overlapping on Monday can be *visible* on the calendar before the student decides which one to attend. Hiding one lecture from the display does not count as choosing the other. A future attendance decision might resolve the overlap for one week without changing the student's usual teaching-group preference.

## Data and responsibility boundaries

| Concern | Source or owner | Design rule |
| --- | --- | --- |
| Active Plan membership | Authenticated user/Plan state | Only course instances in the active Plan contribute events. |
| Teaching groups and occurrences | SISU data through `sisu-wrapper` | Preserve institutional times, identifiers, cancellation state, and notices; do not mutate upstream facts. |
| Calendar projection and layout | Frontend domain logic | Derive a locally queryable weekly view; week navigation should not require a backend round trip. |
| Display visibility | User/Plan-scoped preference | Hiding an item does not express attendance, registration, or group equivalence. |
| Recurring attendance and exceptions | Future user/Plan-scoped intent | Keep recurring preferences distinct from individual-week overrides. |
| Runtime persistence | Authenticated backend | Server is authoritative for saved preferences; failed writes must be visible and recoverable. |

Issue [#89](https://github.com/kctong529/sisukas/issues/89) established the need to preserve source event series IDs, expanded occurrence times, statuses, and location metadata. Individual occurrences may lack a stable upstream ID, so derived occurrence keys and their behavior under rescheduling need explicit handling in the projection and persisted preferences ([#90](https://github.com/kctong529/sisukas/issues/90)).

> [!WARNING]
> A time-compatible alternative teaching group is not necessarily an academically equivalent or registration-eligible substitute. The interface must not imply that a student's calendar selection changes official SISU registration.

## Calendar beta: a useful weekly view

The first milestone ([#81](https://github.com/kctong529/sisukas/issues/81)) focuses on a practical calendar with minimal setup:

1. **Project active-Plan events.** Build a deterministic representation of fixed-time occurrences, source references, and diagnostics for missing or changed upstream data ([#90](https://github.com/kctong529/sisukas/issues/90)).
2. **Display a responsive week.** Show event times, course and group information, location when available, and accessible details. Dense overlaps should remain legible rather than collapsing into narrow columns ([#91](https://github.com/kctong529/sisukas/issues/91)).
3. **Control visibility.** Show or hide groups and specific occurrences without changing source data or claiming an attendance decision ([#92](https://github.com/kctong529/sisukas/issues/92)).
4. **Persist preferences.** Save user/Plan-scoped visibility preferences; handle failed requests, stale references, sign-out, and account switching explicitly ([#93](https://github.com/kctong529/sisukas/issues/93)).
5. **Present flexible exam windows.** Distinguish a fixed exam from an availability period, which must not occupy every hour as if it were a booked sitting ([#100](https://github.com/kctong529/sisukas/issues/100)).
6. **Test the actual journeys.** Cover navigation, overlapping events, empty states, identity changes, and errors with deterministic Playwright fixtures ([#94](https://github.com/kctong529/sisukas/issues/94)).

> [!TIP]
> Start with a calendar that answers *“What could I attend this week?”* before asking users to answer *“What exactly will I attend?”* for every occurrence.

## After beta: expressing attendance intent

These features make the connection to Decision Slots stronger, but are post-beta, not prerequisites for rendering the calendar:

- **Recurring group preferences** ([#101](https://github.com/kctong529/sisukas/issues/101)): what the student ordinarily intends to attend, independently of visibility and LEGO blocks.
- **Weekly alternatives** ([#102](https://github.com/kctong529/sisukas/issues/102)): replace, add, or skip a particular occurrence without changing the recurring default.
- **Interval-aware conflict decisions** ([#103](https://github.com/kctong529/sisukas/issues/103)): detect overlaps among *selected attendance intervals*, including cases with more than two simultaneous events. Unresolved conflicts stay visible.
- **Partial attendance** ([#104](https://github.com/kctong529/sisukas/issues/104)): represent an intended portion of an occurrence without modifying the institutional event.
- **Planned e-exam sitting** ([#105](https://github.com/kctong529/sisukas/issues/105)): let the student place an intended sitting inside an availability window, clearly marked as *planned*, not externally booked.

As these features mature, an overlap in a calendar week may be resolved by a concrete attendance choice analogous to a Decision Slot. The choice should remain scoped to the appropriate occurrence or recurring preference instead of silently rewriting a Schedule Pair.

## Constraints and open questions

- **Caching and offline use:** Previously obtained teaching data should support local projection and navigation where available. This does not imply complete offline editing or synchronization; the backend remains authoritative for persisted user intentions.
- **Temporal identity:** Rescheduled or cancelled occurrences need stable-enough matching, diagnostics, and explicit stale-reference behavior rather than silently applying old choices to new times.
- **Accessibility:** Hover previews may improve exploration, but keyboard and touch users need equivalent controls.
- **Conflict meaning:** A visible overlap is not necessarily an intended-attendance conflict. Likewise, a flexible availability window is not a confirmed appointment.
- **Usability:** Validate the mental model with student scenarios before making advanced attendance controls part of the default experience ([#106](https://github.com/kctong529/sisukas/issues/106)).

## Related documentation

- [Decision Slots](../../concepts/decision-slots/) — Conceptual choices for unresolved schedule conflicts.
- [Composing Schedule Pairs](../../concepts/schedule-pairs/) — Comparing combinations of teaching groups.
- [Plans](../../concepts/plans/) — Course selection and the planning context.
- [Study-event and Location Contract](../../dev-guide/study-event-contract/) — Source event metadata and temporal semantics.
- [Course Data Architecture](../../dev-guide/data-architecture/) — Published catalogue and on-demand SISU data boundaries.
