---
weight: 4
title: "Assemblies and Scheduling Candidates"
description: "How LEGO blocks produce ranked assembly candidates, and how candidates relate to the study calendar."
---

> [!NOTE]
> **Proposed domain model, not a claim of implemented behavior.** The existing scheduling implementation may still use the term *Schedule Pair* and narrower selection and scoring rules. See [planning architecture](../../architecture/planning/) for the distinction.

## Vocabulary

- **Plan:** A workspace containing course instances and planning choices.
- **LEGO block:** A user-configurable grouping of study groups used as an input to scheduling. Current block partition rules are implementation details, not permanent constraints on future algorithms.
- **Assemble:** Request scheduling candidates from a selected set of LEGO blocks.
- **Assembly candidate:** One proposed scheduling configuration returned by the assembler.
- **Saved assembly:** A candidate explicitly retained for later comparison or application; persistence is a future option.
- **Calendar:** The student's persistent working timetable, including active courses, study-group preferences, and attendance overrides.

## Assembler contract

Conceptually, `assemble(blocks, context) -> ordered candidates`. The optional context may contain teaching data, constraints, or preferences. The implementation and ranking criteria are deliberately unspecified. Candidates may contain unavoidable overlaps, and a future algorithm may choose a subset of courses or study groups. A candidate's exact shape and eligibility rules remain to be designed.

The assembler **does not modify** the plan or calendar. Candidate ordering is a recommendation, not a guarantee of conflict-free attendance or official registration eligibility.

## Applying a candidate

Applying a candidate is a **separate, explicit operation**. A calendar reconciliation step compares the candidate with the current calendar and previews proposed changes, potentially including active courses and default study-group selections. The student confirms before changes are saved. Existing compatible attendance preferences and occurrence overrides should be retained; ambiguous or destructive changes require clear handling.

The calendar is not a live projection of a saved assembly. Once applied, the student's calendar can evolve independently. Generating, regenerating, saving, or deleting candidates or assemblies does not implicitly rewrite it.

## Scope and unresolved choices

The initial goal is generation, comparison, and explicit application to one working calendar per plan/planning period. Multiple saved assemblies are possible later; multiple alternative calendars are **not** part of the initial scope. Open questions include candidate structure, course inclusion, algorithm ranking, data revisions, persistence limits, and reconciliation policy. Avoid implementing these as settled contracts prematurely.

## Related documentation

- [Plans](../plans/) — Planning workspace and blocks.
- [Study Calendar Design](../../under-dev/study-calendar/) — Working timetable and attendance intent.
- [Planning System Architecture](../../architecture/planning/) — Existing implementation versus proposed boundaries.
- [Legacy Schedule Pairs](../schedule-pairs/) — Earlier scheduling terminology and algorithm assumptions.
