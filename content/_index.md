---
weight: 1
title: "Sisukas Docs"
layout: docs
bookFlatSection: true
description: "Guides to using, understanding, developing, and maintaining Sisukas."
---

# Sisukas Docs

[![CI Pipeline](https://github.com/kctong529/sisukas/actions/workflows/ci.yml/badge.svg)](https://github.com/kctong529/sisukas/actions/workflows/ci.yml)
[![PyPI](https://img.shields.io/pypi/v/sisu_wrapper?label=sisu-wrapper)](https://pypi.org/project/sisu-wrapper/)
[![Live App](https://img.shields.io/badge/app-sisukas.eu-green)](https://sisukas.eu/)

Sisukas helps Aalto University students discover courses, compare schedules, and plan their studies. It complements SISU; it does not register students for courses.

## Choose a starting point

| Section | Question it answers | Start here |
| --- | --- | --- |
| [Getting Started](./getting-started/) | How do I use the application? | Essential user workflows |
| [Concepts](./concepts/) | What do Sisukas's planning terms mean? | Plans, assemblies, and scheduling concepts |
| [System Overview](./system-overview/) | What are the main components and responsibilities? | One system-level map |
| [Architecture](./architecture/) | How does the system work, and why is it designed this way? | Contracts, invariants, data flows, and models |
| [Developer Guide](./dev-guide/) | How do I work on and operate the codebase? | Local setup, APIs, tests, and procedures |
| [Security](./securities/) | How is access controlled? | Authentication, authorization, and RLS scope |
| [Under Development](./under-dev/) | Which proposals are not yet fully implemented? | Clearly labeled future work |

## Project status

Course discovery, saved filters, bookmarking, and core planning are implemented. Study-group retrieval uses a shared in-memory runtime; full browser persistence of study groups is proposed. The Calendar has implemented visibility interactions, but authenticated persistence and attendance controls remain separate work. Consult each feature page for its precise status.

## Contributing

Start with [Local Development](./dev-guide/running-locally/) and [Architecture](./architecture/). Bug reports and contributions are welcome in the [Sisukas repository](https://github.com/kctong529/sisukas).

## License

MIT; see the [LICENSE](https://github.com/kctong529/sisukas/blob/main/LICENSE).
