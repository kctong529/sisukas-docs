---
weight: 5
title: "Conflicts in Decision Slots"
---

See [Plans](../plans/) for how blocks are composed and 
[Schedule Pairs](../schedule-pairs/) for how they're ranked.

## What is a Decision Slot?

A **Decision Slot** is a time interval where blocks from different courses overlap, 
forcing you to choose which one to prioritize.

After you've built a [Schedule Pair](../schedule-pairs/) with CS and MATH, you might 
have chosen:

- **CS-A1110:** Lecture Mon/Wed 10-12, Exercise Tue 14-16
- **MATH-A1020:** Lecture Mon/Wed 11-13, Exercise Tue 15-17

These overlap:
- **Mon/Wed 11-12:** During both lectures
- **Tue 14-15:** During both exercises

Each overlap is a Decision Slot. You must choose.

## Why Make Trade-Offs Explicit?

Most students have overlapping events. That's normal. What's not normal is 
pretending they don't exist.

**Without Decision Slots:** Calendar shows both events. You "handle it somehow" 
(skip one, watch recording, arrive late). Nothing explicit, nothing remembered.

**With Decision Slots:** You mark one as primary, the other as secondary. 
The system remembers your choice: "You prioritize CS lectures over MATH lectures."

This explicitness matters because:
1. You think about priorities (not defaults)
2. You know your actual commitments (not theoretical max)
3. You can plan accordingly (watch recordings on specific days, coordinate with friends)
4. The pattern feeds into future planning (reflection: which courses demanded most sacrifices?)

## Example Decision

You've chosen CS lecture (10-12) + MATH lecture (11-13). They overlap 11-12.

**Decision Slot: Monday/Wednesday 11-12**

Your options:
- **Option A:** Attend CS (primary), skip MATH (secondary)
  - Mark: "CS lecture primary, MATH lecture secondary"
  - Plan: Watch MATH recording Tuesday evening
  - Implication: Need recordings available

- **Option B:** Attend MATH (primary), skip CS (secondary)
  - Mark: "MATH lecture primary, CS lecture secondary"
  - Plan: Watch CS recording Thursday
  - Implication: CS lectures must be recorded

- **Option C:** Attend both (split attendance)
  - Arrive 11 mins late to CS, OR leave MATH 12 mins early
  - Mark: "Both primary, partial overlap"
  - Implication: Lose 10-15 mins of content in both

You choose based on:
- Which course needs live attendance?
- Which has good recordings?
- What can you live with?

## Why This Leads to Better Planning

By being explicit about trade-offs, you:
- Build a semester you actually understand
- See patterns (which courses demanded sacrifices)
- Plan better next semester (avoid same mistakes)
- Feel more in control (you chose this, not a scheduling algorithm)

## What comes next?

Phase 3 of semester planning will include reflection tools to understand
your patterns. For now, see:

- [The Big Picture](../overview/) – See all three phases
- [Planning Architecture](../../architecture/planning/) – How phases are built
