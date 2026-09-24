# Compression implementation — 2026-09-24

Base revision: `fa5b989`. Implements the first batch from the
[research](../audits/2026-09-24-compression-modernization.md): icon subsetting,
fingerprinted asset caching and oversized diagram raster payloads, with delivery
diagnostics. Responsive image generation, search serialization changes and
dictionary compression remain separate proposals.

## Changes and measured sizes

| Resource | Before | After | Measurement |
| --- | ---: | ---: | --- |
| Phosphor regular WOFF2 | 147,380 B | 4,300 B | Actual font file |
| Global production CSS | 82,158 B | 19,708 B | Fresh production builds |
| Global CSS, Brotli quality 11 | 12,523 B | 3,516 B | Local encoder, not CDN measurement |
| Active clean cat AVIF | 197,886 B | 84,034 B | Actual article image |
| Active noisy cat AVIF | 498,631 B | 195,262 B | Actual article image |
| Archived model SVG | 1,164,313 B | 513,553 B | Actual asset file |
| Archived attention SVG | 736,141 B | 331,649 B | Actual asset file |

Follow-up to the research inventory: the two standalone SVGs are retained legacy
assets, not the current article's rendered figures. The UMM article uses its
`diagrams.post-component.tsx`, which references `cat-clean.avif` and
`cat-noisy.avif`. Both active images were optimized too; their combined reduction
is 417,221 bytes (59.9%). Do not count the archived SVG reduction as reading-page
transfer savings. Both legacy files remain available at their existing URLs.

The 32-glyph font subset preserves upstream outlines and advance metrics exactly
(verified with FontTools). Discovery includes application templates/TypeScript,
CV/configuration data and the disclosure marker's CSS variable. Generation fails
on missing named icons. FontTools is an optional maintenance dependency, not a
normal build prerequisite; CSS and WOFF2 are checked in. The upstream MIT license
is retained in CSS.

Raster payloads were decoded and re-encoded with `avifenc -q 55 -y 444 -s 4 -j 4`.
This is lossy compression; original dimensions and single-frame structure remain
1280×1280 (clean) and 640×640 (noisy). A third image embedded in the legacy model
SVG was also re-encoded at its original 1024×678 size; its existing tiny solid
image was retained. Removing embedded data from the before/after SVG text yields
identical files, verifying all vector geometry, glyphs and transforms are intact.
The two archived SVGs combined compress to 551,730 B at Brotli quality 11, versus
1,343,192 B previously. Originals remain recoverable from the base Git revision.

Postbuild emits compact immutable-cache rules for hashed main/chunk/styles files
and the build-owned media directory. It checks filenames before applying those
rules, preserves authored `_headers`, and is idempotent. Unversioned post assets,
PDF assets, HTML and Markdown retain their existing policies. HTML/Markdown
negotiation remains private and varies on Accept. Publication requires deployment;
none was performed in this task.

Performance reports now record all observed first-party response types, including
fonts/images and worker requests, alongside existing decoded-code budgets. They
include encoding and browser-reported encoded/decoded sizes. Local Node preview
uses identity encoding; browser-reported body sizes can include transfer framing.

## Validation and existing budget failures

- `pnpm check`: passed after the final application/content/handbook changes.
  Biome reported two pre-existing broken symlinks under ignored
  `tmp/score-review/runtime`; they did not fail the check.
- `pnpm test --watch=false`: 92 content tests and 226 application tests passed.
- `pnpm build`: passed after final media/handbook changes, with 171 prerendered
  routes and generated cache headers.
- Final focused browser run: immutable cache/negotiation check passed on
  Cloudflare, and no-JavaScript disclosure/formula checks passed on desktop and
  mobile Chromium (three passed, two expected cache-test skips).
- Served-page visual checks passed in Chromium and WebKit 26.5 at widths 1280
  and 390, DPR 2. Captured both UMM figures in light/dark themes before and after
  the active-image update; inspected the figures, homepage/CV icons and article
  icons. All active image responses returned 200. The host's temporary WebKit
  wrapper supplies missing Linux libraries; no system or project dependency
  change was needed. Standalone legacy SVG comparisons also retain vector labels
  at enlarged rendering sizes.
- Cloudflare/desktop agent-content suite: 14 passed, two expected desktop skips.
  This includes immutable cache headers, unchanged HTML/Markdown negotiation,
  canonical routes, 404 behavior, feeds and documentation exports.
- All three performance-budget tests exceed old thresholds. To establish the
  baseline, created `/tmp/blog-compression-baseline` at `fa5b989`, installed its own
  dependencies with `pnpm install --frozen-lockfile`, built it, and ran its original
  performance tests. It reproduces the same three failures. No thresholds changed.

The following comparison was taken before the final media/handbook rebuild;
the active UMM image changes do not participate in these three code budgets.

| Route/action | Base decoded code | Updated decoded code |
| --- | ---: | ---: |
| Homepage | 485,191 B | 422,741 B |
| Blog archive | 751,115 B | 688,671 B |
| CF551C article | 858,417 B | 795,987 B |
| First search, additional | 2,115,808 B | 2,115,808 B |

Updated HTML adds about 0.8–0.9 KB of critical icon CSS variables. The decoded
program savings are about 62 KB per measured route, principally the smaller
global stylesheet. Search data is byte-identical and still exceeds its old
1,923,536-byte limit. Archive and article remain above their old code limits even
after the reduction. These are observed limitations, not a successful budget run.

Temporary comparison reports are under `/tmp/blog-compression-evidence` and visual
captures under `/tmp/blog-compression-review`. The owning developer, deployment,
media and performance guides were updated; article prose, routing semantics and
formula-rendering contracts are unchanged.
