---
weight: 4
title: "Composing Schedule Pairs"
description: "How schedule pairs are generated and ranked: selecting one study group per block to form concrete timetable options."
---

> [!NOTE]
> This is Phase 2. After exploring Schedule Pairs, you'll use [Decision Slots](../decision-slots/) to handle conflicts.

## The Problem: Selection Fatigue

Planning breaks down quickly when courses have internal options.

If Course A has 3 exercise groups and Course B has 4, there are already
12 different ways those choices can interact. Add a third course, and the
number grows fast.

Manually comparing these combinations, toggling calendars, remembering
conflicts, trying to keep track of what you've already checked, is tedious
and error-prone.

## From Options to Concrete Schedules

At this stage of planning, you're no longer asking:
> “What options exist?”

You're asking:
> “Which concrete schedules actually work?”

A **Schedule Pair** answers that question.

It represents one complete timetable choice: a specific selection of
study groups, one from each block, across the courses in your Plan.

## What Schedule Pairs Do

Given a Plan, the Schedule Pairs engine:

- takes your current partition (how study groups are grouped into blocks),
- generates all valid combinations by selecting exactly one study group
  from each block, per course,
- and ranks those combinations by how well they fit together.

> [!NOTE]
> Blocks come from your current partition. By default, Sisukas groups study
groups by lecture / exercise / exam, but this grouping is only a suggestion.
You can define your own.

## Example: CS-A1110 + MATH-A1020

Using the default partition, each course typically has:
- a Lecture Block (often only one study group),
- and an Exercise Block (multiple study groups).

Each Schedule Pair below represents a complete, concrete timetable choice:
one study group per block, per course.

### Schedule Pair 1

- CS Lecture (Mon 10–12)
- CS Exercise H01 (Tue 14–16)
- MATH Lecture (Tue 10–12)
- MATH Exercise H01 (Mon 10–12)

→ **2-hour overlap**  
(CS Lecture and MATH Exercise both scheduled Mon 10–12)

### Schedule Pair 2

- CS Lecture (Mon 10–12)
- CS Exercise H01 (Tue 14–16)
- MATH Lecture (Tue 10–12)
- MATH Exercise H02 (Wed 10–12)

→ **No overlap**

## Ranking by “Fit”

> [!IMPORTANT]
> Not all conflicts are equally bad.

The system ranks Schedule Pairs using a **Fit Score**, so you see the
most workable options first:

1. **Perfect Fit**  
   No time conflicts.

2. **Manageable Fit**  
   Overlaps exist only in study groups marked as “recordings available”.

3. **Hard Conflict**  
   Overlapping exams or mandatory sessions.

Instead of silently picking one schedule for you, Sisukas shows you the
ranked options so you can decide which trade-offs you're willing to accept.

## Why This Matters for Planning

- **Without Schedule Pairs:**  
  You manually compare combinations, relying on memory and repeated checks.

- **With Schedule Pairs:**  
  The system presents the viable schedules, ordered by how well they fit,
  so you can focus on making a decision, not finding the options.

> [!TIP]
> Schedule Pairs don't choose *for* you.  
> They make the trade-offs visible so you can choose consciously.

## Next Steps

For any remaining conflicts, use **[Decision Slots](../decision-slots/)** to
explicitly decide what you'll attend and what you'll skip.

## See Also
- [The Big Picture](../overview/) – Understand the three phases
- [Getting Started](../../getting-started/) – Run it locally
