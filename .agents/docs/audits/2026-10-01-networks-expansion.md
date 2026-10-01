# Architecture and routing expansion — 2026-10-01

## Scope and findings

Baseline: `d88df81`; the checkout was clean. The user requested a deeper review
of `computer-networks/architecture-and-routing`, especially Berkeley's design
ideas and explanatory diagrams, including animation and interaction.

Preserve the existing article, examples, byline, and scope (FA26 weeks 1–4).
Expand the reasoning within its sections rather than adding later TCP or BGP
chapters. The missing depth was primarily the connection between constraints,
architectural choices, and distributed failure behavior, rather than missing
names of algorithms.

The expansion explains federation/incremental deployment, feedback latency and
timeouts, reservation coordination, sharing/fairness, protocol versus interface,
local versus global delivery, demultiplexing, the motivation for a weak common
service, acknowledgement boundaries, fate sharing, design priorities,
destination-based state and delivery trees, optimal substructure, convergence,
DV stale dependencies, incremental advertisements per neighbor, LS versioning,
source trees versus destination trees, hierarchy and address/topology alignment.
Repair the original scheduling disclosure's damaged `max`, `left`, `right`, and
`frac` TeX, including four literal form-feed characters in place of `\f`.

## Source verification

Verified the [FA26 calendar](https://fa26.cs168.io/) and downloaded all seven
lecture PDFs, extracted their text with temporary `uv run --with pypdf`, and
read the relevant lecture material. Consulted the official CS 168 architecture,
resource-sharing, routing-state, routing-model, DV, LS, and addressing pages,
the [routing project](https://fa26.cs168.io/proj2/#stage-10a-incremental-triggered-updates),
Saltzer–Reed–Clark's original end-to-end paper, Clark's design paper, and the
RIP/CIDR specifications. Temporary downloads and extraction stay in ignored
`tmp/networks-expansion/`.

Add direct citations for lectures 1–6 and the routing project's incremental
updates. The project (rather than lecture 6 alone) supports the per-port
advertisement-history refinement. Preserve the distinction between the FA26
published files and old headers/text reused inside them. Keep Clark's original
priority ordering, the positive-cost loop-freedom proof, and the existing
IPv6 corrections; do not inherit simplified or incorrect slide claims.

## Visual and browser implementation

Add fifteen figure groups (twenty-one total), including four interactive groups:
DV propagation, failure/count-to-infinity with poison-reverse comparison,
Dijkstra, and longest-prefix lookup with withdrawal. The other new figures
cover packet pipelines, aligned versus staggered bursts, backlog area,
narrow waist, demultiplexing, acknowledgement boundaries, fate sharing,
forwarding validity, flooding versions, LS microloops, and routing hierarchy.

Share the existing weighted topology between the original diagram and numerical
models. Compute every routing frame once in `routing-model.ts`, consumed by both
static TSX/transcripts and the browser controller. Distinguish the directions
of destination-rooted forwarding and source-rooted predecessor trees. Failed
routes do not draw forwarding arrows; infinity is not a finite cost. Prefix
lookup normalizes unsigned bitwise results and handles `/0`, `/32`, invalid
input, and nested exceptions after withdrawal.

The controller uses the documented `data-post-enhancement="routing"` near-viewport
loader. Controls appear only after attachment. Playback is opt-in; manual steps,
reset, range input, and poison comparison work without timed playback. Pause
when offscreen/hidden and lengthen steps for reduced-motion preferences. Abort
listeners, disconnect observers, and clear timers at cleanup. Keep full static
records and captions in Markdown exports and no-JavaScript HTML.

Reviewed `docs/architecture.md`, `docs/development.md`,
`docs/writing/first-post.md`, `docs/documentation.md`, and browser troubleshooting.
No public handbook contract changes: this uses the existing article-local
components/styles/controller, SVG, lifecycle, metadata, and export conventions.
No application-shell changes, package additions, commit, or push.

## Validation

Use Node 24.21.0 and pnpm 12.6.0. Install with `pnpm install --frozen-lockfile`.
Run lifecycle commands sequentially. Retain final command and browser evidence
in ignored `tmp/networks-expansion/`.

Final `pnpm check` passed formatting, lint, template/TypeScript checks and
bibliography validation. `pnpm test --watch=false` passed 96 content/tooling tests
and 231 application tests, including four new numeric routing/prefix tests.
`pnpm build` prerendered 180 routes and prepared 160 Markdown alternatives.
`git diff --check` passed.

Served the production output locally and exercised Chromium 151.0.7922.34 and
WebKit 26.6 at 1280 px and 390 px in both light and dark themes. The focused
article checks cover numeric steps and arrows, poison comparison, keyboard
range navigation, prefix withdrawal and invalid input, opt-in playback,
offscreen pause, and navigation cleanup on retained DOM. All twenty-one figures
are present without JavaScript, with controls hidden and complete routing
transcripts. Ordinary reading requests no browser MathJax engine; rendered math
has no error nodes, and the page has no horizontal overflow. Reviewed individual
diagram screenshots, including mobile diagram scrolling. These are focused
production checks, not a run of the entire site's browser regression suite.

The local WebKit launcher needs the existing extracted libraries, Fontconfig
configuration, and software Mesa EGL/GL paths described by the browser
troubleshooting setup. No dependency or public browser contract changed.
Inspected the generated Markdown for repaired TeX, full diagram descriptions and
transcripts, and absence of interactive input/button markup.
