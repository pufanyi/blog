# Modern communication protocols tutorial — 2026-09-22

## Scope and baseline

The user requested a blog tutorial synthesized from previously researched
university networking courses, with careful adherence to the blog's writing style.
The initial worktree was clean at `a15cdec`. No toolbar changes, commits, pushes,
or deployment are part of this task.

The article lives at `content/posts/cs/notes/modern-communication-protocols/`.
It follows one collaboration-app scenario through transport reliability,
timeliness, and application effects, with original bandwidth-delay, playout,
queueing, and retry examples. Three build-time SVG figures explain transport
head-of-line blocking, alternative WebRTC paths, and transactional retry
deduplication. There are no browser-side article scripts.

## Reading and source boundaries

The main agent read the project/content agreements, technical tutorial editorial
principles, publishing/development/architecture guidance, and existing multimedia
compression, simulation, and Muon articles. Research was split across transport,
real-time media, and messaging/RPC sources, with independent technical review of
the completed draft.

- Berkeley CS 168 supplies transport and congestion foundations.
- ETH's November 19, 2025 transport lecture supplies the transport evolution
  context. Stanford CS 249I's public Winter 2025 slides still include early QUIC
  handshake examples; current behavior is taken from RFC 9000/9001/9002 instead.
- UCSB CS 176C Spring 2026 L12 and five relevant chapters of WebRTC for the Curious
  were read. The UCSB notes contain an inconsistent playout-delay calculation,
  an overstrong 150 ms threshold, and simplified ICE/SFU claims. The article
  uses an original five-packet example and separate normative RFCs, not those
  claims. It does not assert that real-time media forbids retransmission or TCP.
- MIT 6.5840 2026 RPC notes ground timeout ambiguity. Official gRPC documentation
  and the Amazon Builders' Library ground cancellation/retry/idempotency limits.
- Cornell's Fall 2024 directory serves slides labeled Spring 2023; the citation
  preserves that distinction. Its gRPC material is a short optional introduction.
- The readable WUSTL MQTT lecture is the 2021 offering. The 2025 course omits the
  corresponding lecture, and the 2023 PDF was not retrievable. MQTT 5.0 defines
  the article's actual QoS claims. Northwestern DDS notes are undated; ROS 2
  QoS semantics are checked against the official Jazzy documentation source.
- WebTransport API status is pinned to the July 30, 2026 CR Snapshot; the HTTP/3
  mapping is draft 16, July 6, 2026. MoQ Transport is draft 21, September 8, 2026.
  Neither IETF draft is presented as a published RFC.

The 41 bibliography entries all have corresponding citations. The work adds the
durable lesson about reused course slides and normative specification checks to
the existing source-selection guidance in `content/AGENTS.md` and
`docs/writing/references.md`. No runtime or publishing contract changes.

## Validation notes

Node 24.18.1 and pnpm 12.3.4 match the repository. Lifecycle commands run
sequentially in the initially clean checkout; subagents do not run generation
or dependency commands concurrently.

The first generation exposed an existing `rehype-citation` limitation: grouped
same-author undated references crash its collapsed-year link generation because
`issued.year` is undefined. The article now places each undated citation beside
its own claim, preserving accurate `n.d.` metadata without changing dependencies
or the renderer. A general renderer fix remains outside this article's scope.

- `pnpm format:bib` and targeted Biome formatting completed; only the new
  bibliography and diagram source needed formatting.
- `pnpm generate:data` succeeded, with 102 posts and 145 exports.
- `pnpm check` passed after the final article and figure changes. It reported
  two pre-existing broken-symlink warnings under the ignored temporary browser
  runtime; the generator also reports the existing `punycode` deprecation.
- `pnpm test --watch=false` passed: 89 content tests and 201 application tests.
- `pnpm build` passed: 171 prerendered routes, 154 sitemap URLs, and 153
  negotiated Markdown alternatives.
- The generated Markdown preserves the worked formulas, all figure descriptions
  and captions, disclosure content, and bibliography. The prerendered article
  includes all 29 section/subsection heading IDs and 67 math containers.
- The served production route was tested in Chromium 151.0.7922.34 and WebKit
  26.5 at 1280 and 390 CSS pixels, in both light and dark themes. Each run checked
  3 figures, 59 SVG labels, 41 bibliography entries, and 62 local citation links.
  There were no missing citation targets, empty SVG titles, out-of-bounds SVG
  labels, MathJax error nodes, undefined TeX labels, local resource errors,
  page exceptions, or document-level horizontal overflow.
- Both disclosures were opened and the complete article traversed by section
  headings. No browser MathJax engine or speech-worker request occurred during
  ordinary reading. All formulas were statically rendered.
- Screenshots of the opening and all figures were captured in each combination,
  including right-scrolled narrow figures. Representative desktop/light,
  desktop/dark, mobile opening, and WebKit figure screenshots were visually
  inspected for CJK glyphs, label collisions, arrows, and contrast.

Browser validation used the existing ignored `tmp/score-review/` host-library
wrapper and Windows CJK font configuration, without dependency/host changes.
The task's temporary browser script and screenshots are in ignored
`tmp/protocols-review/`. This was focused served-article validation, not a run of
the complete site-wide Playwright suite. No push or deployment was performed.
