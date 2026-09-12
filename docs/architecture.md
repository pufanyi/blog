# Architecture and contracts

Read the sections affected by a change. Authored data is the source of truth;
generated modules, exports, manifests, and deployment files are disposable.

## Generation and publication

`scripts/build-posts.mts` validates configuration/CV, discovers articles, renders
changed MDX and Markdown, builds summaries/search/feeds, then publishes dedicated
output trees. `scripts/lib/generated-files.mts` compares bytes, stages every
changed tree before replacement, journals rollback, and prunes stale output only
after successful staging. A failure preserves the last successful generation.
This is a single-writer transaction with rollback, not filesystem-wide atomic
visibility to arbitrary concurrent readers.

`content-cache.mts` hashes article MDX/BibTeX/assets, transitive literal local
imports, and compiler/configuration inputs. Cached HTML, Markdown, and search
text have integrity checks. A fast no-op requires both matching inputs and the
exact output manifest; missing/corrupt/extra outputs are repaired. Dynamic import
paths assembled at runtime are outside dependency discovery: keep authored
component imports literal and local. The cache lives in ignored
`.generated/content-cache`; removing it forces recompilation safely.

The output trees are `src/app/data`, `.generated/agent-content`, and the private
cache. Do not publish the cache or edit generated data directly.

- Site settings live in `configs/{site,blog,comments,redirects}.yaml`. The data
  generator validates them before emitting typed modules under `src/app/data`.
  The development watcher regenerates YAML changes automatically.

## Article payload and lifecycle

Article `styles.css` is embedded in that article's rendered HTML under
`style[data-post-style]`. Prefix selectors, preserve semantic theme variables,
and keep same-document SVG fragment URLs intact. Styles exist before JavaScript
and leave with the article DOM. Shared presentation remains in `PostComponent`.
Build-only styles and scripts are excluded by Angular's article asset rules.

The generator discovers `scripts/*.post-client.ts` and generates per-slug lazy
loaders. Each module exports `enhancePost(container): () => void`.
`bindPostEnhancements` owns async attachment and cleanup, including imports that
finish after navigation. Share numerical models with build-time TSX via literal
local imports. Adding an article must not require editing the application shell.

- Generated `POSTS` contains summaries only. Load article HTML/TOC through
  `loadPost` and the generated per-slug loaders. Load the search engine, serialized
  index and plaintext snippets through a separate dynamic import after the deferred
  search dialog opens; neither the dialog nor the eager shell should statically
  import that corpus. Idle prefetch may load the small dialog without initializing
  the engine. Discard outdated query results after edits or dismissal. Offer a
  page reload after loading fails: Chromium can cache failed module imports, so
  calling `import()` again need not retry the network request. Assess payloads on
  served production pages, since CLI initial totals exclude lazy chunks and external scripts.
  Measure cold search opening separately from warm queries and result rendering.
  Include worker requests when measuring search transfers; window resource timing
  omits those requests and can substantially undercount a worker-based index.

- Keep article presentation in `PostComponent`, DOM enhancement and cleanup
  in `PostContentDirective`, and TOC interaction in `PostNavigationComponent`.
  Use render hooks and cleanup callbacks rather than retrying DOM queries.
  Keep a shrinkable flex chain from the bounded TOC host to its scrolling list;
  percentage heights do not inherit a sidebar's `max-height` and can leave long
  lists clipped. Verify the final entry is reachable in both sidebar and drawer.
  `PostContentDirective` marks `.post-body` with `data-rendered="true"` after
  client DOM enhancements attach; browser tests asserting on client elements
  (such as embedded PDF readers) should wait for this attribute before querying
  or scrolling iframes to ensure hydration has settled.

- All Angular-authored images should use `app-image-lightbox`, which wraps
  `NgOptimizedImage` and `medium-zoom`. Do not add bare template `<img>` tags
  unless there is a concrete framework limitation.

- MathJax loads on demand through `src/app/utils/mathjax.ts`, with automatic
  typesetting disabled. Angular-authored views outside generated post content
  must call `typesetMath` after rendering when they contain TeX delimiters.
  Use MathJax's `displayOverflow: 'scroll'` for wide equations. Display wrappers
  use `flow-root` to contain margins without another scroll container: outer
  `overflow-x: auto` also enables vertical scrolling for small glyph overhangs.
  Keep raw display TeX wrappable before MathJax initializes, without introducing
  another scroll container around the finished formula.
  Keep raw TeX wrappable while the renderer is loading or unavailable.

Keep the pinned real-rendering test packages synchronized with the MathJax CDN
version. Its worker compatibility adapter and removal criteria are documented in
[mathjax-webkit.md](maintenance/mathjax-webkit.md).

## Routes, metadata, and reading interaction

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

- The shared 404 experience lives in `src/app/pages/not-found` and is also used
  for missing blog slugs. Keep its recovery and peer-review interactions
  covered by component tests. Preserve its academic copy during style-only
  changes; simplify framing and decoration first. The review dialog must capture
  keyboard focus and restore it when dismissed.

- Keep the search listbox explicitly `tabindex="-1"`: Chromium otherwise adds
  an overflowing results container to the Tab order. Its combobox owns arrow-key
  navigation; cover overflow explicitly in browser tests.

- Keep search-result animations local: AutoAnimate's removal animation adjusts
  window scrolling and can overwrite the page's saved reading position.

## Markdown, feeds, and deployment

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

## Embedded PDF readers

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

## Documentation pages

The handbook is authored once in `docs/`. Its navigation manifest groups pages for authors, developers, and historical maintenance records. The generator validates and compiles Markdown, adds heading IDs and highlighted code, rewrites repository/document links, and publishes page summaries, lazy body modules, and Markdown exports together with other generated files. Documentation changes participate in the generation fingerprint and the development watcher.

The lazy `/docs` route uses generated summaries for page routes and navigation. Server routes use the same summaries for prerendering. Each page resolves only its own body; documentation is excluded from blog summaries, feeds, and full-text search. Shared typography/code/table styles preserve the blog theme, while the documentation component owns its navigation and content enhancement lifecycle. Page metadata advertises the one-to-one Markdown alternative, allowing the existing postbuild sitemap and Worker route discovery to include docs without a second URL list. See [documentation maintenance](documentation.md) for the source format, link validation boundaries, and synchronization workflow.
