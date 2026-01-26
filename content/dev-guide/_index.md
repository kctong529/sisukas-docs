---
title: "Developer Guide"
weight: 6
---

The Developer Guide is for contributors who want to understand how Sisukas is built, deployed, and operated in practice. It focuses on implementation details, system boundaries, and operational concerns rather than product philosophy or user-facing behavior.

This section assumes familiarity with the core concepts (Plans, Schedule Pairs, Decision Slots) and the overall system structure. If you are new to the project, start with the System Overview and Concepts sections before diving in here.

The guides in this section cover:

- how course data is fetched, transformed, and distributed,
- how backend services are structured and deployed,
- how frontend and backend responsibilities are divided,
- how configuration, environments, and secrets are managed,
- and how to run, debug, and extend the system locally.

Use the Developer Guide when you want to modify behavior, add new features, understand data flow at the code level, or reason about operational trade-offs.

Individual pages are intentionally scoped and opinionated. Each document explains not just what the system does, but why it is structured that way, to help future contributors make changes without breaking core invariants.
