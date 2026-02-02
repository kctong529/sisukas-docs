---
weight: 5
title: "Course Feedback System"
description: "How Sisukas collects concrete, experience-based course feedback."
---

## For Students: Understanding Course Feedback

### What This Will Show You

This feedback will be about one specific instance of a course (spring 2025, autumn 2024, etc), not the course in general. It will tell you concrete facts about how the course actually runs: whether attendance matters, what the exam looks like, how responsive the teacher is.

> [!TIP]
> The feedback will come from students who took it. You'll be able to see what surprised them, what they wish they'd known, and how they'd describe the experience.

---

### Can You Actually Do This Course?

#### Time & Attendance

**How important is showing up?**

- **Mandatory for passing** — You can't pass without attending
- **Mandatory for high grade** — You can pass without it, but top grades need attendance
- **Bonus** — Helps your grade, but not required
- **Optional** — You can skip it without penalty

**How are lectures & exercises delivered?**

- **Physical only** — No recordings
- **Video recordings** — Sessions are recorded

#### What Will Wreck Your Grade?

**When do you take the exam?**

- **Fixed schedule** — Everyone at the same time, like a traditional exam
- **Self-booked** — You pick your exam slot

**What's the exam actually like?**

- **Written short-answer**
- **Multiple choice**
- **Oral**

**Can you prepare from past exams?**

- **Representative** — Past exams are available and actually match what you'll see
- **Available but not useful** — They exist but don't help much
- **Not available** — You can't access them

**Can you bring notes?**

- **Allowed** — Cheatsheet is okay
- **Not allowed** — You go in cold

**What else counts toward your grade?**

- **Presentations** — One or more presentations are part of the course
- **Project work** — Includes a substantial project component

#### Will You Get Help?

**How responsive is the teacher?**

- **Never replies** — Messages typically get ignored
- **Replies in days** — You usually wait several days for a response
- **Fast replies** — Responses come quickly and consistently

**Is the course organized?**

- **Messy** — Instructions unclear, multiple platforms, deadlines confusing
- **Manageable** — Some rough edges, but you can figure it out
- **Well structured** — Clear instructions, consistent organization

---

### What People Are Actually Saying

#### Quick Read: Tags

> [!NOTE]
> These will be the patterns students mention. They will often contradict each other, and that's intentional. A course can be "Challenging but rewarding" *and* "Heavy workload."

**Teaching**
- Amazing teacher
- Bad teaching
- Lectures worth going to
- Lectures not worth attending
- No one shows up to lectures

**Difficulty & Workload**
- Easy 5
- Grade grinder
- Heavy workload
- Brutal exam
- Challenging but rewarding
- Painful and pointless

**Exams & Assessment**
- Exam decides everything
- Project carries the grade
- Grading feels random
- Impossible to get a high grade

**Value & Outcomes**
- Actually useful
- Builds real skills
- Career-relevant
- Feels like busywork
- Too theoretical to matter

**Overall**
- Hidden gem
- Overhyped
- Would take again
- Regret taking this
- Avoid at all costs

#### The Full Stories

You'll be able to read what students wrote. They'll tell you what the boxes above don't capture: the vibe, what surprised them, what they'd do differently.

---

### Understanding Their Perspective

**What will they share about their background?**

Each person will share their background going in. This helps you understand what their experience actually means for you.

They'll enter it as: **Area: Topic → Comfort Level**

Examples:
- *Math: Epsilon-delta → Comfortable* → "This course was harder than expected" (from someone comfortable with abstract math)
- *Programming: Version control → No experience* → "Well-paced with clear instructions" (from someone new to Git/etc)
- *Writing: Academic → Struggle* → "Really insightful on essay structure" (from someone who's struggled with papers before)

> [!IMPORTANT]
> The same course feels completely different depending on where you're starting from. If your background is similar to theirs, their experience probably applies to you.

---

## For Maintainers: Design Rationale

### Core Principles

1. **No vague scales**
   - No agree-disagree ranges, no numeric ratings
   - Every option must be concrete and interpretable without explanation

2. **Keywords for input, stories for texture**
   - Structured fields are factual and scannable
   - Tags and free-form text capture personality and edge cases

3. **Structure over mandatory verbosity**
   - Structured fields carry the signal
   - Free-form text is optional but welcomed

4. **Instance-level accuracy**
   - Feedback always ties to a specific course instance (term + year)
   - Not a general "course code" rating that persists across changes

5. **Low cognitive load for contributors**
   - Experience-based language
   - No interpretation required to submit

6. **Personality lives in tags and stories**
   - Structured fields stay factual
   - Tags are allowed to be sharp, opinionated, emotional
   - Free-form text lets storytellers shine

---

### Structured Fields Design

All structured inputs are:
- Mutually exclusive where applicable (exactly one choice per question)
- Concrete and tied to observable reality
- Keyword-style labels only
- Free of hidden interpretation scales

**Rationale for each category:**

**Attendance & Delivery** — Directly affects planning. Students need to know if they can pass while working, if lectures are mandatory, if they can catch up via recording.

**Exams & Assessment** — Determines study strategy and stress level. Knowing "past exams exist but don't help" is actionable in a way that "exam difficulty: 7/10" is not.

**Teacher Responsiveness** — Captures observed behavior, not intent. A teacher who never replies *can't* be defended as "busy"—the data is the experience.

**Organization** — Affects mental load. "Messy" vs "well structured" maps to concrete friction (multiple platforms, unclear deadlines, etc).

---

### Tag System

Tags are:
- **Multi-select, non-exclusive** — A course can be "Challenging but rewarding" and "Heavy workload" simultaneously
- **Curated, not user-generated** — Prevents dilution and maintains signal
- **Intentionally sharp** — "Brutal exam" is better than "difficult exam." "Bad teaching" is more honest than "could improve."
- **Expected to disagree** — If all tags align, you've lost information
- **Allowed to highlight extremes** — Not every course is average, and tags should reflect that

**Why this works:** Students recognize themselves in sharp language. "Overhyped" tells you something "Moderately popular" never could.

---

### Free-Form Text

**Role:** Explanation, edge cases, advice, vibe.

**Characteristics:**
- Optional
- No minimum length requirement
- Reasonable maximum (3,000–5,000 characters)
- Markdown optional

**UX behavior:**
- Empty text is fully valid
- Very short text may trigger a non-blocking hint ("Anything else future students should know?")
- No hard validation based on content length

**Quality signals (for ranking/moderation, non-blocking):**
- Extremely generic content
- Obvious spam
- Copy-paste artifacts

**Design note:** Free-form feedback is where the texture and honesty lives. Don't over-police it. A well-written paragraph from one student is often more useful than perfectly-structured data from ten.

---

### Personal Background Context

**Purpose:** Interpretability, not categorization.

**Design intent:**
- Intentionally flexible
- Free-form but guided
- No enforced taxonomy
- Examples show typical usage, not required entries

**Structure:** Multiple entries allowed. Each has:
- **Area** (free text) — Broad domain (math, programming, writing, etc)
- **Topic** (free text) — Specific concept or skill (calculus, version control, essays, etc)
- **Comfort Level** (exactly one) — Comfortable / Struggle / No experience

**Example:** 
- *Area: Math → Topic: Calculus → Struggle*
- *Area: Programming → Topic: Version control → No experience*

**How readers use it:** "This person struggled with calculus and they're saying the course is math-heavy, so maybe that's relevant to me."

---

### Aggregation & Future Work

**Current approach:**
- Structured fields are the primary aggregation source (countable, comparable)
- Tags provide fast qualitative signals (frequency, clustering)
- Free-form text remains supplementary (searchable, readable)

**Expected behavior:**
- Disagreement is visible and expected
- Feedback is always instance-specific
- No averaging or smoothing that would hide real variation

**Known gaps:**
- Temporal tracking: Need clear timestamps so students know which term/year they're reading about
- Course changes: If a course significantly changes format, old feedback should be clearly marked as out-of-date
- Verification: Future versions might tie feedback to actual course enrollment (anonymous but verifiable)

---

### Explicit Non-Goals

- Agree–disagree scales or Likert ratings
- Numeric ratings of any kind
- Mandatory long text
- Polite but meaningless feedback
- "Instructor quality" contests
- Categorizing students by background (using it for profiling, not interpretation)

---

### Status

- **Current status:** Design specification, not yet implemented
- **Target release:** Post–v1.0.0 of Sisukas
- **Design stance:** Opinionated, concrete, expressive where it matters. Honest over diplomatic.
