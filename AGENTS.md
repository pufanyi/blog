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
- Prefer `.mts` for Node ESM scripts and executable configuration, `.ts` for
  Angular/shared code, and `.tsx` for JSX. `tsconfig.scripts.json` checks all
  tooling, script tests, and post-local components strictly, without `allowJs`.
  Keep native Node entrypoints compatible with type stripping; MDX generation
  and its tests use `tsx` because they load authored JSX components.
- ESLint loads `eslint.config.mts` through the explicit `jiti` dev dependency.
  Remark discovers `.remarkrc.json`, which points to `remark.config.mts` as a
  preset; its current configuration loader does not discover TypeScript files.
- Generate derived content data with `pnpm generate:data`.
- Start the local development server with `pnpm start`.
- Build with `pnpm build`.
- Production builds promote the prerendered `/404` route to `404.html` for
  Cloudflare's `404-page` handling and generate `_redirects` from
  `content/redirects.yaml`; do not edit either file under `dist` manually.
- Run unit tests with `pnpm test`; use `pnpm test --watch=false` for a
  noninteractive run. `pnpm check` does not run tests or the production build.
- Run browser regressions with `pnpm test:e2e`; its pre-hook builds the site
  and Playwright serves that production output at port 4173. Install Chromium
  once with `pnpm exec playwright install chromium`. CI runs checks, unit tests,
  and these desktop/mobile browser tests, retaining diagnostics on failure.
- Run formatting and lint checks with `pnpm biome:check`.
- Apply automatic Biome fixes with `pnpm biome:write`.
- Generated `POSTS` contains summaries only. Load article HTML/TOC through
  `loadPost` and the generated per-slug loaders. The serialized search index
  and plaintext snippets belong to the deferred search modal; avoid importing
  search services into the eager shell. Assess payloads on served production
  pages, since CLI initial totals exclude lazy chunks and external scripts.
- Keep article presentation in `PostComponent`, DOM enhancement and cleanup
  in `PostContentDirective`, and TOC interaction in `PostNavigationComponent`.
  Use render hooks and cleanup callbacks rather than retrying DOM queries.
- `PageMetadataStrategy` handles browser and prerendered metadata.
  `PageScrollService` consumes router scroll events and corrects saved positions
  or fragments after fonts/formulas settle, unless the reader has scrolled.

## Design

- All color choices should follow the muted Morandi theme and use the semantic
  color variables from `src/styles/morandi.css`.
- The shared 404 experience lives in `src/app/pages/not-found` and is also used
  for missing blog slugs. Keep its recovery and peer-review interactions
  covered by component tests. Preserve its academic copy during style-only
  changes; simplify framing and decoration first. The review dialog must capture
  keyboard focus and restore it when dismissed.
- All Angular-authored images should use `app-image-lightbox`, which wraps
  `NgOptimizedImage` and `medium-zoom`. Do not add bare template `<img>` tags
  unless there is a concrete framework limitation.
- MathJax loads on demand through `src/app/utils/mathjax.ts`, with automatic
  typesetting disabled. Angular-authored views outside generated post content
  must call `typesetMath` after rendering when they contain TeX delimiters.
- Check search with real, bubbling keyboard events and both Chinese and
  English queries. Verify one-step arrow navigation, focus containment,
  dismissal, and focus restoration on the served page.
- Keep search-result animations local: AutoAnimate's removal animation adjusts
  window scrolling and can overwrite the page's saved reading position.
- MDX-generated post images are emitted as plain HTML first, then hydrated
  by the post page into `app-image-lightbox` instances. Keep generated image
  HTML dimensioned with `width`/`height` whenever possible so `NgOptimizedImage`
  can run correctly after hydration.
- Author ordinary post images with Markdown `![alt](./images/file.avif)`.
  The generator reads local image dimensions through `image-size` and preserves
  SVG viewBox handling; it does not require a system ImageMagick installation.

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
  margins. WebKit can misplace this HTML when a responsive SVG is scaled; for
  narrow overflow layouts, keep the rendered SVG dimensions at 1:1 with its
  `viewBox` and verify on an actual WebKit device.
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
- When renaming a post slug, update absolute `/posts/<slug>/...` references in
  post-local components and shared styles; unlike Markdown image paths, code
  and CSS URLs are not rewritten automatically.
- Posts are compiled as standard MDX with GFM and math support. Prefer native
  MDX syntax and semantic HTML elements such as `<details>` for authored
  interactive content; imported build-time components are also supported.
- For legacy Jekyll imports, replace Liquid includes with Markdown or native
  MDX and remove theme-only front matter. Keep original exports and ZIP archives
  outside `content/posts`; files not excluded by the asset rules are published.
- A post can keep BibTeX references in a sibling `references.bib` file and cite
  them with Pandoc-style keys such as `[@key]`. Citations use the APA CSL
  style. When a bibliography is rendered, the generator appends it with a
  level-two `References` heading; do not add a manual heading or `[^ref]`
  marker to the MDX source.
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
     written as `[@key1; @key2]`. The References section is generated at the
     end of the post automatically.
  3. Run `pnpm format:bib` after editing BibTeX, then `pnpm generate:data` to
     regenerate the post HTML. The generator applies APA style and copies CSL
     metadata onto each `.csl-entry` as `data-title`, `data-authors`,
     `data-year`, `data-url`, and `data-doi` when present. Citation previews
     consume these attributes; do not author `data-*` attributes manually in
     MDX.
  4. Run `pnpm check` and `pnpm test` before committing. `pnpm lint:bib` checks
     formatting, duplicate citation keys, duplicate DOIs, and parser warnings.
- Keep renderer coverage for APA-collapsed citations that share an author but
  use different years; every displayed year must retain its own bibliography
  link.
- When adding or touching image assets, manually convert any non-AVIF images to
  AVIF and reference the converted files instead.
- Rich-text fields in `content/cv.yaml` support inline Markdown while retaining
  compatibility with authored HTML. This applies to abstract paragraphs, entry
  details and items, subsection items, and section content; structural fields
  such as titles, dates, locations, and header data remain plain text.
- The `prebuild`, `prestart`, `pretest`, and `precheck` hooks run `pnpm generate:data`, so
  post metadata and generated content are refreshed before `pnpm build`,
  `pnpm start`, `pnpm test`, or `pnpm check`. The content typecheck includes
  the main generator, its TypeScript helpers, and post-local components.
- Files under `src/app/data` are generated from `content` and ignored by Git.
  Do not edit or commit them directly; update the source content files instead.
