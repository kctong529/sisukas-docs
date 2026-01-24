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
- **[The Big Picture](../concepts/overview/)** – Why we design this way, the planning philosophy
- **[How Filtering Works](../concepts/filtering/)** – The philosophy and design of our discovery system
- **[Planning Concepts](../concepts/plans/)** – Plans and the block-based planning model
- **[Schedule Pairs & Decision Slots](../concepts/)** – Exploring combinations and making trade-offs explicit
- **[Year Timeline](../concepts/year-timeline/)** – Seeing your academic year as a whole

**Ready to Implement?**
- **[Planning Architecture](../architecture/planning/)** – How Plans, Schedule Pairs, and Decision Slots are built
- **[API Reference](../api/)** – Available endpoints

**Looking for System Details?**
- **[Data Pipeline](../data-pipeline/)** – How course data is maintained and updated
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
→ Read [The Big Picture](../concepts/overview/), use the [Year Timeline](../concepts/year-timeline/) for context, then dive into [Planning Concepts](../concepts/plans/)

**"I want to understand how filtering works"**  
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
| **Course Instance** | A specific semester offering of a course with dates, study groups, and schedules | CS-A1110 Autumn 2025 |
| **Plan** | A flexible workspace where you group course instances for a semester; exploration only, not commitments | "Spring 2025 Exploration" |
| **Study Group** | A specific session within a course (lecture, exercise, etc.) that you attend or deliberately skip | Exercise H01 |
| **Block** | A user-defined partition over study groups used during schedule computation. One study group is selected per block | Exercise Block: [H01, H02, H03] |
| **Schedule Pair** | A complete selection of study groups (one per block, per course), ranked by how well it fits with others | CS-A1110 + MATH-A1020 |
| **Decision Slot** | A time interval where selected study groups overlap, requiring an explicit attendance decision | Tue 14:00–15:00 |

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
| Schedule Pairs | 🔨 | ❌ | Core logic implemented, UI pending |
| Decision Slots | 📋 | ❌ | Designed, not yet implemented |

## Contributing

Sisukas welcomes discussions, ideas, and contributions. The project is still evolving, so feedback on concepts and design is particularly valuable at this stage.

See [Contributing](../contributing/) for details.

## License

MIT. See [LICENSE](https://github.com/kctong529/sisukas/blob/main/LICENSE) file.
