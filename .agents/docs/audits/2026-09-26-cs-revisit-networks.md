# CS Revisited: Computer Networks 01 — 2026-09-26

## Scope and organization

The user requested a new `cs-revisit` series in the style of `ml-revisit`, starting
with networking and covering CS 168 Fall 2026 weeks 1–4, with deeper explanations
and additional sources. They subsequently clarified that Computer Networks is
itself a multi-article subseries and requested an exact model byline.

The first article is
`content/posts/cs/cs-revisit/computer-networks/architecture-and-routing/index.mdx`,
titled **Computer Networks 01: Architecture and Routing**. The existing category
discovery supplies both series directories without configuration changes. The
byline is **GPT-6 Astra**, verified against this session's `turn_context.model`
metadata (`gpt-6-astra`). No other author is inferred.

Baseline commit: `d7c08af`. The user's pre-existing edits to
`content/posts/cs/notes/modern-communication-protocols/index.mdx` are preserved.
No commit, push, or deployment is included.

The initial temporary article root was moved one level deeper before publication;
there is no previously published URL to redirect. Two post-local build-time SVG
figures explain encapsulation and the weighted topology shared by the DV and
Dijkstra examples. There are no client-side article controllers.

## Research and coverage

Read root/content agreements, tutorial editorial principles, the first-post and
publishing guides, development/architecture/documentation ownership, browser
troubleshooting, and representative ML Revisited articles.

Downloaded and extracted all seven lecture PDFs linked by the FA26 calendar and
all three discussion solutions. Read the Traceroute guide, corresponding CS 168
textbook pages, Saltzer–Reed–Clark's 1984 end-to-end paper, Clark's 1988 design
paper, and official RFCs 1812, 2453, 2328, 4632, 8200, 4291, 4862, and 6146.
Raw source downloads and validation logs remain in ignored
`tmp/cs-revisit-research/`.

The article's final disclosure maps every lecture and discussions/projects to
its sections and links the exact FA26 lecture files. It covers:

- Federation, protocol/interface distinctions, packets, link delays, BDP,
  statistical multiplexing, circuit/packet switching, queues, layers, ports,
  encapsulation, narrow waist, end-to-end arguments, and fate sharing.
- Routing validity, destination-rooted delivery trees, additive metrics,
  control/data planes, static/direct routes, and intra/inter-domain scope.
- Distributed Bellman–Ford, updates from the current next hop, periodic and
  triggered advertisements, expiry, poisoning, split horizon, poison reverse,
  and count-to-infinity.
- Link-state discovery/flooding/versioning, Dijkstra, convergence microloops,
  hierarchical/classful/CIDR addressing, aggregation, LPM, multihoming, IPv6,
  and traceroute response matching/error handling.

Original worked examples extend the material with packet pipelines, unequal
packet/line-rate scheduling, burst backlog, a qualified M/M/1 derivation,
shortest-distance descent, aggregate holes, and IPv6 deployment distinctions.
The article does not claim to cover week 5 router hardware/BGP or later TCP.

## Source boundaries and technical review

Several FA26 PDFs retain Spring 2026 or 2025 text; cite them as the files served
by FA26 and preserve the distinction. Specific discrepancies are resolved from
primary specifications rather than repeated in the tutorial:

- Lecture 7's SLAAC slide describes choosing a prefix randomly. RFC 4862 instead
  grounds the explanation in advertised prefixes and interface identifiers.
- IPv4/IPv6 are not inherently interoperable, but translation mechanisms do
  exist (RFC 6146); avoid the slide's absolute “no way to convert” statement.
- Positive shortest-path distances suffice for loop freedom on a shared graph;
  globally identical tie-breaking is not necessary for that proof. Distinguish
  the shared-graph result from transient mixed forwarding states and ECMP.
- RIP's metric 16 is protocol-specific and distinct from IP TTL and route timers.
- CIDR total address count is not universally assignable-host count, and an
  aggregate can require a discard route for holes (RFC 4632 section 5).
- Clark's original priority order places cost effectiveness before low-effort
  attachment; the tutorial avoids adopting the lecture's reordered list.

Existing source-verification/editorial guidance already owns these lessons, so
no duplicate rule is added to AGENTS.md. The first-post, publishing, and
architecture guides were reviewed: this uses their existing category, metadata,
figure, citation, and export contracts, so no public handbook change is needed.

## Validation

Node 24.18.1 and pnpm 12.3.4 match the repository. Installed with
`pnpm install --frozen-lockfile`; all lifecycle commands run sequentially.

Validation results are recorded below after the final path/byline change.

- `pnpm format:bib` and targeted Biome formatting passed; only the new sources
  were formatted. All 22 bibliography entries are cited.
- `pnpm check` passed after the final figure correction. It reports the existing
  `punycode` deprecation and two broken-symlink warnings in an ignored temporary
  browser runtime; no source check failed.
- `pnpm test --watch=false` passed after that correction: 92 content tests and
  227 application tests across 31 application test files.
- `pnpm build` passed: 176 prerendered routes, 157 sitemap URLs, and 156
  negotiated Markdown alternatives.
- Independently recomputed the DV rounds, pipeline timing, burst backlog, and
  CIDR aggregation. Checked the generated Markdown for the exact byline,
  formulas, figure captions, disclosures, and bibliography; the old temporary
  article export was pruned after nesting the slug.
- Production browser checks use Chromium 151.0.7922.34 and WebKit 26.5, widths
  1280 and 390, in both themes. They verify both generated category entries,
  109 static formula containers, 22 bibliography entries, 23 citation links,
  two figures and 22 SVG labels; traverse all sections and open every
  disclosure; check for page overflow, missing local resources, browser errors,
  and accidental MathJax engine/worker loading during ordinary reading.
- Screenshots cover the opening and both figures, including right-scrolled
  narrow figures. Visual review found a translucent destination-node fill
  exposing edges behind its label; an opaque semantic-color mixture fixed it.
  Checks, tests, production build, and browser validation were repeated after
  that final change. Reviewed desktop/light, desktop/dark, mobile opening,
  and narrow WebKit figure screenshots for glyphs, contrast and overlap.

Browser scripts, logs, and captures are in ignored `tmp/cs-networks-review/`.
The existing temporary supported-WebKit wrapper and Windows CJK Fontconfig
settings were reused without changing dependencies or host configuration. This
is focused article validation, not the entire site-wide Playwright suite.
