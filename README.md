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

- `content/dev-guide/running-locally.md` — application development setup.
- `content/dev-guide/data-pipeline.md` — automated course dataset ingestion and publication.
- `content/dev-guide/curriculum-metadata.md` — manually curated curriculum catalogue, official sources, review decisions, and validation.
- `content/dev-guide/` — other contributor and operational guides.

**Repository separation:** production curriculum YAML, the reviewed catalogue (`data/curricula/catalogue-reviewed.csv`), and verification scripts (`scripts/curricula/`) live in the main [Sisukas repository](https://github.com/kctong529/sisukas). This documentation repository explains their usage; it does not maintain another catalogue copy.

## Contributing

Add a Markdown file under the appropriate `content/` section with front matter matching neighbouring pages. Preview with `hugo server --theme hugo-book -D`, and verify the production build command before committing. Links between documentation pages should use the site's existing relative-link conventions.
