---
weight: 3
title: "Study Plans"
description: "What a Plan is and how blocks turn course options into explicit choices for semester-level planning."
---

> [!NOTE]
> Plans contain course instances and LEGO block choices. The proposed [assembly workflow](../assemblies/) produces ranked candidates without committing changes to the calendar.

## What is a Plan?

A **Plan** is a flexible workspace where you group course instances you're considering for a specific semester.

> [!TIP]
> Instead of comparing courses in isolation, you create a Plan that says:
> *"I'm thinking about these 4 courses for Spring 2025."*
> Once they're in a Plan, you can explore how they interact as a whole.

A Plan doesn't represent a commitment. It's a place to **think**, explore options, and understand trade-offs before deciding anything.

> [!NOTE]
> Plans are semester-scoped workspaces. For year-level continuity (completed, ongoing, and planned studies together), see the [Year Timeline](../year-timeline/).

## From Courses to Choices

When planning a semester, the difficulty isn't picking courses. It's dealing with their **internal choices**.

Most courses don't have a single fixed schedule. They have:
- multiple lecture times,
- multiple exercise groups,
- exams or mandatory sessions.

To reason about how courses interact, Sisukas needs a way to treat these as **explicit choices**, not hidden details.


## Blocks: The Units of Planning

To make this possible, Sisukas introduces **Blocks**.

In the current implementation, a **Block** is a user-defined partition over study groups used to represent a selection during schedule computation. The proposed assembler treats LEGO blocks as inputs without fixing its future selection rules.

- The **current algorithm** selects exactly one study group per block
- Blocks define *where* choices exist, not *what* the choices must be
- Blocks are **not fixed by SISU** — they come from your current partition

> [!IMPORTANT]
> By default, Sisukas suggests blocks grouped by activity type (lecture / exercise / exam), but you can repartition study groups however you want.

## The Planning Hierarchy

With that in mind, the planning model looks like this:

- **Course Instance**  
  A specific offering of a course (e.g. CS-A1110, Autumn 2025)

- **Block**  
  A user-defined grouping of study groups representing one required choice  
  (defaults group by lecture/exercise/exam)

- **Study Group**  
  A concrete time slot you could attend (e.g. "Tue 14:00–16:00")

```
Default partition example (grouped by activity type):

CS-A1110 (Autumn 2025):
├─ Lecture Block
│  └─ Mon/Wed 10:00–12:00
├─ Exercise Block
│  ├─ Group H01 (Tue 14:00–16:00)
│  ├─ Group H02 (Wed 14:00–16:00)
│  └─ Group H03 (Thu 14:00–16:00)
└─ Exam Block
└─ Jan 15, 2026
```

This structure makes the *required selection* in a course explicit.

## The Composability Principle

Traditional tools force you to check schedules manually:

- **Traditional:** “Does this course work?” (in isolation)
- **Sisukas:** “Do these courses work *together*?” (in combination)

By treating a Plan as a set of blocks with explicit choices, you can:
- swap one study group for another,
- explore alternatives without rebuilding your whole plan,
- and let the system reason about combinations for you.

This shifts planning from *manual trial-and-error* to *exploring a ranked set of possibilities*.

## Related documentation

- [Schedule Pairs](../schedule-pairs/) — Combine and rank planning choices.
- [Planning Concepts](../overview/) — The wider planning lifecycle.
- [Getting Started](../../getting-started/) — Try Sisukas.
