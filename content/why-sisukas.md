---
weight: 3
title: "Why Sisukas: The Problem"
---

# Why Sisukas: Understanding the Problem

## The SISU Friction

SISU is the official course information and registration system for Finnish universities. It works, but it's not designed with student experience in mind. The system creates unnecessary friction at every step of course exploration and planning.

The problem isn't that SISU is *hard* to use—it's that it's *tedious*. Every exploration feels like commitment. Every action requires multiple steps. Critical information is buried behind repeated clicks.

## The Information Architecture Barrier

At the heart of SISU's friction lies a fundamental design choice: **details are hidden behind many clicks**. The information exists, but accessing it requires repeated navigation.

Course details *are* technically available, but the path to view them is tedious:

```
Current SISU Flow (to see a course's schedule):
1. Find course in catalog
2. Click into course details
3. Scroll down to find schedule info
4. Schedule might be in a sidebar or separate section
5. Exercise groups (H01, H02, etc.) are collapsed/hidden
6. Expand one group at a time
7. Want to compare with another course? Repeat from step 1
8. Can't see two courses' schedules side-by-side
```

### The Friction Problem

This design creates significant friction. The real issue isn't that you can't see details—it's that every comparison is tedious:

- "To compare two courses' schedules, I have to toggle back and forth?"
- "Why can't I see multiple exercise groups side-by-side?"
- "I have to click through weeks one at a time?"
- "This takes forever for what should be a quick comparison."

The hesitation comes from effort, not rules. Many students stick with familiar courses because exploring alternatives requires so much effort. The barrier isn't technical—it's **friction disguised as user experience**.

## The Technical Friction

Beyond the psychological barrier, there's significant mechanical friction:

**Adding courses requires committing to a study plan.** You can't peek at a course's schedule without adding it to your plan first.

**Schedule details are hidden.** Exercise groups (H01, H02, etc.) are crammed into a narrow sidebar that shows only one at a time. Comparing groups means toggling back and forth, relying on memory.

**The calendar view is isolating.** It shows only one week at a time, making it impossible to see the semester's rhythm at a glance.

**Comparing courses is painful.** You juggle multiple tabs or windows, copying information manually to keep track.

**Removal feels like error correction.** Taking a course off your plan triggers confirmation prompts, reinforcing the sense that it was a mistake.

## The Information Architecture Problem

SISU's sidebar presents a classic information density problem:

```
Narrow Sidebar (~300px):
┌─────────────────────────────────┬────────────────┐
│                                 │ Study Groups   │
│        Calendar View            │ ○ H01          │
│        (Main Content)           │   Thu 16:15-18:00
│                                 │ ○ H02          │
│                                 │   Thu 14:15-16:00
│                                 │ ○ H03          │
│                                 │   Fri 12:15-14:00
│                                 │ (scroll for more)
└─────────────────────────────────┴────────────────┘
```

Only one group expands at a time. To compare, you expand H01, memorize it, collapse, expand H02, memorize it, repeat. It's sequential access in a world that demands parallel thinking.

**The problems:**
- Only one group visible at a time
- Users must rely on memory to compare
- Endless scrolling
- No visual differentiation—everything looks identical
- Low information density
- Poor usability on mobile

## The Calendar Problem

Even after navigating all this, the calendar view creates another frustration: it shows only one week at a time.

```
SISU Calendar (One Week at a Time)
┌──────────────────────────────────────────────────────────────────────────┐
│ Week 38: Sept 16-22, 2025               [< >]                           │
├──────────────┬──────────────┬──────────────┬──────────────┬──────────────┤
│ Mon          │ Tue          │ Wed          │ Thu          │ Fri          │
├──────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ 9-12         │              │ 14-16        │              │              │
│ Lecture      │              │ Exercise     │              │              │
└──────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

To understand a semester's rhythm, you click through 12+ weeks, mentally stitching patterns together. This makes pattern recognition nearly impossible. You can't see irregular sessions, overlapping events, or cumulative workload at a glance.

## What Students Actually Need

Students aren't asking for a revolution. They want a place to explore safely—a space where curiosity doesn't feel like commitment.

The ideal flow separates exploration from commitment:

1. Browse interesting courses
2. Add to favorites (no commitment)
3. Instantly see all schedules in one view
4. Toggle between group options (instant update)
5. Compare courses side by side
6. Remove freely (no guilt, no confirmation)
7. Only commit when ready → Proceed to SISU

The key insight: **separate the exploration phase from the commitment phase**.

## Mental Models Comparison

| Concept | SISU (Current) | Ideal (Sisukas) |
|---------|---|---|
| Study Plan | Serious, official commitment | Flexible workspace |
| Add Course | Declaration of intent | "Just looking" |
| Calendar | My real schedule | Sandbox for possibilities |
| Overall | Bureaucratic form-filling | Exploratory, visual, low-friction |

This shift reframes the entire experience from bureaucratic gatekeeping to creative discovery.

## Looking Beyond Discovery

The friction extends beyond initial discovery. SISU also offers very limited support for *planning*—the process of actually assembling a coherent semester.

Courses are presented mostly in isolation. Scheduling conflicts are treated as something to avoid entirely, rather than something students routinely work around. But in practice, students frequently deal with overlapping lectures, exercises, or exams. They make trade-offs, skip sessions, watch recordings later, or prioritize one course over another.

SISU ignores this reality. Sisukas builds around it instead.

## The Sisukas Approach

Sisukas starts by addressing the immediate friction:

1. **Fast, cached discovery** — No network delays. Search and filter thousands of courses instantly.
2. **Zero-commitment exploration** — Browse and compare without declaring intent.
3. **Visual clarity** — See schedules, groups, and conflicts at a glance.
4. **Natural filtering** — Complex queries without learning a query language.

But we're also building toward something bigger: support for real planning, where conflicts are surfaces clearly and students make explicit trade-offs about which events to prioritize.

---

**Next:** Learn how [filtering works in Sisukas](../concepts/filtering/) and why it's designed the way it is.