---
weight: 3
title: "Why Sisukas: The Problem"
---

# Why Sisukas: Understanding the Problem

## The Real Problem with SISU

> [!NOTE]
> SISU works. Finnish universities have successfully used it for years to manage course catalogs and registration. The problem isn't that it's broken. It's that it's solving the wrong problem.

On the surface, SISU is tedious. Finding a course's schedule requires clicking through multiple screens. Comparing two courses means toggling between tabs and relying on memory. Adding a course feels like a commitment before you've really decided. But these aren't just UX paper cuts. They're symptoms of a deeper mismatch.

Fundamentally, SISU is a course catalog and registration system. It does what it's designed for well: helping students find specific courses and register for them. But it doesn't support planning. It doesn't help with the actual work of assembling a coherent semester.

## Planning Is Not Registration

This distinction matters. Planning and registration are fundamentally different activities with different needs.

Registration is straightforward: you know what course you want, you navigate to it, you enroll. SISU does this well.

Planning is messier. It's exploratory. It's iterative. It requires understanding how courses interact with each other and with your own constraints. Real planning involves questions SISU can't answer: Which courses can I realistically take together? Where are the conflicts, and which ones can I live with? How does this semester feel as a whole, in terms of pace and difficulty? What if I choose something different?

> [!IMPORTANT]
> Planning requires seeing the whole picture at once, making trade-offs consciously, testing combinations, and adjusting based on what you learn. SISU assumes none of this is necessary.

## Why SISU Assumes Planning Is Simple

SISU's design rests on a specific assumption: most students follow the recommended curriculum. You find the recommended courses for the year, you register for them, you're done.

This assumption breaks down immediately when students deviate from that path. Most do. Whether exploring electives, taking courses from other programs, combining multiple majors, or simply going beyond minimum requirements, students need to actively discover and compare courses. SISU assumes this discovery isn't necessary.

The friction everyone experiences (the hidden details, the tedious calendar navigation, the way all events feel mandatory) isn't a design oversight. It's structural consequences of this assumption. They exist because the system was designed for predetermined paths, and real students are trying to use it for actual planning.

## The Mechanics of Friction

> [!TIP]
> The friction shows up in concrete ways. To compare two courses' schedules in SISU, there are two existing ways. Both require sign-in first (which involves 2FA with the convoluted Microsoft Authenticator).

### Comparison Without Adding to the Plan

1. Find the first course in the catalog
2. Click into course details
3. Navigate to "completion methods" tab
4. Scroll down to find the specific course instance
5. Navigate to "Groups and study events" tab
6. Look at one of the study groups (with segmented events not necessarily grouped in a comprehensible manner)
7. Switch to the second course and repeat
8. Hope you remember what the first course looked like

### Comparison With the Calendar View

1. Find both courses in the catalog
2. Copy course name/code
3. Navigate to study plan
4. Paste the course name/code to e.g. electives sidebar
5. Add course to plan
6. Open course page from plan
7. Choose completion method
8. Add to registration panel
9. Navigate to calendar view
10. Look at the corresponding courses
11. Scroll and toggle exercise groups
12. Calendar updates
13. See the conflicts

This isn't complicated, but it's tedious. The psychological impact is real. Many students stick with familiar, safe course choices because exploring alternatives requires so much effort. The barrier isn't technical. It's friction that discourages exploration. That friction adds up. Students play it safe and miss out on better options.

## What SISU Actually Supports

SISU is excellent at one set of activities and silent on others:

| Activity | SISU | What's Missing |
|---|---|---|
| Find a course (if you know what you want) | Strong catalog search |  |
| Discover courses beyond requirements | Poor | Effective discovery tools |
| Register for a course | Strong enrollment system |  |
| Plan a semester (explore combinations, understand interactions) | ✗ Missing | Composition, comparison, iteration |

SISU assumes discovery isn't hard and planning isn't necessary. For students following the recommended path, this works fine. For ambitious students, elective explorers, or anyone venturing beyond the curriculum, the system becomes an obstacle.

## What Students Actually Need

The core problem is that SISU gives you a catalog and a registration form. It doesn't give you a place to think.

> [!IMPORTANT]
> Students need a workspace for exploration. A place where they can see courses in combination, visualize where conflicts happen, understand the impact of their choices before committing. They need to be able to treat events as choices, not mandates.

Here's what this means in practice: a lecture might conflict with work or have a remote alternative. An exercise group might be critical for your learning style, while another is optional. Some events matter to you; others don't. But SISU marks every lecture as mandatory. Students know they won't attend, but the events stay on the calendar as noise: visual clutter that makes it harder to see what actually matters. This noise makes planning harder, not easier.

The system presents the curriculum as fixed. Every event is equally important. You can only consume what the system offers, not compose what works for you.

## Building a Better Model

Sisukas starts from a different premise. It acknowledges that students are pragmatic. 
They make real decisions about trade-offs, priorities, and what works for their lives. 
Real planning means making these choices explicit, not pretending they don't happen.

### What Sisukas Does

Sisukas is a course discovery and planning workspace with two core capabilities:

**1. Fast course discovery** powered by intelligent filtering. Instead of browsing 
a static course list, you build expressive queries: "Period II courses from my major 
or taught by my favorite instructor." Filters are saved and shareable. 
[Learn more about filtering](../concepts/filtering/).

**2. Early-stage planning** where you group courses into Plans and explore how study 
groups combine. See where conflicts exist and make explicit trade-offs about which 
events matter. [See the planning vision](../concepts/planning/).

### What's Available Now

The application is live at [sisukas.eu](https://sisukas.eu) with:
- Fast course search and filtering across the full course catalog
- Ability to save filters and share via short URLs
- Bookmark courses and track instances for upcoming semesters

Planning features (Plans, SchedulePairs, Decision Slots) are currently in development. 
See [Semester Planning](../concepts/planning/) for the roadmap.

### Next Steps

- **[Getting Started](../getting-started/)** – Run locally or use the live app
- **[How Filtering Works](../concepts/filtering/)** – Deep dive into the query system
- **[Semester Planning Vision](../concepts/planning/)** – See what's coming