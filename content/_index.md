---
weight: 1
title: "Sisukas Documentation"
layout: docs
bookFlatSection: true
description: "Entry point for Sisukas docs: getting started, core concepts, architecture, and developer reference."
---

# Sisukas Documentation

[![CI Pipeline](https://github.com/kctong529/sisukas/actions/workflows/ci.yml/badge.svg)](https://github.com/kctong529/sisukas/actions/workflows/ci.yml)
[![PyPI](https://img.shields.io/pypi/v/sisu_wrapper?label=sisu-wrapper)](https://pypi.org/project/sisu-wrapper/)
[![Live App](https://img.shields.io/badge/app-sisukas.eu-green)](https://sisukas.eu/)

Sisukas is a course discovery and study planning tool designed for university students in the Finnish education system. It prioritizes speed, clarity, and decision-making support, complementing rather than replacing the official SISU system.

## Quick Navigation

**Getting Started?**
- **[Getting Started](../getting-started/)** – High-level entry point and paths for different users
- **[Why Sisukas?](../why-sisukas/)** – The motivation and problem framing
- **[Running Sisukas Locally](../dev-guide/running-locally/)** – Authoritative local development setup (HTTPS, backend, services)

**Want to Understand Our Approach?**
- **[The Big Picture](../concepts/overview/)** – Planning philosophy and mental model
- **[How Filtering Works](../concepts/filtering/)** – The philosophy and design of our discovery system
- **[Planning Concepts](../concepts/plans/)** – Plans and the block-based planning model
- **[Schedule Pairs & Decision Slots](../concepts/)** – Exploring combinations and making trade-offs explicit
- **[Year Timeline](../concepts/year-timeline/)** – Seeing your academic year as a whole

**Ready to Implement?**
- **[Planning Architecture](../architecture/planning/)** – How core planning concepts are implemented
- **[Developer Guide](../dev-guide/)** – System internals, APIs, data flow, and operations

**Looking for Reference material?**
- **[API Reference](../dev-guide/api/)** – Backend and SISU wrapper endpoints
- **[Data Pipeline](../dev-guide/data-pipeline/)** – Course data ingestion and distribution
- **[Environment Variables](../dev-guide/env/)** – Configuration and secrets
- **[Makefile Reference](../dev-guide/makefile/)** – Tooling and automation
- **[Security](../securities/)** – Authentication and data protection

## Common Scenarios

**"I just want to find courses"**  
→ Go straight to [sisukas.eu](https://sisukas.eu) or see [Getting Started](../getting-started/)

**"I want to understand what this is"**  
→ Start with [Why Sisukas?](../why-sisukas/) (5 min read)

**"I want to plan a semester thoughtfully"**  
→ Read [The Big Picture](../concepts/overview/), use the [Year Timeline](../concepts/year-timeline/) for context, then dive into [Planning Concepts](../concepts/plans/)

**"I want to run this locally or contribute"**  
→ Start with [Running Sisukas Locally](../dev-guide/running-locally/), then the [Developer Guide](../dev-guide/)

**"I want API or system details"**  
→ See the [Developer Guide](../dev-guide/) and [API Reference](../dev-guide/api/)

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

## Quick Status

| Feature | Status | Notes |
|--------|--------|-------|
| Course discovery | ✅ | Fast, cached filtering over full course catalog |
| Saved filters | ✅ | Shareable URLs via Filters API |
| Bookmarks | ✅ | User-scoped persistence |
| Plans | ✅ | Core workflow implemented |
| Schedule Pairs | 🟡 | Core logic implemented, UI evolving |
| Decision Slots | 📋 | Designed, not yet implemented |

## Contributing

Sisukas welcomes discussions, ideas, and contributions. The project is still evolving, so feedback on concepts and design is particularly valuable at this stage.

## License

MIT. See [LICENSE](https://github.com/kctong529/sisukas/blob/main/LICENSE) file.
