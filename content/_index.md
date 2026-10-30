---
weight: 1
title: "Sisukas Documentation"
layout: docs
bookFlatSection: true
description: "Learn how to use, understand, and contribute to Sisukas."
---

> [!NOTE]
> New to Sisukas? Start with [Getting Started](../getting-started/). If you're interested in the implementation, begin with the [System Overview](../system-overview/).

# Sisukas Documentation

[![CI Pipeline](https://github.com/kctong529/sisukas/actions/workflows/ci.yml/badge.svg)](https://github.com/kctong529/sisukas/actions/workflows/ci.yml)
[![PyPI](https://img.shields.io/pypi/v/sisu_wrapper?label=sisu-wrapper)](https://pypi.org/project/sisu-wrapper/)
[![Live App](https://img.shields.io/badge/app-sisukas.eu-green)](https://sisukas.eu/)

Sisukas helps Aalto University students discover courses, explore schedules, and plan their studies. It complements the official SISU system rather than replacing registration or other university services.

## Find your way

- **[Getting Started](../getting-started/)** — Start using Sisukas.
- **[Concepts](../concepts/)** — Understand filtering, plans, and schedule combinations.
- **[System Overview](../system-overview/)** — See how the application and services fit together.
- **[Architecture](../architecture/)** — Explore the planning models and design decisions.
- **[Developer Guide](../dev-guide/)** — Set up the project and understand its data pipelines and APIs.
- **[Security](../securities/)** — Learn about authentication, authorization, and database security.

For features still being designed, see [Under Development](../under-dev/).

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

## Project status

Course discovery, saved filters, bookmarks, and core planning functionality are implemented. Some scheduling interactions are still evolving; decision slots remain a design proposal. The documentation distinguishes implemented behavior from planned work on the relevant pages.

## Contributing

Sisukas welcomes bug reports, discussions, and contributions. For technical context and local setup, see the [Developer Guide](../dev-guide/).

## License

MIT. See the [LICENSE](https://github.com/kctong529/sisukas/blob/main/LICENSE) file.
