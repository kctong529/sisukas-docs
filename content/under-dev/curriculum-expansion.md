---
weight: 2
title: "2026–2028 Curriculum Expansion"
description: "The first broad expansion of Sisukas curriculum filtering across Aalto's bachelor's majors, minors, and master's majors."
---

> [!NOTE]
> **Status: under development.** [Issue #61](https://github.com/kctong529/sisukas/issues/61) coordinates the first full-scale expansion of Sisukas's predefined curricula for 2026–2028. This page describes the scope, design decisions, and remaining work. For the concrete catalogue-verification procedure, see [Curriculum Metadata](../../dev-guide/curriculum-metadata/).

## Why this is a major milestone

Sisukas initially offered a limited selection of predefined curricula. Expanding that selection is not simply a matter of updating course lists for another academic year: it is the first attempt to provide broad, cross-school coverage of mainstream bachelor's majors, bachelor's/intermediate and advanced minors, and master's majors at Aalto University.

This changes who can use curriculum-based discovery and filtering. A student should not need to belong to one of a handful of previously supported programmes to find a relevant curriculum. At the same time, a larger catalogue makes ambiguous programme structures, translated names, module versions, and missing course references much harder to overlook.

> [!IMPORTANT]
> Full-scale coverage is a target, not a claim of completion. It means systematically covering the intended kinds of curricula across all six Aalto schools—not that every candidate has been verified, every possible study path has been modelled, or Sisukas can perform degree auditing.

## Intended coverage and boundaries

The expansion targets the official 2026–2028 curricula, while preserving earlier entries and existing selections:

| Curriculum type | What needs to be covered | Key considerations |
| --- | --- | --- |
| Bachelor's majors | Mainstream Finnish- and English-taught majors | Distinguish major studies from shared basic studies. |
| Minors | Bachelor's/intermediate and advanced-level minors | Verify level, distinct identities, and individual official sources. |
| Master's majors | Mainstream majors across Aalto's schools | Some programmes do not define separate majors; do not invent them. |

The scope is course discovery and predefined filter membership. It is not a full representation of degree regulations, eligibility, substitutions, registration, or graduation requirements.

The 2026–2028 work also introduces a stronger expectation of provenance: an included curriculum needs a defensible identity, validity period, official source, and verified course membership. Descriptive names or plausible module codes are not sufficient evidence.

## How the expansion is being built

The work proceeds in dependent, reviewable stages rather than bulk-importing everything at once.

1. **Discover candidates.** Gather candidate modules and their official Aalto sources across the six schools, including language variants and different study levels.
2. **Verify and deduplicate.** Establish which candidates are distinct curricula, translations, programme-level entries, or out-of-scope records. Confirm codes, periods, sources, and exceptions before accepting them ([#114](https://github.com/kctong529/sisukas/issues/114)).
3. **Extend the metadata contract.** Store official module identifiers, curriculum periods, and source URLs without breaking stable Sisukas keys and existing selections ([#115](https://github.com/kctong529/sisukas/issues/115)).
4. **Integrate in batches.** Populate the verified bachelor's majors, minors, and master's majors in the application metadata ([#116](https://github.com/kctong529/sisukas/issues/116), [#117](https://github.com/kctong529/sisukas/issues/117), [#118](https://github.com/kctong529/sisukas/issues/118)).
5. **Validate and maintain.** Check identities, provenance, backwards compatibility, and course references; document repeatable verification and maintenance procedures ([#119](https://github.com/kctong529/sisukas/issues/119)).

The working catalogue is stored in the application repository, notably `data/curricula/catalogue-reviewed.csv`. It is a review record, not a file that the frontend automatically imports. The application continues to consume curated metadata in `frontend/course-browser/src/data/`, including `major.yaml`, `minor.yaml`, and `master.yaml`.

> [!WARNING]
> Do not treat candidate count as coverage achieved. Issue #114 began with 226 proposed entries, not 226 verified curricula. A catalogue entry may turn out to be a translation duplicate, a programme rather than a major, a different level, or a record lacking sufficient official evidence.

## Data quality and compatibility

This expansion crosses several existing contracts:

- **Identity and versions.** Preserve stable Sisukas identifiers where possible, while distinguishing official module codes and curriculum periods. An updated curriculum should not silently invalidate an earlier saved selection.
- **Course membership.** Verify compulsory and elective listings against official curriculum information. Avoid treating course-group membership as a complete degree-requirement model.
- **Active and historical coverage.** Course codes referenced by a valid curriculum are not necessarily present in the current published course datasets. Missing references require investigation rather than automatic removal.
- **Language and programme structure.** Translated names may refer to the same module; some master's programmes contain several majors while others do not have distinct major modules.
- **Source attribution.** Record evidence at the most specific official page or section available, so later maintenance can distinguish a verified decision from a guess.

The format and referential validator from [issue #63](https://github.com/kctong529/sisukas/issues/63) is implemented. However, full dataset-reference validation is a diagnostic, not a blanket CI rejection policy, because the published active and historical datasets can have coverage gaps. [Issue #112](https://github.com/kctong529/sisukas/issues/112) investigates those gaps; [#113](https://github.com/kctong529/sisukas/issues/113) examines metadata compilation and consumption before changing the pipeline.

> [!TIP]
> Review and integrate curricula in small, traceable batches. Record ambiguous module structures and course references in the catalogue before applying the same interpretation across an entire school or study level.

## What completion should mean

The initiative can be considered complete when the targeted mainstream curricula across all six schools have been inventoried, verified, and integrated (or explicitly deferred with a reason); the new metadata contract and historical entries remain compatible; and regression checks and maintenance instructions make subsequent curriculum updates repeatable.

That is deliberately more demanding than “the YAML files contain more entries.” The milestone is about trustworthy coverage that can be maintained as Aalto publishes new curriculum periods.

## Related documentation

- [Curriculum Metadata](../../dev-guide/curriculum-metadata/) — Official sources, review decisions, catalogue tooling, and integration instructions.
- [Course Data Architecture](../../dev-guide/data-architecture/) — How curated curricula relate to published course datasets.
- [Filtering](../../concepts/filtering/) — How curriculum selections contribute to course discovery.
- [Study Calendar Design](../study-calendar/) — Another active product-design initiative.
