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

**New to Sisukas?** Start here:
- **[Getting Started](../getting-started/)** — Set up locally or access the live application
- **[The Problem We're Solving](../why-sisukas/)** — Understand the friction in course discovery and planning

**Want to understand how it works?**
- **[Discovery & Filtering](../concepts/filtering/)** — Deep dive into the filter architecture and design
- **[Planning & Scheduling](../concepts/planning/)** — How we're building semester planning and conflict-aware scheduling

**Looking for technical details?**
- **[Architecture](../architecture/)** — System design, components, and data flow
- **[API Reference](../api/)** — Filters API, SISU Wrapper, and integration points
- **[Contributing](../contributing/)** — Get involved with development

## Core Philosophy

Sisukas is built on a few key insights:

**Scheduling conflicts are inevitable, not errors.** Most students encounter overlapping lectures, exercises, or exams. Rather than pretending this doesn't happen, Sisukas surfaces conflicts clearly so students can make explicit trade-offs.

**Information should be easily accessible.** SISU buries details behind many clicks and repetitive navigation. Finding and comparing course schedules requires excessive effort. Sisukas puts information front and center, eliminating friction from the exploration process.

**Filtering should feel natural.** Complex requirements shouldn't demand query language expertise. The filter system uses a Blueprint-Builder-Rule pattern that maps directly to how people naturally think: establish boundaries, then specify what qualifies within those boundaries.

## Key Features

**Fast course discovery** powered by browser-cached data. Once loaded, searching and filtering thousands of courses happens instantly without network requests.

**Expressive filtering** using Boolean logic, date ranges, and multiple criteria. Save and share filter configurations via short URLs.

**Early-stage planning** with authenticated user features. Bookmark courses as favorites, track specific instances (semester offerings), and prepare for upcoming planning features.

## The Road Ahead

Sisukas is gradually evolving from course browsing toward comprehensive semester planning. This happens in phases:

**Phase 1 (Current):** Plans (collections of course instances) and SchedulePairs (optimized study group combinations)

**Phase 2 (Coming):** Decision Slots (explicit visibility into scheduling conflicts and trade-offs)

**Phase 3 (Future):** Comprehensive calendar views, workload tracking, and reflection tools

## Running Locally

### Prerequisites

Install [uv](https://docs.astral.sh/uv/) and [Node.js](https://nodejs.org/) v18+:
```sh
uv --version && node --version
```

### Quick Start
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

> [!NOTE]
> Sign-in doesn't work in local development due to BetterAuth cookie configuration. See [Getting Started](../getting-started/) for details.

**Backend services (optional):**
```sh
# Filters API
cd filters-api && uv run fastapi dev main.py

# Sisu Wrapper
cd sisu-wrapper && uv run fastapi dev api/main.py --port 8001
```

See the [Getting Started](../getting-started/) guide for detailed instructions.

## Contributing

Sisukas welcomes discussions, ideas, and contributions. The project is still evolving, so feedback on concepts and design is particularly valuable at this stage.

See [Contributing](../contributing/) for details.

## License

MIT. See [LICENSE](LICENSE) file.
