# Sisukas Documentation

Developer and system documentation for [Sisukas](https://github.com/kctong529/sisukas), including application architecture, course-data processing, curriculum metadata, and local development.

The site is built with [Hugo](https://gohugo.io/) and the **Hugo Book** theme. The theme is included as a Git submodule. The GitHub Pages build selects it explicitly with `--theme hugo-book` (rather than in `hugo.toml`).

## Run locally

From the `sisukas-docs` repository root:

```sh
git submodule update --init --recursive
hugo server --theme hugo-book -D
```

Open <http://localhost:1313/>. Hugo watches the content files and refreshes the site as you edit. Press `Ctrl+C` to stop the server.

Install **Hugo Extended** if it is not available (`brew install hugo` on macOS). The deployment workflow currently uses Hugo Extended **0.152.2**. Check your installation with `hugo version`.

If you see `template for shortcode "steps" not found`, make sure you've initialized the theme submodule and passed `--theme hugo-book`; do **not** remove valid shortcodes from content to work around a missing theme.

## Build locally

To reproduce the site's production build (without publishing):

```sh
hugo --gc --minify --theme hugo-book --baseURL "https://docs.sisukas.eu/"
```

Generated output is placed in `public/`. GitHub Pages deployment is defined in `.github/workflows/hugo.yaml`; it also installs the other build dependencies required by the theme.

## Documentation layout

The [documentation homepage](https://docs.sisukas.eu/) directs readers by question:

- `content/system-overview.md` — brief service map and responsibility overview, not a second architecture reference.
- `content/concepts/` — domain vocabulary and user-facing planning ideas.
- `content/architecture/` — authoritative designs, invariants, ownership boundaries, and data contracts.
- `content/dev-guide/` — development commands, reference procedures, APIs, setup, operations, and contributor conventions.
- `content/securities/` — authentication, authorization, and RLS boundary explanations.
- `content/under-dev/` — proposals and incomplete feature designs, with implementation status clearly marked.

**Writing rules:** Choose one authoritative home per technical claim and link to it elsewhere. Page titles use at most **three words** (four only when essential). Distinguish proposals from production behavior. Preserve public URLs with Hugo aliases when moving content, and update all internal links to the canonical path.

**Repository separation:** production curriculum YAML, the reviewed catalogue (`data/curricula/catalogue-reviewed.csv`), and verification scripts (`scripts/curricula/`) live in the main [Sisukas repository](https://github.com/kctong529/sisukas). This repository documents how they are used; it does not maintain a second catalogue copy.

## Contributing

Add a Markdown file under the appropriate `content/` section with front matter matching neighbouring pages. Preview with `hugo server --theme hugo-book -D`, and verify the production build command before committing. Links between documentation pages should use the site's existing relative-link conventions. Before submitting changes, run `python3 scripts/check_docs.py` to verify internal Markdown links, static assets, page titles, and redirect aliases.
