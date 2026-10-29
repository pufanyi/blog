# Architecture and contracts

Read the sections affected by a change. Authored data is the source of truth;
generated modules, exports, manifests, and deployment files are disposable.

## Frontend ownership

The application is organized by feature, with narrow shared and platform layers:

| Owner | Responsibility |
| --- | --- |
| `src/app/app.*` and root routes | Application composition, navigation feedback, metadata composition, browser/server providers |
| `src/app/shell` | Site toolbar, footer and routed page slot |
| `src/app/features/reader` | Article resolution, reading page, outline/dialog and article DOM lifetime |
| `src/app/features/search` | Small shell launcher, deferred dialog, query session and deferred search engine |
| Other `src/app/features/*` | Blog archive/directories, docs, profile, CV, ICPC, PDF and redirects |
| `src/app/platform` | Theme, history/reload scrolling, page chrome registration and metadata DOM writer |
| `src/app/shared` | Reused UI, rich-content presentation, math and focused browser helpers |
| `src/contracts` | Framework-free build/browser types, URL/pagination rules and search encoding |
| `src/app/data` | Disposable generated modules; this output location is unchanged |

Features own their components, data adapters, runtime helpers and colocated tests.
Small features remain flat. Shared code has actual multiple consumers; it is not
an alternative bucket for feature-specific utilities. Build scripts use contracts
rather than importing application implementations. Framework injection tokens stay
with their runtime owner.

Features may compose another feature's route entry point, but cannot import its
internal implementation. Shared/platform modules cannot import features or shell.
The shell imports only search's small launcher; the dialog and engine retain their
separate deferred boundaries. Root composition can connect feature-specific
metadata builders to the platform's descriptor writer. `pnpm check:boundaries`
resolves imports, re-exports and literal dynamic imports and enforces these
boundaries as part of `pnpm check` and CI's generated checks.

Route pages coordinate their feature's state and register page chrome through
`PageChromeService`. A registration exposes update/dispose operations; public
chrome signals are read-only. Only the current registration may update or clear
the state, so late cleanup from a replaced page cannot remove the new page's
controls. Actions receive their actual activating button so dialogs can restore
focus even when WebKit pointer activation leaves `document.activeElement` unchanged.
Nested navigation components emit selections rather than writing to
application services. A reused reader page updates its registration, while each
article's keyed view owns its body runtime and navigation lifetimes.

The reader page commits heading fragments through the router. The body adapter
adopts or installs compiled HTML and attaches `ArticleRuntime`, which owns
observers, interactions and pending completions until that DOM is replaced.
Desktop outline positioning and mobile dialog transition/focus behavior have
separate directives on the existing elements, avoiding extra layout wrappers.
The TOC tree owns its disclosure state. Search similarly separates per-dialog
query state (`SearchSession`) from modal DOM mechanics and the shared engine cache.

Each route owns its paper element. `shared/layout/paper.css` supplies the ordinary
paper rules; reader and docs own their specialized geometry. The shell has no
paper wrapper for pages to undo. Reading pages explicitly request mobile dock
clearance through page chrome, which the shell applies around its page/footer.
Feature CSS does not discover ancestors to change shell geometry. Rich-content
typography, code/table styling and code-copy behavior are shared directly by
reader and docs. Existing rendered classes, CSS values, URLs and authored content
contracts are preserved.

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

`github-code.mts` expands standalone bare GitHub permalinks in the MDX syntax tree,
before HTML and Markdown export. It accepts full commit SHAs with explicit line
ranges, fetches only public raw GitHub files with bounded size/time, and caches
whole files by immutable URL in `.generated/github-code-cache`. Cache entries have
checksums and atomic writes; concurrent quotations share a request, while failures
can be retried. This separate cache is not a published output or a content watcher
input. Missing/corrupt entries are fetched again when an article is rendered.
The ordinary content cache still handles no-op builds. To force a refetch, remove
both caches. The code renderer preserves external annotation-like comments and
adds original line numbers as presentation attributes, leaving copied code intact.
The reader reuses its shared code-copy lifecycle; no GitHub fetch runs in the browser.
See the [authoring syntax](writing/markdown.md#github-code-quotations).

- Site settings live in `configs/{site,blog,comments,redirects}.yaml`. The data
  generator validates them before emitting typed modules under `src/app/data`.
  The development watcher regenerates YAML changes automatically.

## Article payload and lifecycle

The shared shell uses one fixed, responsive toolbar for home/blog navigation,
search, printing, and theme switching. Desktop controls include text; mobile
controls keep 44px touch targets. Article directory controls join this toolbar
below 1024px, while wider screens use the persistent article outline. Context
labels and actions come from the current page’s scoped `PageChromeService` registration.
`--toolbar-safe-area-top`, `--toolbar-height` and `--toolbar-clearance` in `src/styles.css` reserve space for
the header and device safe area in paper layout, sticky sidebars, and heading
anchor positions. Disclosure summaries use the same clearance when scrolled into
view. Keep those consumers aligned when changing header dimensions.
The toolbar is excluded from print output and embedded PDF readers.

The reading design retains the original warm paper, subtle shadow, centered
ruled titles, compact lists and Morandi colors. The paper is capped at 900px
(1150px for documentation). From 1024px, articles with an outline use a transparent
1140px layout containing a 200px external outline, a 40px gutter, and a separate
900px article paper. The article paper owns the warm surface, shadow, breadcrumbs,
title and body; the outline remains on the surrounding page background. Its
original padding preserves the 795px text column when space permits. Center the
article itself on wide screens, smoothly yielding to a 4% left gutter when both
columns need the space. Narrower laptop widths can shrink the article paper.
Use a row subgrid to align the external outline with the title below the
breadcrumbs, including wrapped breadcrumbs; do not hard-code that vertical offset.
The reader’s outer paper remains the only surface below 1024px and on articles
without an outline. Screen-only surface rules leave print with one continuous,
unframed article. Once the title row
passes the toolbar, pin the outline to the viewport rather than the grid's bottom
boundary, keeping its header reachable at the page end. An intersection observer
tracks a one-pixel row marker; no scroll handler or scroll-time geometry reads are
needed. Reset and dispose the observers on viewport/layout changes and navigation.
Body text uses the original 15px desktop / 14px
mobile baseline, with Space Grotesk headings. Prose is left-aligned: justification
stretched CJK lines beside unbreakable formulas and inline code. Font tokens name
platform CJK faces after the Latin families, because those lack CJK glyphs. The toolbar matches that typography
and paper surface. Its background spans the viewport and sits flush with the
top edge, separated from the page by a subtle bottom rule and shadow. Navigation
and article controls sit at the left edge; search, print, and theme controls sit
at the right. Responsive 12–32px gutters respect device safe areas. The toolbar
does not inherit the paper's width limit, so controls stay in place when moving
between different paper widths. Article/documentation layouts set
`--paper-max-width` on their own paper elements. Desktop navigation combines
the author avatar / Blog icon and text; mobile keeps
the avatar and compact icons. The current location uses a subtle full-button tint with a small
corner radius, without a tab underline. It is 56px tall on desktop and 52px on
mobile, plus the device safe area inside the header surface; reduced-motion settings
must not change its dimensions. Theme tokens live in
`src/styles/morandi.css`. Preserve visible keyboard focus and readable colors in
both themes. The borderless article outline shows numbered chapters with separate
subsection disclosure buttons. Its labeled header can collapse the whole outline
while retaining the current section and reopen control. Keep the text column and
scroll position unchanged when doing so; new articles start expanded.
The current chapter opens automatically unless the
reader explicitly overrides it; preserve these choices and keyboard focus until
the article changes. Sidebar and dialog disclosures must use distinct IDs. Render
all section links in static HTML and enable folding only after hydration.
Chapter and whole-outline disclosures animate their grid rows, with closed
content made inert and hidden from assistive technology immediately. Keep the
bounded flex/grid chain intact so long lists still scroll independently. The
outline is titled "On this page" in the sidebar and the sheet; "Contents" names the
blog directory. Chapters use the primary text color and subsections the secondary
color. Selection uses the link color and an inset marker, without a row tint or a
font-weight or text-geometry change. On subsections the marker covers the shared
rail. A chapter containing the current subsection highlights only its number.
From 1024px the current section supplies the toolbar context. The outline footer
is one "Position in article" bar and percentage rather than a completion claim. Never auto-scroll
the outline while its links are hovered or keyboard-focused.
On narrower screens, a fixed bottom contents dock always shows its label and the
current section (or section count before reading). It replaces the former inline
entry that scrolled away. It is the only contents control and section context at
these widths: the toolbar adds no contents action and hides its context. The dock
opens a native bottom-sheet dialog and also holds the back-to-top button, so no
floating control covers body text. Reserve the dock height, including the device
bottom safe area, at the end of the document. Remove that space
for other routes and print. Preserve 44px touch targets, Escape dismissal,
focus restoration, section-link focus and independent scrolling. Resizing into the
wide layout closes the dialog without focusing its now-hidden trigger.
Opening the sheet reveals the current section again, even when it changed while
the dialog was closed. Its surface and backdrop enter/exit together; reduced
motion disables those transitions and disclosure motion.
Keep the native dialog open and modal through its explicit exit state; then close
it before positioning/focusing a selected heading. This avoids depending on
cross-browser discrete top-layer/display transitions. Cancel the exit listener
and fallback timer on route cleanup or a resize into the wide layout.
Keep a small end inset in the scrollable list so fractional scroll offsets cannot
clip its final link. Hide the navigation component's host for print, rather than
letting encapsulated wide-screen selectors override a global sidebar rule.
The outline's initial grid-row position bounds its scroll viewport, measured on
layout/viewport changes rather than every scroll; dispose the resize observer and
listener on navigation. Print removes shell spacing,
shadows and navigation while preserving article and CV content.
Keep the `app-post` host block-level: an inline host spanning block content can
intercept disclosure clicks in mobile Chromium after scrolling within the flex
shell. The code-disclosure browser regression covers that interaction.

Code blocks use equal top and bottom padding. The shared code renderer marks the
last line with `terminal-newline` when the source ends with a newline. Hide that
terminal placeholder without removing its DOM text; Shiki may nest empty token
spans inside it, so CSS `:empty` alone is insufficient. Preserve interior and
intentional trailing blank lines, and the source whitespace used by Copy and
Markdown exports. Browser regressions cover article and handbook code blocks.

Article `styles.css` is embedded in that article's rendered HTML under
`style[data-post-style]`. Prefix selectors, preserve semantic theme variables,
and keep same-document SVG fragment URLs intact. Styles exist before JavaScript
and leave with the article DOM. Shared presentation remains in `ReaderPageComponent`.
Build-only styles and scripts are excluded by Angular's article asset rules.
Reusable build-time visual primitives live in `content/shared`; post components
import them directly, and the content cache follows those imports so a shared
change regenerates only its consumers. Their prefixed presentation styles are
global because the same generated markup appears in more than one article.

The generator discovers `scripts/*.post-client.ts` and generates per-slug lazy
loaders. Each module exports `enhancePost(container): () => void`.
`bindPostEnhancements` owns async attachment and cleanup, including imports that
finish after navigation. Share numerical models with build-time TSX via literal
local imports. Adding an article must not require editing the application shell.
Mark a static example with `data-post-enhancement="forward"` to defer
`forward.post-client.ts` until its example is within 600px of the viewport or
receives focus/pointer interaction. Multiple names are space-separated. Modules
without matching markers retain immediate attachment. Comments use the same
near-viewport boundary; navigation disposes pending observers and imports.

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
  On a direct article visit, transfer only the TOC and adopt the existing
  prerendered body identified by its slug; do not import or rewrite that body.
  This initial-only adoption is not cached as a full post. Subsequent SPA visits
  still use the article loader, including returning to the initially opened post.

- Keep article presentation in `ReaderPageComponent`, DOM enhancement and cleanup
  in `ArticleRuntime` through `PostContentDirective`, and TOC interaction in `PostNavigationComponent`.
  Use render hooks and cleanup callbacks rather than retrying DOM queries.
  Keep a shrinkable flex chain from the bounded TOC host to its scrolling list;
  percentage heights do not inherit a sidebar's `max-height` and can leave long
  lists clipped. Verify the final entry is reachable in both sidebar and drawer.
  `PostContentDirective` marks `.post-body` with `data-rendered="true"` after
  client DOM enhancements attach; browser tests asserting on client elements
  (such as embedded PDF readers) should wait for this attribute before querying
  or scrolling iframes to ensure hydration has settled.

- Angular-authored content images use `app-image-lightbox`, which wraps
  `NgOptimizedImage` and `medium-zoom`. The toolbar avatar is a decorative
  `NgOptimizedImage` inside the Home link, not zoomable content: keep its alt
  text empty and let the link own its accessible name, focus and navigation.
  Do not nest the lightbox's button semantics or extra tab stop inside that link.

- Article formulas are compiled by `scripts/lib/static-math.mts` using pinned
  MathJax CHTML, per-article adaptive CSS, assistive MathML and first-party fonts.
  Formula-bearing heading labels in the table of contents reuse that build-rendered
  output; their plain-text labels remain available for navigation metadata.
  Formula nodes in outline labels suppress the context menu, including the
  collapsed current-section label; ordinary outline text keeps native link menus.
  Static containers express MathJax's font-height matching in CSS `ex` units,
  using the output font's x-height and minimum scale. This lets the browser use
  the actual surrounding font, including after webfont loading, instead of
  freezing Node's fallback metrics into a percentage. Keep runtime MathJax's
  normal font-height matching; verify visual size across fonts and font sizes.
  Serialize rendering and create a fresh TeX input parser per article so macros
  and counters cannot leak between articles or incremental rebuilds. Search and
  Markdown use the pre-typeset source, not expanded formula markup.
  Formulas in closed disclosures are also static: opening them needs no engine.
  Copying a selection containing formulas uses retained TeX with inline or display
  delimiters; right-click keeps the browser's native behavior and must not replace
  or resize formula DOM. Printing opens disclosures temporarily and restores their
  previous state afterward. Keep the complete article DOM.
- MathJax loads on demand through `src/app/shared/math/mathjax.ts`, with automatic
  typesetting disabled. Angular-authored views outside generated post content
  must call `typesetMath` after rendering when they contain TeX delimiters. The
  runtime uses only the TeX input and disables MathJax's custom context menu.
  Use MathJax's `displayOverflow: 'scroll'` for wide equations. Display wrappers
  use `flow-root` to contain margins without another scroll container: outer
  `overflow-x: auto` also enables vertical scrolling for small glyph overhangs.
  Keep raw display TeX wrappable before MathJax initializes, without introducing
  another scroll container around the finished formula.
  Keep raw TeX wrappable while the renderer is loading or unavailable.

- The heading spy caches document coordinates and uses binary search on scroll.
  Refresh after article/body resize, disclosure changes, media loads and font
  changes; never rescan every heading on every scroll frame. Disconnect all
  observers/listeners and ignore late async completion when leaving an article.

- Enhanced TOC clicks commit their fragment through the router with manual scroll
  ownership before moving. Keep ordinary anchor URLs, modifier-click behavior and
  the no-JavaScript fallback. History/reload restoration and non-TOC links retain
  their existing scroll behavior; a repeated target must still work without adding
  a duplicate history entry. Nearby targets use a bounded eased scroll; jumps
  beyond three viewport heights go directly to the destination instead of racing
  through a long article. Each animation frame uses an explicit instant scroll so
  global CSS smooth scrolling cannot start a second animation.
  Hold the selected chapter during travel, then focus its heading without another
  scroll and briefly tint that heading on arrival. The deliberate selection remains
  until the reader moves or the layout changes, including targets too close to
  the document end to align with the activation line. Wheel, touch, pointer, scrolling/focus keys, history,
  resize, a newer jump and navigation cleanup cancel pending work without a late
  focus transfer. Reduced-motion readers get direct positioning and no arrival
  animation. Do not add scroll-frame heading measurement or a second history stack.
  Reveal a target's enclosing disclosures before measuring its position, as native
  fragment links do, including nested `<details>`.

Keep the pinned real-rendering test packages synchronized with the MathJax CDN
version. Its worker compatibility adapter and removal criteria are documented in
[mathjax-webkit.md](maintenance/mathjax-webkit.md).

## Routes, metadata, and reading interaction

- The shared toolbar always links to the homepage and `/blog` on desktop and
  mobile. Router link state highlights the active destination, including blog
  articles and directory pages.

- The root application shows an indeterminate top bar while client router
  navigation waits for lazy routes or resolved content.
  Completion, cancellation, and skipped navigation clear the status; failures
  offer a normal document link to reopen the destination, avoiding cached failed
  module imports. A missing lazy chunk usually means an open tab crossed a
  deployment, so that specific failure performs one full-document navigation to
  the destination. Session storage suppresses another automatic attempt for the
  same URL for 30 seconds; storage failures and repeated import failures retain
  the manual link instead of entering a reload loop. New navigation clears
  previous failures. The failure notice uses a live status region. Feedback does
  not block reading or other navigation, respects reduced motion, and starts
  after hydration so prerendered pages do not acquire an initial loading overlay.

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
  Posts marked `private: true` retain a direct prerendered route for host-level
  access control, but are excluded from public archives, directories, search,
  feeds, sitemaps, Markdown exports, and discovery metadata. This visibility
  split also keeps their content loaders out of the browser build; the server
  build loads them only while prerendering the protected HTML route. Protect or
  isolate article assets and source repositories separately.
  Use full path strings for router navigation; encoding an entire slug or passing
  it as a single noninitial router command turns `/` into `%2F`.

- `PageMetadataStrategy` handles browser and prerendered metadata.
  It also owns article `BlogPosting` JSON-LD: reuse authored dates and article
  covers, omit unknown modification dates and unrelated fallback images, and
  escape `<` when serializing JSON into HTML script elements.
  Homepage/CV `ProfilePage` data and matching article bylines share the
  `/#person` ID. Additional front-matter authors remain named author nodes
  without being misclassified as the profile owner.
  Build the compact generated person data from rendered CV content and its
  external profile links; avoid importing the full CV into the eager metadata
  service. Use the configured author avatar for its image, independently of the
  visible introduction portrait. Clear page-specific structured data when navigating away.
  `PageScrollService` consumes router scroll events and corrects saved positions
  or fragments after fonts/formulas settle, unless the reader has scrolled.
  It saves one viewport snapshot in tab-local session storage on `pagehide` and
  when the tab becomes hidden, without writing on every scroll. Only a browser
  reload restores this snapshot, including when the URL still contains an older
  fragment. The snapshot must match the full URL and applies only to initial
  navigation; new article/fragment navigation and router history restoration keep
  their own behavior. Hydrated pages restore after the first render and again
  when content settles. Storage failures must not prevent navigation. Avoid
  saving into history state during `pagehide`: Chromium has already captured
  the state that the replacement document will receive.

- The shared 404 experience lives in `src/app/shared/ui/not-found` and is also used
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
  Profile exports reuse rendered CV data. Article exports carry the authored
  byline, falling back to the site author when no byline was supplied. Never
  maintain a second copy of prose.
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
  Postbuild also appends immutable caching rules for Angular's fingerprinted
  JS, CSS and media, validating the reserved output namespaces. See
  [deployment](deployment.md) for their scope; negotiated HTML/Markdown caching
  remains separate.

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
  latest known authored date (`updated ?? date`), never the build clock. Entries
  carry each article's authored byline or the site-author fallback. Feed
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

The handbook is authored once in `docs/`. Its navigation manifest groups pages for authors and developers. Agent working records live separately in `.agents/docs/` and are not published. The generator validates and compiles Markdown, adds heading IDs and highlighted code, rewrites repository/document links, and publishes page summaries, lazy body modules, and Markdown exports together with other generated files. Documentation changes participate in the generation fingerprint and the development watcher.

The lazy `/docs` route uses generated summaries for page routes and navigation. Server routes use the same summaries for prerendering. Each page resolves only its own body; documentation is excluded from blog summaries, feeds, and full-text search. Shared typography/code/table styles preserve the blog theme, while the documentation component owns its navigation and content enhancement lifecycle. Page metadata advertises the one-to-one Markdown alternative, allowing the existing postbuild sitemap and Worker route discovery to include docs without a second URL list. See [documentation maintenance](documentation.md) for the source format, link validation boundaries, and synchronization workflow.

The Antichess article keeps static SVG boards and its PGN in the generated
body. Its `boards.post-client.ts` enhancement loads Chessground near the article's
boards, replaces their visual presentation, and provides a main-line stepper
with a Lichess-style move table, whose controls also respond to the arrow, Home,
and End keys.
Both renderers share the authored move list and local SVG pieces. Navigation
calls Chessground's destroy method and restores the static figures. The player
replays a fixed line; it is not a free-play Antichess rules engine.
