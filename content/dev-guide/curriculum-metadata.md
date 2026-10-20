---
weight: 3
title: "Curriculum Metadata"
description: "How Aalto curriculum entries are catalogued, verified against official sources, and prepared for Sisukas."
---

> [!NOTE]
> This guide describes the **curated curriculum catalogue**, not the automated course-data pipeline. For how `courses.json` is fetched and published, see [Data Pipeline](../data-pipeline/).
>
> The 2026–2028 catalogue is being verified under [#114](https://github.com/kctong529/sisukas/issues/114), as part of [#61](https://github.com/kctong529/sisukas/issues/61). A recorded candidate is not necessarily an approved curriculum.

## Overview

Sisukas maintains predefined curricula for course discovery and filtering. The metadata is distinct from the course datasets: course datasets describe available courses, while curriculum metadata records which course codes belong to a specified major or minor.

The 2026–2028 catalogue aims to cover mainstream Finnish- and English-taught bachelor's majors, bachelor's/intermediate and advanced minors, and master's majors across Aalto's schools.

There are three separate stages:

1. **Catalogue:** list candidate curricula and their official sources.
2. **Verification:** confirm the correct official module, period, level, and source; decide whether to include, merge, exclude, or defer each record.
3. **Integration:** update and test the application metadata in `frontend/course-browser/src/data/`.

The catalogue is an auditable working record, **not** automatically imported into the application.

## Files and ownership

| Location | Purpose |
| --- | --- |
| [`sisukas/data/curricula/catalogue-reviewed.csv`](https://github.com/kctong529/sisukas/blob/dev/data/curricula/catalogue-reviewed.csv) | Candidate inventory and manual verification decisions. It contains both reviewed and pending entries. |
| `sisukas/frontend/course-browser/src/data/major.yaml` | Application metadata for bachelor's majors. |
| `sisukas/frontend/course-browser/src/data/minor.yaml` | Application metadata for minors. |
| `sisukas/frontend/course-browser/src/data/master.yaml` | Application metadata for master's majors. |
| `sisukas/frontend/course-browser/scripts/validate-curricula.ts` | Format-only and dataset-based curriculum validation. |
| `sisukas/scripts/curricula/` | Python catalogue verification tools, tests, and usage instructions. |

The `sisukas` repository owns the CSV, extraction tools, and application YAML. This documentation lives in `sisukas-docs`; do not maintain a second catalogue copy here.

## Official sources and identifiers

Use [Aalto's minors catalogue](https://www.aalto.fi/en/minors), individual minor pages, and the relevant official [2026–2028 programme curricula](https://www.aalto.fi/en/programmes/aalto-bachelors-programme-in-science-and-technology/curriculum-2026-2028).

Prefer the **most specific official Aalto page** supporting the entry. For a minor this is usually its own page; for a major it may be a named section of a shared programme curriculum page. A general catalogue link is a discovery source, not sufficient evidence for a particular module.

Keep these concepts separate:

- **Sisukas key:** existing application identifier used by frontend selections. Do not change it without assessing compatibility.
- **Official module code:** the code published by Aalto for the major or minor. It is not a course code and should not be guessed from a programme name.
- **Basic-studies module code:** where applicable, distinct from the bachelor's major-studies module code.
- **Curriculum period:** the published validity period (for this batch, `2026-2028`), not the review date.
- **Source URL:** the official page supporting the recorded module, not merely its parent catalogue.

For master's programmes, first establish whether the programme defines distinct majors. Do not invent a major code for a programme-level entry.

## Catalogue review workflow

### 1. Prepare candidates

Start from `data/curricula/catalogue-reviewed.csv`. Do not remove excluded or unresolved entries: their decisions explain why a candidate did not enter the application.

Each candidate has proposed fields such as `kind`, `name`, `official_code`, `curriculum_period`, and `source_url`. Treat these as **claims awaiting verification** unless the review columns record a completed decision.

### 2. Obtain page evidence

From the root of the `sisukas` repository, install the verifier dependencies and run:

```sh
python3 -m venv .venv-curricula
source .venv-curricula/bin/activate
python3 -m pip install -r scripts/curricula/requirements.txt

python3 scripts/curricula/verify_catalogue.py
python3 scripts/curricula/verify_catalogue.py --fetch --limit 3
python3 scripts/curricula/verify_catalogue.py --fetch
python3 scripts/curricula/generate_checklist.py
```

The first command checks catalogue structure; the `--fetch` commands retrieve official HTML and record whether proposed names, codes, and curriculum years appear. `generate_checklist.py` creates a human-readable view of the current review decisions. HTML is cached for repeated runs under `scripts/curricula/.cache/`, which is ignored by Git. **These are evidence checks, not automatic approvals.** A shared programme page can contain the code of another major.

> [!WARNING]
> The verifier regenerates `scripts/curricula/.cache/verification.csv` on every run, preserving any existing human-review columns **in the generated copy**. It never modifies `data/curricula/catalogue-reviewed.csv`. **Edit and commit the curated CSV, never the generated report.**

### 3. Review each entry

Open the linked official source and check:

1. The page or exact section refers to the intended major or minor.
2. The module code belongs to that module, not a neighbouring course or major.
3. The entry is valid for `2026-2028`, including any start dates or discontinued tracks.
4. The level, organising school, and any language/eligibility restrictions are correctly understood.
5. A Finnish/English name is not a duplicate of a module already in the catalogue.

Record the manual decision in the six fields below:

| Field | Content |
| --- | --- |
| `review_decision` | Exactly `include`, `merge`, `exclude`, or `defer`. |
| `verified_code` | Exact official module code, **if published and confirmed**; otherwise blank with explanation. |
| `verified_source_url` | Direct official Aalto page (or section link) supporting the decision. |
| `verified_period` | Confirmed period in `YYYY-YYYY` format, e.g. `2026-2028`. |
| `review_notes` | Reason for exceptions, missing evidence, effective dates, or the retained record when merging. |
| `reviewed_on` | Actual human review date in `YYYY-MM-DD` format. |

Use the decisions consistently:

- **`include`:** a distinct module in scope, with enough official evidence to support the code, period, and identity.
- **`merge`:** a duplicate or translation of another record. Specify the retained `record_id` in `review_notes`.
- **`exclude`:** not an eligible 2026–2028 entry for the agreed scope. State why; retain the row for auditability.
- **`defer`:** insufficient evidence or an unresolved modelling question. State what remains to check.

Do not copy proposed values into `verified_*` fields just to complete the spreadsheet. A blank confirmed field is better than fabricated evidence. Dates must reflect when someone actually reviewed the page.

### 4. Validate the reviewed CSV

Before committing a batch:

- Keep the CSV UTF-8 encoded, with its original field names intact.
- Ensure `record_id` is present and unique, and that duplicate module codes/periods are reviewed.
- Check that each `include` decision has an official source URL, review date, and confirmed period; a missing module code needs an explicit explanation.
- Retain `exclude`, `merge`, and `defer` decisions rather than silently deleting rows.
- Report the number of included, excluded, merged, deferred, and still-unreviewed candidates in the corresponding GitHub issue comment.

The initial bachelor's-major review is documented in [#114](https://github.com/kctong529/sisukas/issues/114). Other catalogue categories remain pending until separately reviewed.

## Integrating verified entries

After the catalogue and metadata schema are agreed upon, transfer approved entries to `major.yaml`, `minor.yaml`, or `master.yaml` in reviewable batches. Preserve existing historical entries and Sisukas keys until a migration plan addresses saved selections.

The current YAML model uses a flat list of course codes for filtering. It does **not** fully model required credits, compulsory versus elective groups, or substitute courses. Interpret official curriculum tables carefully; an HTML table row is not necessarily a compulsory course.

Run the frontend checks from `frontend/course-browser`:

```sh
npm run validate:curricula -- --format-only
npm test
npm run check
```

For full course-reference checks, provide both local datasets to the CLI:

```sh
npm run validate:curricula -- \
  --active /path/to/courses.json \
  --historical /path/to/historical.json
```

**Format-only validation** is intended to run in CI without external datasets. **Full validation** reports active, historical-only, and unknown references; unknown codes must be investigated and are not automatic grounds to delete an official curriculum entry. See [#112](https://github.com/kctong529/sisukas/issues/112).

## Maintenance boundaries

- **Curriculum catalogue:** manually curated, source-backed module identities and course memberships.
- **Course data pipeline:** separately refreshed course datasets (`courses.json`), documented in [Data Pipeline](../data-pipeline/).
- **Metadata compilation:** the role of `compile-metadata.js` is being investigated in [#113](https://github.com/kctong529/sisukas/issues/113). Do not assume its generated JSON is the authoritative curriculum catalogue.

For each new curriculum period, refresh the candidate list, preserve previously verified history, recheck source URLs and module codes, record review decisions, and integrate the confirmed changes with regression tests.
