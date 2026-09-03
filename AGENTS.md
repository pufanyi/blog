# AGENTS.md

Project guidance for agents working in this repository.

## Living Project Notes

- Treat this file as the agent's living notes and keep it actively maintained.
  Whenever work reveals a durable, reusable lesson about this repository, add
  it here as part of the task rather than waiting to be asked. Regularly revise,
  reorganize, or remove guidance as the project and better practices evolve;
  keep rules concise, current, and useful instead of merely accumulating them.

## Version Control

- This repository uses Git for version control.
- Check state with `git status`.
- Inspect history with `git log`.
- Inspect changes with `git diff`.
- Manage branches with `git branch` and `git switch`.
- Sync with remotes using `git fetch`, `git pull`, and `git push`.
- Always run `pnpm check` before every push, after the final code or content
  change. Do not push unless it passes; if anything changes afterward, run it
  again before pushing.

## Development

- Use `pnpm` for package scripts.
- Generate derived content data with `pnpm generate:data`.
- Start the local development server with `pnpm start`.
- Build with `pnpm build`.
- Run unit tests with `pnpm test`.
- Run formatting and lint checks with `pnpm biome:check`.
- Apply automatic Biome fixes with `pnpm biome:write`.

## Design

- All color choices should follow the muted Morandi theme and use the semantic
  color variables from `src/styles/morandi.css`.
- All Angular-authored images should use `app-image-lightbox`, which wraps
  `NgOptimizedImage` and `medium-zoom`. Do not add bare template `<img>` tags
  unless there is a concrete framework limitation.
- MDX-generated post images are emitted as plain HTML first, then hydrated
  by the post page into `app-image-lightbox` instances. Keep generated image
  HTML dimensioned with `width`/`height` whenever possible so `NgOptimizedImage`
  can run correctly after hydration.

### Post Diagrams

- Prefer post-local build-time components for authored technical diagrams.
  Put them in `content/posts/<slug>/scripts/*.post-component.tsx`, export them
  through a `POST_COMPONENTS` object, and invoke them directly from MDX.
- Render structural diagrams as accessible inline SVG inside a `<figure>`.
  Provide a meaningful `<title>`, `<desc>`, and `<figcaption>`, use a
  responsive `viewBox`, and place the figure in an overflow container for
  narrow screens.
- Keep diagram colors in prefixed classes under the post media styles and use
  only semantic variables from `src/styles/morandi.css`; verify both themes.
- Keep one source of truth for a diagram's data. Derive related masks, cells,
  edges, and labels from the same arrays and predicates instead of duplicating
  hard-coded values that can drift apart.
- For TeX inside inline SVG, use a sized `<foreignObject>` containing HTML
  with MathJax delimiters such as `\(...\)`. The site uses MathJax CHTML, so
  do not expect TeX inside an SVG `<text>` element to typeset reliably. Give
  each foreign object explicit bounds and remove default `mjx-container`
  margins.
- After changing a diagram, run `pnpm generate:data`, `pnpm check`, and
  `pnpm test`, then inspect the actual served page at desktop and narrow
  widths. Check label collisions, arrowheads, legends, theme contrast, and
  whether the visual encoding agrees with the underlying equations.

## Content

- Treat existing prose as author-owned. Preserve its wording, tone, and
  structure unless the user asks for a rewrite; make the smallest correction
  needed for genuine factual or rendering errors.

- Each blog post lives at `content/posts/<slug>/index.mdx`; the directory name is
  the post slug. `index.mdx` starts with YAML front matter delimited by `---`;
  `title`, `date` (`YYYY-MM-DD`), and `description` are required, while
  `coverImage` is optional.
- Post-local image/assets live alongside `index.mdx` under
  `content/posts/<slug>/` and are referenced from Markdown with relative image
  paths. The generator rewrites those paths to `/posts/<slug>/...`, and Angular
  copies non-MDX files from `content/posts` into the published `/posts`
  asset path.
- Posts are compiled as standard MDX with GFM and math support. Prefer native
  MDX syntax and semantic HTML elements such as `<details>` for authored
  interactive content; imported build-time components are also supported.
- A post can keep BibTeX references in a sibling `references.bib` file and cite
  them with Pandoc-style keys such as `[@key]`. Citations use the APA CSL
  style; place `[^ref]` where the generated bibliography should appear.
- Citation workflow:
  1. Create or update `content/posts/<slug>/references.bib`. Use readable,
     stable keys such as `kingma2014autoencoding`; write authors as
     `Family, Given and Family, Given`; and include `title`, `year`, and `url`.
     Prefer adding `doi`, publication venue, volume, and pages when available.
     Prefer a dedicated landing-page URL when it clearly identifies the cited
     work. If none exists, use the direct document URL rather than a generic
     index or syllabus page. Do not add abstracts; citation previews
     intentionally show bibliographic metadata only.
  2. Cite an entry in `index.mdx` with `[@key]`. Multiple references can be
     written as `[@key1; @key2]`. Add a References heading followed by `[^ref]`
     once, at the desired bibliography location.
  3. Run `pnpm format:bib` after editing BibTeX, then `pnpm generate:data` to
     regenerate the post HTML. The generator applies APA style and copies CSL
     metadata onto each `.csl-entry` as `data-title`, `data-authors`,
     `data-year`, `data-url`, and `data-doi` when present. Citation previews
     consume these attributes; do not author `data-*` attributes manually in
     MDX.
  4. Run `pnpm check` and `pnpm test` before committing. `pnpm lint:bib` checks
     formatting, duplicate citation keys, duplicate DOIs, and parser warnings.
- When adding or touching image assets, manually convert any non-AVIF images to
  AVIF and reference the converted files instead.
- Rich-text fields in `content/cv.yaml` support inline Markdown while retaining
  compatibility with authored HTML. This applies to abstract paragraphs, entry
  details and items, subsection items, and section content; structural fields
  such as titles, dates, locations, and header data remain plain text.
- The `prebuild`, `prestart`, and `pretest` hooks run `pnpm generate:data`, so
  post metadata and generated content are refreshed before `pnpm build`,
  `pnpm start`, or `pnpm test`.
- Files under `src/app/data` are generated from `content` and ignored by Git.
  Do not edit or commit them directly; update the source content files instead.
