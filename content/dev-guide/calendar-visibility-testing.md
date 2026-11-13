---
weight: 10
title: "Calendar Visibility Testing"
description: "Reproducible local checks for authenticated Calendar preference hydration, persistence, retries, and identity boundaries."
---

> [!NOTE]
> **Status: #191 locally accepted on November 13, 2026; additional #192 coverage and production rollout pending.** This page records repeatable checks and known boundaries, not an assertion that all cases already have a Playwright test.

## Preconditions

- Run the frontend and backend against a verified **Test** database with migration `0005` installed. Confirm the backend authenticates via Better Auth and the active plan belongs to the signed-in account.
- Use a plan containing at least two teaching groups, plus occurrences with stable, unambiguous derived identities. Note one group and occurrence to restore afterward.
- Open browser DevTools → Network, filter for `/api/plans/` and `/calendar`, and enable Preserve log as needed. For failures, use request blocking or an interception tool that can block the specific GET/PUT without breaking unrelated API requests.
- Restore any visibility preferences modified during testing; use a disposable plan/account when testing sensitive transitions. **Never run integration harnesses that create and delete fixtures against Production.**

## Manual acceptance checklist

| Case | Action | Expected observation |
| --- | --- | --- |
| Delayed hydration | Throttle `GET /api/plans/:planId/calendar` with a previously hidden group | Calendar event cards do not flash in default-visible state while `unknown`/`loading`; after `200`, saved visibility applies |
| Failed hydration | Block/fail the initial GET, then unblock and select Retry | Explicit blocking error and Retry; no fabricated empty preference set; cards render after a successful GET |
| Confirmed-empty | Use a plan whose GET returns `hiddenGroups: []` and `occurrenceOverrides: []` | `ready` is valid and eligible events display by default |
| Group persistence | Hide a group, inspect `PUT /groups` (`204`), reload, then restore and reload | Hidden/restored choice survives each reload |
| Occurrence persistence | Hide an occurrence, inspect `PUT /occurrences` (`204`), reload, then reset it | Only that unambiguous occurrence changes; `visibility: null` restores inheritance |
| Explicit visible | Hide a group, explicitly show one occurrence, reload | That occurrence remains visible while sibling occurrences inherit group hidden state |
| Rapid edits | Hide then restore one identity before its first PUT completes | UI reflects latest intent; serialized requests leave the final stored value correct after reload |
| Failed PUT | Block one PUT and perform a visibility edit, then unblock and select Retry | Local edit remains visible but unsaved; persistent actionable notification; successful retry clears the error; Calendar does not shift |
| Plan switch | Throttle preference GET, switch A → B → A | Preferences remain scoped to their owning plan; old requests do not overwrite the active plan |
| Account transition | While a request is pending, sign out or switch accounts | No previous-account preference cards, stale errors, or success notifications leak into the next session |
| Missing/ambiguous source | Inspect events whose source association is unresolved or collision-diagnosed | No unsafe per-occurrence write control; unmatched saved keys remain dormant, not heuristically remapped |

The persistence UI is deliberately quiet on successful mutations: no success toast is expected for each `204` response. The notification container handles failed PUT recovery; initial GET failure remains blocking because event visibility is not yet known.

## Automated frontend checks

Run from `frontend/course-browser/`:

```sh
npx vitest run tests/lib/stores/calendarVisibilityHydration.test.ts tests/lib/stores/calendarVisibilityMutations.test.ts tests/lib/stores/calendarVisibilityHardening.test.ts
npm run type-check
npm run check
npm run lint
npm run test
npm run build
```

The November 13, 2026 acceptance log recorded **17/17 focused tests**, **737/737 full tests (73 files)**, zero Svelte diagnostics, and successful type-check, lint, and production build. Coverage includes store-level confirmed-empty and failure boundaries, write ordering, refresh guards, and account invalidation. These results are not a substitute for mounted-component/browser assertions.

The frontend also contains tests for API mapping, display gating, and the notification service under `tests/application/calendar/`, `tests/lib/stores/`, and `tests/infrastructure/services/`.

## Calendar group and overlap interaction regression (#101 / #103)

The Calendar frontend now provides **Choose / Cancel** and **Show all** for offering-level teaching groups (#101), plus **Keep this · Hide N overlapping events** and cross-course overlapping-event rows (#103). The same existing preference writes persist these choices; there is no separate attendance database model.

- Choose one group: hide only same-type siblings of the same offering, preserve that group’s individual skipped occurrences, and clear conflicting explicit-visible sibling exceptions.
- Show all for an offering: restore its group and occurrence preferences, including dormant identities where applicable.
- Resolve one occurrence: hide only direct absolute half-open interval overlaps, not adjacency or transitive-only overlaps; retain aggregated source identities and block ambiguous identities.
- Inspect overlapping events: include currently hidden events across offerings; clicking a row toggles its occurrence visibility, while hovering/focusing a hidden row previews without writing.
- Dense disclosure: the one-click action must be reachable for four or more simultaneous occurrences. Confirm normal browser dialog opening/closing and focus return.
- Verify plan/account boundaries, optimistic failures/Retry, refresh and reload after multi-identity changes. A group/overlap shortcut can issue multiple independent PUT requests and is **not transactionally atomic**.

From `frontend/course-browser/` run:

```sh
npx tsc -p tsconfig.test.json --noEmit
npx vitest run tests/application/calendar/calendarOverlapChoice.test.ts tests/application/calendar/calendarTimeSlotAlternatives.test.ts tests/application/calendar/calendarVisibilityShortcuts.test.ts tests/components/calendar/CalendarTimeSlotAlternatives.test.ts tests/components/calendar/WeekGrid.test.ts
```

The #103 manual review and November 13 test log reported **768/768 tests across 79 files**, Svelte checks with no errors or warnings, passing lint, and a production build (existing large-chunk warning). A subsequent CI run caught three implicit-any test callback parameters in `WeekGrid.test.ts` when directly executing `tsconfig.test.json`; those parameters have been explicitly annotated, but this specific CI command must be rerun to confirm the fix.

## Backend and outstanding coverage

The backend test suites and opt-in database/HTTP integration commands are documented in [Calendar Preference API](../calendar-preference-api/). Validate the Test project reference and credentials before running them; they create test records.

[#192](https://github.com/kctong529/sisukas/issues/192) owns additional security/ownership validation, identity failure cases (including stale or ambiguous occurrences), and deterministic Playwright checks for rendered event-card hydration and persistence. **No new Playwright implementation is claimed by this documentation change.** Production migration and deployment also remain outside #191.

## Related documentation

- [Calendar Preference API](../calendar-preference-api/) — Endpoint semantics, authentication, and test commands.
- [Calendar Visibility](../../architecture/calendar-visibility-preferences/) — Derived identity, inheritance, and failure policies.
- [Calendar Schema](../../architecture/calendar-visibility-schema/) — Sparse tables and deployment boundary.
- [Database Operations](../database-operations/) — Test/Production separation and migration safety.
- [Study Calendar](../../under-dev/study-calendar/) — User-facing behavior and attendance separation.
