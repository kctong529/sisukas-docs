---
weight: 1
title: ""
layout: docs
bookFlatSection: true
---

# Sisukas Documentation

[![CI Pipeline](https://github.com/kctong529/sisukas/actions/workflows/ci.yml/badge.svg)](https://github.com/kctong529/sisukas/actions/workflows/ci.yml)
[![PyPI](https://img.shields.io/pypi/v/sisu_wrapper?label=sisu-wrapper)](https://pypi.org/project/sisu-wrapper/)
[![Live App](https://img.shields.io/badge/app-sisukas.eu-green)](https://sisukas.eu/)

Sisukas is a course discovery and study planning tool designed for university students in the Finnish education system. It prioritizes speed, clarity, and decision-making support, complementing rather than replacing the official SISU system.

## Quick Navigation

**Getting Started?**
- **[Getting Started](../getting-started/)** – Set up locally or access sisukas.eu
- **[Why Sisukas?](../why-sisukas/)** – Understand the problem we're solving

**Want to Understand Our Approach?**
- **[The Big Picture](../concepts/overview/)** – Why we design this way, the three-phase planning vision
- **[How Filtering Works](../concepts/filtering/)** – The philosophy and design of our discovery system
- **[Planning Concepts](../concepts/plans/)** – Plans and the composable block model
- **[Schedule Pairs & Decision Slots](../concepts/)** – How planning moves from exploration to commitment

**Ready to Implement?**
- **[Planning Architecture](../architecture/planning/)** – How Plans, Schedule Pairs, and Decision Slots are built
- **[API Reference](../api/)** – Available endpoints
- **[Data Pipeline](../data-pipeline/)** – How course data is maintained and updated

**Looking for System Details?**
- **[Data Pipeline](../data-pipeline/)** – Course data architecture
- **[Environment Variables](../env-reference/)** – All configuration options
- **[Security](../securities/)** – Authentication and data protection
- **[Makefile Reference](../makefile/)** – Build commands
- **[Local HTTPS Setup](../local-https/)** – HTTPS in development

## Common Scenarios

**"I just want to find courses"**
→ Go straight to [sisukas.eu](https://sisukas.eu) or see [Getting Started](../getting-started/)

**"I want to understand what this is"**
→ Start with [Why Sisukas?](../why-sisukas/) (5 min read)

**"I want to plan a semester thoughtfully"**
→ Read [The Big Picture](../concepts/overview/) then [Planning Concepts](../concepts/plans/)

**"I want to understand how filtering works**
→ See [How Filtering Works](../concepts/filtering/) and try it live

**"I want to self-host or contribute"**
→ See [Getting Started](../getting-started/) and [Planning Architecture](../architecture/planning/)

**"I want API access"**
→ See [API Reference](../api/) and [Data Pipeline](../data-pipeline/)

## Terminology

As you read Sisukas documentation, you'll encounter these core concepts:

| Term | Definition | Example |
|------|-----------|---------|
| **Course** | An abstract course that is stable across semesters | CS-A1110 Introduction to Programming |
| **Course Instance** | A specific semester offering of a course with specific dates, study groups, and schedules | CS-A1110 Autumn 2025 |
| **Plan** | A flexible workspace where you group course instances for a specific semester; exploration only, not commitments | "Spring 2025 Exploration" containing 4–5 course instances |
| **Study Group** | A specific section within a course (e.g. "Exercise Group H01" or "Lecture"). The granular scheduling unit you actually attend — or deliberately skip. This is a real SISU concept | Exercise H01, Lecture |
| **Block** | Sisukas's way of grouping study groups by type (lectures, exercises, exams). For each course, you pick one study group from the Exercise Block (lectures and exams are usually fixed) | Exercise Block: [H01, H02, H03] |
| **Schedule Pair** | An optimized combination of study group choices from multiple courses, ranked by how well they fit together (fewest conflicts first) | CS-A1110 (Mon 10:00 lectures + Tue 14:00 exercises)<br/>+ MATH-A1020 (Thu 13:00 lectures + Wed 15:00 exercises) |
| **Decision Slot** | A time interval where your study group choices from different courses overlap, requiring you to choose which one to prioritize | Tue 14:00–15:00: CS exercise vs. MATH lecture |

## Running Locally

### Quick Start

Install [uv](https://docs.astral.sh/uv/) and [Node.js](https://nodejs.org/) v18+, then:
```sh
git clone https://github.com/kctong529/sisukas.git
cd sisukas
make setup        # Creates venvs, installs dependencies
```

**Frontend:**
```sh
cd frontend/course-browser && npm run dev
# Opens at http://localhost:5173
```

See [Getting Started](../getting-started/) for full setup instructions including backend services.

## Quick Status

| Feature | Live | Local | Notes |
|---------|------|-------|-------|
| Course discovery | ✅ | ✅ | Full search & filtering |
| Bookmarks | ✅ | ❌ | Requires sign-in |
| Plans | ✅ | ❌ | Database ready, limited UI |
| Schedule Pairs | 🔨 | ❌ | Algorithm designed |
| Decision Slots | 📋 | ❌ | Designed, not built |

## Contributing

Sisukas welcomes discussions, ideas, and contributions. The project is still evolving, so feedback on concepts and design is particularly valuable at this stage.

See [Contributing](../contributing/) for details.

## License

MIT. See [LICENSE](https://github.com/kctong529/sisukas/blob/main/LICENSE) file.
