---
weight: 3
title: "Plans: Grouping Your Blocks"
description: "What a Plan is and how blocks turn course options into explicit choices for semester-level planning."
---

> [!NOTE]
> This is Phase 1. After exploring Plans, you'll use [Schedule Pairs](../schedule-pairs/) to find combinations.

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

A **Block** is a user-defined partition over a set of study groups that represents
one required selection during schedule computation.

- You must select **exactly one study group per block**
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

## Next Steps

- Learn how **[Schedule Pairs](../schedule-pairs/)** combine and rank these choices

## See Also

- [The Big Picture](../overview/) – Why we design this way
- [Getting Started](../../getting-started/) – Create your first Plan
