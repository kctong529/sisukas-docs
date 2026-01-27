---
weight: 5
title: "Conflicts in Decision Slots"
description: "How Sisukas models unavoidable overlaps as decision slots, so users explicitly choose what to attend and what to skip."
---

> [!NOTE]
> This is Phase 3. See [Plans](../plans/) for how blocks are composed and 
[Schedule Pairs](../schedule-pairs/) for how they're ranked.

## When Conflicts Don't Go Away

Even after choosing a well-ranked Schedule Pair, some overlaps are unavoidable.

At this point, planning isn't about finding a better combination. It's about
deciding how you will handle the conflicts that remain.

That's what Decision Slots are for.

## What is a Decision Slot?

A **Decision Slot** is a specific time interval where the study groups in your
chosen Schedule Pair overlap.

Once you select a Schedule Pair, Sisukas identifies every remaining overlap and
turns each one into an explicit Decision Slot that requires a choice.

## Example: The 11:00–12:00 Overlap

You've selected a Schedule Pair where:

- **CS Lecture** runs Monday 11:00–12:00  
- **MATH Lecture** also runs Monday 11:00–12:00  

This overlap becomes a Decision Slot.

> [!IMPORTANT]
> At this point, you are no longer choosing between schedules. You are choosing how you will actually spend that hour.

## Your Options

For each Decision Slot, you explicitly decide how to handle it.

### Option A: Attend CS (Primary)

- Mark CS as **Primary**
- Mark MATH as **Secondary**
- *System action:*  
  Your calendar shows CS. MATH is treated as recorded or self-study.

### Option B: Attend MATH (Primary)

- Mark MATH as **Primary**
- Mark CS as **Secondary**
- *System action:*  
  Your calendar shows MATH.

### Option C: Split Attendance

- Attend part of CS, then part of MATH
- *System action:*  
  Both study groups are marked as **Partial**.

## Why This Leads to Better Planning

Making these decisions explicit has important effects:

1. **No hidden state**  
   You don't have to remember what you planned to skip — the system records it.

2. **A truthful calendar**  
   Your exported calendar reflects what you actually plan to attend, not every
   overlapping possibility.

> [!TIP]
> Over time, you can see which courses repeatedly forced compromises and where your workload pressure came from.

## How This Fits into the Planning Flow

Decision Slots are the final step where plans turn into commitments:

**[Discover](../filtering/) → [Plan](../plans/) → [Optimize](../schedule-pairs/) → Decide**

## What Comes Next?

Reflection and workload tools will build on Decision Slot data to help you
understand your patterns across a semester.

For now, see:

- [The Big Picture](../overview/) – How all phases connect
- [Planning Architecture](../../architecture/planning/) – How Decision Slots are implemented
