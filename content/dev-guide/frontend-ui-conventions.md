---
weight: 6
title: "Frontend UI Conventions"
description: "Shared styling tokens, interaction and responsive conventions for the Sisukas frontend, with feature-specific exceptions."
---

> [!NOTE]
> **Frontend UI audit (#125), November 2026.** These conventions describe the completed UI standardization in `frontend/course-browser/`. They do not imply that every legacy component has migrated to the shared classes. Component-specific styles remain appropriate where the interaction or domain requires them. Temporal offering status hardening is tracked separately in [#207](https://github.com/kctong529/sisukas/issues/207).

## Scope and ownership

The frontend uses a small, opt-in visual foundation. Use shared tokens and primitives for ordinary controls, page shells, and view headers; keep Calendar event geometry, LEGO allocation colors, Timeline course-prefix colors, and Favourites teaching-period semantics with the features that own them. **Matching appearance does not imply matching domain meaning.**

| Source | Responsibility |
| --- | --- |
| `src/styles/tokens.css` | Shared palette, spacing, radius, card density, and compatibility aliases |
| `src/styles/primitives.css` | Opt-in page layout, header, buttons, inputs, selects, and focus states |
| View and component `.svelte` styles | Layout, interaction, and semantic visual distinctions specific to a feature |

Avoid broad `h2`, `button`, or card selectors for application-wide styling. Prefer shared classes or selectors scoped to a view/component. Do not use a heading-level change or negative margin to compensate for layout problems.

## Shared geometry and controls

| Element | Convention | Token or class |
| --- | --- | --- |
| Control corners | 6px | `--ui-radius-control` |
| Standard card or panel corners | 8px | `--ui-radius-surface` |
| Dialog corners | 12px | `--ui-radius-dialog` |
| Feature-specific large surface | 16px when justified | `--ui-radius-feature` |
| Spacing | 4 / 8 / 12 / 16 / 24px | `--ui-space-1`, `2`, `3`, `4`, `6` |
| Regular card padding | 16px | `--ui-card-padding-regular` |
| Compact grid-card padding | 12px | `--ui-card-padding-compact` |
| Toolbar controls | 32.5px height | `.ui-button`, `.ui-select`, `.ui-input` |
| Icon-only action | 32.5px square | `.ui-button--icon` |

Use `.ui-button--primary` and `.ui-button--secondary` for actions rather than recreating button states in each view. All interactive variants must retain visible `:focus-visible`, a disabled state, and meaningful accessible names. A toggle must expose its state, for example with `aria-pressed`; merely changing its background is insufficient.

The page shell uses `.ui-page-shell` and `--ui-page-max-width` (1400px). Shared headers use `.ui-view-header` and, where relevant, `.ui-view-header__actions`. Visible view titles use `h2`; a screen-reader-only `h1` may express page structure. Shared header typography belongs in the primitives stylesheet rather than in a global `h2` rule. Do not remove specialized empty-state heading styles when consolidating page headings.

## Deliberately independent color semantics

- **Favourites:** an offering's teaching-period status is past, current, or future. This is separate from whether the offering is selected. The outer course surface is neutral; inner offering surfaces use a subtle status tint, with greater tint intensity for selection. Do not use the color alone as the sole status explanation. Missing/invalid date handling is follow-up work in #207.
- **LEGO:** block colors indicate assignment or preview of study groups in a composition. Selected, previewed, and persisted assignment colors should agree. LEGO colors do **not** identify Calendar course offerings. Unassigned squares stay neutral.
- **Calendar:** the 12-color palette distinguishes course offerings. Events use tinted backgrounds with solid palette-colored borders and legible derived text; dense overlaps preserve access to their underlying events.
- **Timeline:** course-code/prefix coloring expresses a separate classification. Do not map these colors onto LEGO blocks or Calendar offerings.

Keep semantic danger, focus, and ordinary control colors in the shared tokens. Use accessible text and keyboard states even where a feature uses color to support quick scanning.

## Responsive behavior

The audited layout preserves a usable timetable and navigation on narrow screens without silently changing planning state.

- Visible headings in the four planning views (Favourites, LEGO, Calendar, Timeline) are visually hidden at viewport widths **below 584px**; their semantic headings remain available to assistive technologies. Empty-state headings are not hidden by this rule.
- Calendar's plan-manager toolbar is hidden **below 810px**, and its course bar is hidden **below 600px**. The active plan and calendar projection are unchanged; these are presentation-only choices.
- The Calendar weekly timetable remains horizontally scrollable on narrow screens. The mobile column-width adjustments must not impose a smaller vertical height limit at the 700px breakpoint.
- Timeline switches between desktop and mobile layouts around **520/521px**. Width-based CSS media-query thresholds must include units such as `px`.
- Main navigation uses compact/icon-only and menu variants at its own content-fit breakpoints. Adjust these based on the actual number of tabs and account actions rather than copying a breakpoint from a view.

The UI audit included manual visual checks across views and their breakpoints. Recheck the immediately adjacent widths when editing a media query; also check keyboard access and zoom/overflow, not only appearance.

## Calendar event presentation

Use the same event identity, time, and resolved location source when presenting the same occurrence in the timetable, context panel, or overlap-related views:

| Surface | Time and location presentation |
| --- | --- |
| Event card | Time, classroom, and building in separate compact rows, **without** `Location:`/`Building:` prefixes |
| Event details context panel | Labeled **Date**, **Time**, **Location** (classroom), and **Building** fields |
| Dense overlapping-events dialog | Show time and separately labeled classroom and building for each occurrence |
| Time-slot alternative rows | Show time, classroom, and building on separate compact rows; keep action tooltips current |

Prefer structured `StudyEvent.locations` room and `buildingName` metadata. Deduplicate repeated values; omit unavailable building data rather than guessing it. Legacy free-text location can be shown as location without synthesizing a building. For very short cards, preserve details in the accessible event summary when the visual display must be compact.

Do not add redundant visible selection-state labels to event cards or dialogs. Internal selection semantics may remain in accessible descriptions and `data-selection` attributes; distinguish Calendar visibility/choice from official SISU registration. Avoid obsolete tooltip wording such as “Not selected in Sisukas.” Focus outlines should stay visible without overflowing adjacent event lanes.

## Verification for UI changes

Run from `frontend/course-browser/`:

```sh
npm run check
npm run lint
npm test
npm run build
```

Use focused component tests when changing individual views, then run the full suite before merging. #125's final reported local verification on **14 November 2026** was **810 passing tests across 91 files**, zero Svelte errors or warnings, passing ESLint, and a successful production build; the existing chunk-size warning is non-blocking. This is a historical result, not a guarantee for future changes.

Manual checks should cover relevant responsive boundary widths, desktop and narrow widths, keyboard focus and activation, modal focus restoration, long labels, loading/error/empty states, and the Calendar's dense overlaps and horizontal scroll. A green unit-test suite does not replace browser visual checks.

## Related documentation

- [Frontend Organization](../../architecture/frontend-organization/) — Capability ownership and public module boundaries.
- [Study Calendar](../../under-dev/study-calendar/) — Product behavior and the distinction between Calendar preferences and SISU registration.
- [Calendar Visibility Testing](../calendar-visibility-testing/) — Preference persistence, identity, and overlap interaction checks.
- [Teaching Events](../../architecture/teaching-events/) — Source event and structured location metadata.
