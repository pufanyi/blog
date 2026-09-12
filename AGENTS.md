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
- Always run both `pnpm check` (lint and typecheck) and noninteractive unit
  tests (`pnpm test --watch=false`) before every push, after the final code or
  content change. Note that `pnpm check` does not run tests. Do not push unless
  both pass; if anything changes afterward, run them again before pushing.
- The code-quality workflow runs checks/unit tests and browser tests in parallel.
  Its `quality` job generates content once, then uses the `*:generated` scripts;
  keep those scripts aligned with their normal lifecycle-hooked counterparts.
  The final `check` job must require both jobs to succeed, preserving the existing
  required status check. CI installs Playwright's matching Chromium headless shell
  with `--only-shell`; keep its default channel so that shell is actually used.

## Development

- Use `pnpm` for package scripts.
- Prefer English for code comments, configuration comments, and developer-facing
  documentation.
- Restrict prose searches to `*.mdx` (and `*.bib` when needed); some post SVGs
  embed large base64 images that can overwhelm text search output.
- Prefer `.mts` for Node ESM scripts and executable configuration, `.ts` for
  Angular/shared code, and `.tsx` for JSX. `tsconfig.scripts.json` checks all
  tooling, script tests, and post-local components strictly, without `allowJs`.
  Include post-local JSX helpers as well as component entrypoints: `tsx` needs
  those files covered by this config to use the automatic React JSX runtime.
  Keep build-time TSX files excluded from Angular's post asset copy rules.
  Keep native Node entrypoints compatible with type stripping; MDX generation
  and its tests use `tsx` because they load authored JSX components.
- ESLint loads `eslint.config.mts` through the explicit `jiti` dev dependency.
  Remark discovers `.remarkrc.json`, which points to `remark.config.mts` as a
  preset; its current configuration loader does not discover TypeScript files.
- Generate derived content data with `pnpm generate:data`.
- The same generator writes `/llms.txt`, `/profile.md`, `/blog/index.md`, and
  `/blog/<slug>.md` to the ignored `.generated/agent-content` asset directory.
  Directory indexes are exported at `/blog/contents/index.md` and
  `/blog/contents/<category>/index.md`.
  Export expanded MDX before syntax highlighting so code annotations remain
  intact; retain math, citation links, diagram descriptions, and direct PDF URLs.
  Profile exports reuse rendered CV data. Never maintain a second copy of prose.
  Angular copies these files at the site root; keep Markdown discovery links in
  `PageMetadataStrategy` and Markdown MIME types in hosting/preview configuration.
- Original page URLs negotiate Markdown only for an explicit, preferred
  `Accept: text/markdown`. Postbuild derives the Worker route map from prerendered
  alternate links and validates the corresponding exports; do not duplicate it
  by hand. The generated Worker entry and map stay outside public assets.
  Keep `wrangler.jsonc` worker-first patterns covering these page routes, with
  an `ASSETS` binding for separate HTML/Markdown asset caching. Negotiated
  responses need `Vary: Accept` and must not enter a shared URL-only cache.
  `pnpm preview` shares the handler; `pnpm preview:cloudflare` and Playwright's
  Cloudflare project also exercise actual Worker/static-asset routing locally.
  Cloudflare applies `_headers` to HTML 404 fallbacks using the requested URL;
  keep `/blog/*.md` within worker-first routing so missing exports receive the
  Worker's MIME correction, and retain its Cloudflare regression test.
  One-to-one article Markdown exports also send an HTTP canonical pointing to
  the HTML article, including direct GET/HEAD and conditional 304 responses.
  Do not canonicalize the full archive or profile exports to partial pages.
- Site settings live in `configs/{site,blog,comments,redirects}.yaml`. The data
  generator validates them before emitting typed modules under `src/app/data`.
  After editing YAML during development, run `pnpm generate:data` again.
- Blog pagination uses `/blog` and `/blog/page/:page`. Keep the resolver,
  prerendered page count, metadata, and navigation on the same pagination helpers
  and configured page size. Keep search over all posts and avoid list removal
  animations that interfere with the router's saved scroll positions.
- Blog categories follow the nested directories under `content/posts`.
  `blog.routes.ts` lazily loads the archive, category pages, and full article
  paths; prerender every article and ancestor category with the same data.
  `/blog/contents` is the root directory, with category pages under
  `/blog/contents/<category>`; article URLs remain `/blog/<slug>`.
  Directory pages list immediate children, folders first, with dates equal to
  the latest descendant publication `date`, ignoring `updated`. Keep `/blog`
  as the paginated archive and preserve the contents root even with no posts.
  Derive browser-test directory counts from generated post paths so adding a
  post does not require updating unrelated navigation assertions.
  Use full path strings for router navigation; encoding an entire slug or passing
  it as a single noninitial router command turns `/` into `%2F`.
- Start the local development server with `pnpm start`.
- Build with `pnpm build`.
- Production builds promote the prerendered `/404` route to `404.html` for
  Cloudflare's `404-page` handling and generate `_redirects` from
  `configs/redirects.yaml`; do not edit either file under `dist` manually.
- The postbuild step generates `sitemap.xml` and `robots.txt` from Angular's
  prerender manifest and page canonicals. It excludes noindex and redirect
  pages; do not maintain a separate URL list or use build time as `lastmod`.
- Keep Cloudflare HTML handling aligned with the canonical URL format. Check
  that sitemap and canonical URLs return 200 directly; asset redirects must not
  add trailing slashes while page metadata declares the slashless URL canonical.
  Hosting uses `assets.html_handling: drop-trailing-slash`; verify this in the
  Cloudflare Playwright project, since the lightweight Node preview does not
  reproduce every static asset redirect.
- The generator writes summary feeds at `/feed.xml` (RSS) and `/atom.xml`
  alongside Markdown exports. Both use stable article URLs and sort by the
  latest known authored date (`updated ?? date`), never the build clock. Feed
  discovery lives in page metadata, the footer, and `llms.txt`; keep MIME types
  correct in both Cloudflare `_headers` and the Node preview.
- Run unit tests with `pnpm test`; use `pnpm test --watch=false` for a
  noninteractive run. `pnpm check` does not run tests or the production build.
  If Vitest workers exit unexpectedly on a host reporting many CPUs, retry with
  `VITEST_MAX_WORKERS=2 pnpm test --watch=false` to limit local concurrency.
- Angular's unit-test builder does not support `vi.mock` for relative imports.
  Override injectable dependencies through `TestBed` when testing configuration.
- Run browser regressions with `pnpm test:e2e`; its pre-hook builds the site
  and Playwright serves that production output at port 4173. Install Chromium
  once with `pnpm exec playwright install chromium`. CI runs checks, unit tests,
  and these desktop/mobile browser tests, retaining diagnostics on failure.
- Before focusing an offscreen control in a browser test, scroll it into view.
  Otherwise global smooth scrolling can overlap the next navigation.
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
  `PostContentDirective` marks `.post-body` with `data-rendered="true"` after
  client DOM enhancements attach; browser tests asserting on client elements
  (such as embedded PDF readers) should wait for this attribute before querying
  or scrolling iframes to ensure hydration has settled.
- Interactive MDX examples render semantic initial HTML in post-local components
  and attach lazy browser controllers through `PostContentDirective`. Share numeric
  models between build-time markup and playback, preserve explanations in Markdown,
  and clean up timers, observers, and events on navigation. Keep playback opt-in,
  pause when hidden/offscreen, and respect reduced motion. Async examples expose
  their own readiness attribute; `data-rendered` does not await their lazy imports.
  Mark transient playback UI with `data-agent-omit` and provide a static explanation
  or numeric transcript outside it for Markdown exports and noninteractive reading.
  Give each animation a teaching focus that complements the surrounding prose.
  For tiling, keep the full sequence, current block, and accumulated coverage visible
  together; avoid repeating an already-explained scalar merge derivation.
- `PageMetadataStrategy` handles browser and prerendered metadata.
  It also owns article `BlogPosting` JSON-LD: reuse authored dates and article
  covers, omit unknown modification dates and unrelated fallback images, and
  escape `<` when serializing JSON into HTML script elements.
  Homepage/CV `ProfilePage` data and article authors share the `/#person` ID.
  Build the compact generated person data from rendered CV content and its
  external profile links; avoid importing the full CV into the eager metadata
  service. Clear page-specific structured data when navigating away.
  `PageScrollService` consumes router scroll events and corrects saved positions
  or fragments after fonts/formulas settle, unless the reader has scrolled.

## Design

- All color choices should follow the muted Morandi theme and use the semantic
  color variables from `src/styles/morandi.css`.
- For Linux browser screenshots, verify a CJK fallback font is available. On
  WSL, a temporary Fontconfig configuration can load Windows fonts without
  changing the site's typography.
- In minimal Linux environments, missing Playwright shared libraries can be
  supplied by extracting matching distro packages into a temporary directory
  and setting a process-scoped `LD_LIBRARY_PATH`. Use `FONTCONFIG_FILE` for
  temporary fonts; keep these host workarounds out of project dependencies.
  On older glibc hosts, point `MINIFLARE_WORKERD_PATH` at a temporary wrapper
  that launches the installed workerd through a newer extracted glibc loader.
  Verify actual CJK glyph rendering: a previous task's subset font may omit
  characters even when Fontconfig reports a CJK family.
- Disable animations when capturing theme changes so SVG strokes and animated
  page backgrounds are captured in the same theme state.
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
- Keep the search listbox explicitly `tabindex="-1"`: Chromium otherwise adds
  an overflowing results container to the Tab order. Its combobox owns arrow-key
  navigation; cover overflow explicitly in browser tests.
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
- Pass one string to a React-rendered SVG `<title>` (use a template string for
  dynamic labels); mixed JSX children produce React warnings and empty titles.
- Keep diagram colors in prefixed classes under the post media styles and use
  only semantic variables from `src/styles/morandi.css`; verify both themes.
  Distinguish edge roles with line patterns or weight as well as color, since
  muted hues can look alike at small sizes.
  Post styles have per-file production budgets; put large diagram styles under
  `styles/media/` and register them separately in `PostComponent.styleUrls`.
- Keep one source of truth for a diagram's data. Derive related masks, cells,
  edges, and labels from the same arrays and predicates instead of duplicating
  hard-coded values that can drift apart.
  For iterative numerical methods, distinguish ideal targets from finite-step
  approximations; derive plotted values and accessible transcripts from the
  same recurrence, and state the precision used by the example.
  Memory diagrams should state tensor precisions and included allocations;
  distinguish stored model states from peak memory used by temporary buffers.
  Distributed training flows should distinguish per-layer/bucket collectives
  from total per-step communication and show temporary states being released.
- Match diagram symbols, head indices, and matrix/vector conventions to the
  surrounding post; adapt reference figures to the author's notation.
  Typeset mathematical diagram labels with the same TeX/MathJax notation as
  the prose, including subscripts, transposes, fractions, and tensor shapes;
  do not substitute Unicode approximations or code-like expressions for them.
- When redrawing legacy graphs, validate nodes and capacities against the
  article sample and code; numbered image files can represent different drafts.
  Route fan-in edges to distinct node ports and place labels clear of curves;
  opaque label backgrounds can hide unintended breaks in a path.
- Rooted layouts do not make tree edges directed. Preserve undirected sample
  edges without arrowheads unless the diagram explicitly depicts a traversal.
- For coordinate geometry, use the same scale on both axes and calculate
  intersections from the equations. Simple Latin point labels can use italic
  SVG text; reserve MathJax containers for actual TeX.
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
  Write revised posts as standalone explanations for readers, without carrying
  review rebuttals or draft-correction framing into the prose.
- In technical posts, prefer established English terminology without routine
  Chinese parenthetical translations. Improve clarity by explaining mechanisms
  and tradeoffs, not by translating basic terms such as gradient accumulation.
- When migrating legacy posts, add spaces between Chinese text and Latin
  words, numbers, or inline math without changing the formulas or prose.
  Keep original code blocks verbatim; typography cleanup applies to prose only.
- For MathJax compatibility, expand legacy KaTeX aliases such as `\N` to
  equivalent standard TeX (`\mathbb{N}`), and `\empty` to `\emptyset`. Match complete commands so `\R`
  does not alter `\Rightarrow`. Inspect formulas for red undefined
  commands as well as `mjx-merror`; unsupported macros can render without
  producing an error node.

- Each blog post lives at `content/posts/<slug>/index.mdx`; the slug is its full
  relative directory path, such as `oi-icpc/codeforces/cf551c`. The generator and
  BibTeX checker share recursive discovery, stopping at article roots so asset
  folders are not treated as categories. Empty/draft-only categories are omitted.
  Top-level `page` and `contents`, and article basename `index`, are reserved
  for navigation and Markdown indexes. Directory segments use letters, digits,
  `_`, and `-`.
  `index.mdx` starts with YAML front matter delimited by `---`;
  `title` and `date` (`YYYY-MM-DD`) are required; `description`, `coverImage`,
  and `updated` are optional. The archive shows generated opening-paragraph
  excerpts, controlled by `showExcerpts`, rather than authored descriptions.
  Build excerpts from rendered prose, omit non-prose blocks, and preserve whole
  inline formulas for MathJax. Keep excerpt HTML bounded in generated summaries;
  never load full articles or the search index for list previews. Category
  directory entries show neither descriptions nor excerpts. Supplied descriptions
  remain available for metadata, search, Markdown exports, and feeds; these must also
  support posts without descriptions. `updated` must be a real `YYYY-MM-DD`
  date on or after publication and should mark a substantive content change.
  It drives the visible update date, Markdown metadata, article `dateModified`,
  sitemap `lastmod`, and feeds. Leave unknown historical update dates unset;
  do not infer them from migration commits or filesystem/build timestamps.
- Post-local image/assets live alongside `index.mdx` under
  `content/posts/<slug>/` and are referenced from Markdown with relative image
  paths. The generator rewrites those paths to `/posts/<slug>/...`, and Angular
  copies non-MDX files from `content/posts` into the published `/posts`
  asset path.
- When renaming a post slug, update absolute `/posts/<slug>/...` references in
  post-local components and shared styles; unlike Markdown image paths, code
  and CSS URLs are not rewritten automatically.
  Prerender legacy Angular redirect routes as well, so static hosting can serve
  their immediate redirect pages on direct visits.
- Posts are compiled as standard MDX with GFM and math support. Prefer native
  MDX syntax and semantic HTML elements such as `<details>` for authored
  interactive content; imported build-time components are also supported.
  The generator wraps disclosure bodies in `.details-content`; apply disclosure
  spacing there, not to arbitrary children whose code/table padding and borders
  must remain intact. Keep each native `summary` a direct child of its `details`
  and scope open-state styles to that summary so nested disclosures stay independent.
- For mathematical pseudocode, use post-local semantic HTML with the existing
  MathJax renderer so formulas match the prose. Keep the complete algorithm
  visible, use native `<details>` for supplementary notes, and verify that the
  generated Markdown preserves every step and formula. TeX in TSX string
  literals should use `String.raw` or escaped backslashes; code blocks are not
  MathJax containers.
- Embed Lichess games with native MDX iframes using a descriptive `title`,
  `loading="lazy"`, `width="100%"`, and an explicit height. The `/black` URL
  suffix sets the viewpoint; the hash selects the initial ply (for example,
  `#101` shows the position after White's 51st move). Keep a direct game link.
  Persistent authored arrows and variations require a Study chapter embed.
  `bg=system` follows the reader's OS theme, independently of the site toggle.
- For legacy Jekyll imports, replace Liquid includes with Markdown or native
  MDX and remove theme-only front matter. Keep original exports and ZIP archives
  outside `content/posts`; files not excluded by the asset rules are published.
- For Typst imports, translate math into standard TeX, preserve display equations
  and heading relationships, and resolve `@key` citations through a post-local
  `references.bib`. Keep the original `.typ` outside `content/posts`, since the
  asset copy rules would otherwise publish it.
- For Hexo imports, remove `<!--more-->` and replace plugin tags with equivalent
  embeds, such as a PDF iframe with a direct link. Apart from the prose spacing
  above, preserve original prose, math placement, links, and code; further
  editorial changes require a separate request.
  Resolve relative images in the asset folder named after the source post;
  prefer original PNGs over derived WebP files when converting to AVIF.
  Download links (PDF, ZIP, source code, and text) use `/posts/<slug>/<file>`;
  only image paths are rewritten automatically. Copy only referenced downloads
  and preserve their bytes. Update migrated cross-post links to `/blog/<slug>` and
  regenerate heading fragments with `slugifyHeading`; legacy Hexo anchors
  can differ in case and punctuation. Only level-two and level-three headings
  receive generated IDs; add an explicit ID when preserving links to deeper
  headings.
- Post PDF iframes targeting `/posts/...pdf` or `/assets/...pdf` are rewritten
  at build time to the lazy `/pdf-viewer` route using `ngx-extended-pdf-viewer`.
  Keep one reader per iframe: the library uses global DOM IDs and cannot share
  one document between simultaneous instances. Preserve direct PDF links.
  Prerender this shell for static hosting, keep it noindex, and copy the viewer's
  assets through `angular.json`. Keep `pdfDefaultOptions.assetsFolder` relative
  to the base href to avoid doubled slashes. Preview must serve `.mjs` as
  JavaScript and `.wasm` as WebAssembly. Version 30 omits PDF.js's CMYK ICC
  profile; `public/assets/web/iccs` supplies it at the engine's default path.
  Verify actual canvases and asset requests in desktop/mobile browser tests.
  Start embedded readers with the sidebar closed: a PDF's authored outline
  preference can otherwise squeeze slide pages into thumbnails on mobile.
  Slide decks can repeat PDF page labels across overlays. The page-number input
  uses those labels; `.page[data-page-number]` uses physical page indexes.
- A post can keep BibTeX references in a sibling `references.bib` file and cite
  them with Pandoc-style keys such as `[@key]`. Citations use the APA CSL
  style. When a bibliography is rendered, the generator appends it with a
  level-two `References` heading; do not add a manual heading or `[^ref]`
  marker to the MDX source.
- Citation keys resolve only against the current post's `references.bib`;
  entries in another post's bibliography are not shared automatically.
- Prefer the latest publicly available offering of a course when consulting
  lecture notes. Check the official course site and schedule first, then read
  the relevant lecture to verify that it supports the cited claim. Update the
  citation key, year, term, lecturer, and URL together when changing editions.
  Use an older offering when the relevant newer material is unavailable or
  omits needed content, and identify the edition accurately. Continue citing
  original papers for attribution of methods and results.
  When summarizing a method's evolution, also check the authors' current papers
  and official implementation for later versions; recent lecture notes alone
  do not establish a complete release history.
- Use citations selectively and place them at the point of attribution: next to
  the named paper, lecture, method, or specific claim they support, including
  within a sentence. Cite distinct named sources separately instead of bundling
  them at the paragraph's end. Group citations only when they support the same
  claim; use a paragraph-end citation only when its scope is clear. Avoid
  mechanically citing every paragraph or repeating the same source throughout
  one explanation. Keep specific results, quotations, empirical claims, and
  adapted figures attributable.
- Citation workflow:
  1. Create or update `content/posts/<slug>/references.bib`. Use readable,
     stable keys such as `kingma2014autoencoding`; write authors as
     `Family, Given and Family, Given`; and include `title`, `year`, and `url`.
     Prefer adding `doi`, publication venue, volume, and pages when available.
     Prefer a dedicated landing-page URL when it clearly identifies the cited
     work. If none exists, use the direct document URL rather than a generic
     index or syllabus page. Do not add abstracts; citation previews
     intentionally show bibliographic metadata only.
     Undated documentation uses `year = {n.d.}`; do not infer a publication
     year from the current year or a copyright footer.
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
  Inspect GIF/WebP frame counts before converting: animations must become AVIF
  sequences with all composited frames, original dimensions, per-frame durations,
  and loop counts preserved. Verify decoded metadata and playback on the served
  page; a successful conversion can still silently retain only the first frame.
  Original Hexo sources and assets are in `../blog-src/source/_posts`.
  Compare original GIFs with derived WebP files before choosing animation
  sources: legacy WebP conversions can omit frames or change pause durations.
  Prefer the complete original animation when the versions differ.
  `image-size` omits the animated `avis` brand from its detector; our dimension
  helper routes it through the exported HEIF parser so image hydration still
  receives width and height.
- Rich-text fields in `content/cv.yaml` support inline Markdown while retaining
  compatibility with authored HTML. This applies to abstract paragraphs, entry
  details and items, subsection items, and section content; structural fields
  such as titles, dates, locations, and header data remain plain text.
- The `prebuild`, `prestart`, `pretest`, and `precheck` hooks run `pnpm generate:data`, so
  post metadata and generated content are refreshed before `pnpm build`,
  `pnpm start`, `pnpm test`, or `pnpm check`. The content typecheck includes
  the main generator, its TypeScript helpers, and post-local components.
  Run these lifecycle-hooked commands sequentially: they write shared generated
  files, and pnpm's dependency verification can also relink `node_modules`.
  When concurrent tasks share the checkout, use an isolated validation snapshot
  with its own generated directories and dependencies; a shared `node_modules`
  symlink can disappear or change during another task's installation.
  Seed the snapshot from a committed base and overlay only the task's changes;
  copying a live worktree can capture another task's incomplete edits.
- Files under `src/app/data` are generated from `content` and ignored by Git.
  Do not edit or commit them directly; update the source content files instead.

### ML Revisited Editorial Principles

These principles apply to the series under `content/posts/ml/ml-revisit/`.

- The visual SSL series lives under `ssl/`, with its reading map in
  `ssl/overview/index.mdx`. Keep the category root free of `index.mdx`, which
  would stop recursive article discovery; update the reading map and cross-post
  links when extending the series. Shared SVG primitives live in
  `ssl/overview/scripts/elements.tsx` and styles in `styles/media/ssl.css`.

- Write for readers with some machine-learning or LLM background who may be
  encountering the specific topic for the first time. The series should support
  both initial learning and review. Briefly establish necessary prerequisites
  and introduce the terms needed to follow the explanation.
- Use plain language, concrete examples, and intuition to explain the problem
  and how the mechanism works. Connect the reasoning steps and explain what
  equations mean, so a first-time reader can follow the argument.
  Establish the problem, then introduce each prerequisite before using it in
  the mechanism. Do not add a heading for every reasoning step. Keep long
  derivations and implementation refinements in native `<details>` when they
  would interrupt the main explanation.
- Preserve substantial technical content and rigor: mechanisms, assumptions,
  essential equations, tradeoffs, and practical implications. Make this content
  easier to follow through clear explanations and visual support.
- Keep prose concise and focused. Remove repetition and unnecessary background
  while retaining the intermediate reasoning a first-time reader needs.
  For wording corrections, fix the specific ambiguity without expanding
  familiar basics into a tutorial or adding redundant examples.
- Use illustrations generously when they make an idea clear at a glance.
  Prefer diagrams for architectures, data flows, tensor layouts, and comparisons.
  Keep captions and accompanying prose short and focused on how to read the
  visual. Follow the existing Post Diagrams conventions for implementation.
