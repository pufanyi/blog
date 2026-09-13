# Long article rendering performance

RL and Diffusion need a rendering strategy that remains responsive as their explanations grow. Production-browser measurements identify whole-article formula typesetting as the first optimization target. This record separates measured behavior from proposed implementation work.

This runtime workstream supports the broader [long-article reading design](../maintenance/long-article-reading.md), which also covers orientation, navigation, typography, continuation, detours, diagrams, and complete printing. Follow that page's overall task order when implementing the reader experience.

## Scope and method

The primary measurements use commit `1f7b856`, after CPS moved into the RL article. An earlier exploratory run used `f0f5b53`. Authoring continued independently; these are fixed snapshots, not measurements of every subsequent revision or the deployed website.

Both snapshots were built with `pnpm build` in an isolated checkout with its own dependencies and served through `pnpm preview`. The main comparison used Node 24.18.1, Playwright 1.62.1's matching headless Chromium, a 390 × 844 viewport, and no CPU throttling. Each case used a fresh browser context. RL was measured three times per variant, alternating the existing implementation and the lazy experiment.

The actual pinned MathJax 4.1.3 engine, fonts, speech worker, and speech maps were served from local packages. Unrelated external integrations were stubbed. This removes CDN variability while retaining formula processing; the timings describe this host, not a physical phone or production network.

Instrumentation recorded main-thread tasks longer than 50 ms, long animation frames, article element counts, MathJax queue completion, and heading geometry reads. The initial observation window ends after the math queue and fonts settle, followed by a 500 ms observation interval. Queue completion includes asynchronous work and must not be described as continuous UI blocking.

The subsequent stress pass made 90 scroll-position updates, one per animation frame, using the document height at the start of that pass. Deferred rendering changes page height, so the variants do not necessarily expose identical content during this pass. It detects deferred stalls; it is not a controlled FPS comparison or a simulation of normal reading speed. No field INP, LCP, or Lighthouse TBT score was measured.

## Measured baseline

Counts below cover element descendants of `.post-body`, excluding text nodes and the application shell. Formula counts include inline equations and diagram labels.

| Article | Elements before MathJax | Elements after MathJax | Rendered formulas | Formulas inside closed disclosures | Longest initial main-thread task |
| --- | ---: | ---: | ---: | ---: | ---: |
| RL | 1,534 | 25,563 | 474 | 41 | 1,119 ms median; 1,050–1,169 ms across three runs |
| Diffusion | 2,826 | 10,281 | 195 | 34 | 425 ms; one run |

RL's decoded HTML response was 279,118 bytes; Diffusion's was 477,603 bytes. Despite having the smaller response, RL produced the larger rendered article and longer initial tasks. Source length and response bytes alone therefore do not explain the observed cost.

After full typesetting, the unthrottled RL scroll passes recorded zero long tasks in two runs and one 75 ms task in the other. Diffusion recorded none. This supports prioritizing startup processing on this host; it does not establish smooth scrolling on slower devices.

The earlier `f0f5b53` RL experiment provides two additional diagnostic controls:

- Replacing MathJax with a no-op reduced the longest initial task from 1,052 ms to 60 ms in single runs. This is an attribution experiment, not an acceptable product behavior.
- At 4× CPU slowdown, the existing implementation recorded a 4,302 ms initial task and long tasks during scrolling. This is a stress configuration, not a calibrated model of a particular phone.

## Why the current implementation scales poorly

[`PostContentDirective`](../../../src/app/directives/post-content.ts) passes the entire article to [`typesetMath`](../../../src/app/utils/mathjax.ts). MathJax is downloaded on demand, but its processing within an article is eager. It also processes formulas inside closed `<details>` elements. Folding a derivation reduces visible content without eliminating that initial processing.

[`HeadingScrollSpy`](../../../src/app/utils/heading-scroll-spy.ts) reads every heading's bounding rectangle, the article rectangle, document heights, and a computed scroll margin on each scheduled scroll frame. The RL stress pass recorded 3,696 heading rectangle reads. These reads do not necessarily cause a fresh layout every time; their cost becomes more concerning when formulas or disclosures invalidate layout. They would also need review before applying rendering containment to offscreen sections.

The existing [resource budgets](../../../docs/maintenance/performance.md) measure decoded payloads and stub MathJax. The real-engine rendering suite checks correctness, including fonts and WebKit, but does not impose long-article runtime budgets. These are useful complementary checks; neither currently establishes responsiveness for a growing RL article.

## What the lazy experiment established

The experiment injected MathJax's official `ui/lazy` extension with `lazyMargin: '400px'` through the browser test's script response. Application source and authored prose were unchanged. MathJax documents this extension as a way to defer output for offscreen formulas, with look-ahead margins and an option to always typeset selected containers. Its documented equation-reference limitations still need consideration. See [MathJax lazy typesetting](https://docs.mathjax.org/en/latest/output/lazy.html).

| RL metric | Existing implementation | Lazy experiment |
| --- | ---: | ---: |
| Initial article elements | 25,563 | 3,255 |
| Longest initial task, median of three runs | 1,119 ms | 173 ms |
| Longest initial task, observed range | 1,050–1,169 ms | 164–187 ms |
| Long tasks during the rapid scroll pass | 0–1 | 9–10 |
| Longest task during that pass | 0–75 ms | 129–154 ms |

The smaller initial DOM and shorter startup tasks make deferred output promising. However, enabling the extension alone transfers some work to scrolling. In the earlier 4× slowdown experiment, a lazy scroll task reached 576 ms. This configuration should remain an experiment until its interaction behavior is acceptable.

Lazy MathJax creates containers for pending formulas. Counting `mjx-container` alone cannot prove that every formula has been typeset. Future tests must check rendered content in the section under test. The experiment recorded no explicit MathJax error nodes or failed asset requests, but it did not validate all labels, print output, assistive interactions, or fragment restoration under lazy rendering.

## Recommended implementation choices

### Compare two formula strategies first

For a small initial change, investigate bounded formula processing that gives visible content priority, prepares a limited area ahead of the reader, and defers closed disclosures. A whole H2 chapter can still contain hundreds of expressions; chapter-sized work is not automatically short work. Prefer the engine's supported mechanisms where they meet the measured responsiveness requirement, and keep one owner for scheduling and navigation cleanup.

For the longer term, prototype build-time rendering of static formulas through the same MathJax engine. Static article math could then arrive already typeset, while genuinely changing examples retain browser rendering. MathJax supports Node components and provides [official Node examples](https://github.com/mathjax/MathJax-demos-node) for CHTML and other outputs. This is a supported direction, but its benefit in this repository remains unmeasured.

Pre-rendering moves computation into the build; it does not remove the expanded DOM. The prototype must compare compressed HTML and article-chunk sizes, parsing/layout cost, incremental generation time, and repeated navigation. It must retain speech/MathML semantics, TeX copying, theme colors, font assets, SVG diagram labels, and narrow-screen equation behavior. Export the original TeX to Markdown before generating presentation markup, and prevent browser hydration from replacing or re-typesetting the static result.

Choose one initial article strategy from the comparison. Avoid maintaining several independent renderers or adopting a new math engine merely to improve a benchmark.

### Reduce layout work before introducing containment

Cache heading positions and the activation offset outside the scroll hot path. Refresh them when article geometry changes, including formula completion, fonts, resizing, and disclosure toggles. A bounded observation strategy is another candidate. Preserve keyboard focus, fragments, reading progress, and the existing rule that a reader's own scroll takes precedence over late restoration.

If settled-page layout or painting remains costly, group generated content into stable sections and evaluate `content-visibility: auto` with remembered intrinsic sizes. Keep the complete document available for search, selection, links, and exports. The [web.dev containment guidance](https://web.dev/articles/content-visibility) explains both skipped rendering and how geometry reads can defeat it. MathJax's own measurements must be considered too; a CSS declaration alone does not defer TeX processing.

Sections need useful granularity. SSL has only three source H2 headings despite its length, so one wrapper per H2 would leave very large rendering regions. Any grouping must respect headings, disclosures, figures, and bibliography structure without requiring authors to maintain a second outline.

### Preserve continuous reading

Do not use a character limit as the trigger for pagination. Splitting an MDX source into files can help editing but leaves runtime cost unchanged if the same article is rendered in full. Separate public articles when their learning objectives justify it. If rendering containment suffices, it preserves existing URLs and the continuous explanation with less editorial and routing work.

Removing offscreen prose from the DOM would require rebuilding browser find, selection, fragments, accessibility, and print behavior. It is a much larger tradeoff than deferring formula work or skipping offscreen layout, and is not supported by the present measurements.

## Ordered follow-up tasks

Only L0 is complete. L1–L5 are proposed implementation work, in dependency order.

- [x] L0 — Diagnose fixed production snapshots with real MathJax; compare startup, settled scrolling, a no-op control, lazy output, and CPU slowdown. Record results and limits here.
- [ ] L1 — Add a reusable real-engine long-article benchmark for RL and Diffusion. Record task/frame diagnostics and rendered-element counts separately from payload budgets. Include an early TOC interaction, a deep-link visit, disclosure expansion, and repeated navigation. Establish repeatability before choosing timing gates; the [Long Animation Frames API](https://developer.chrome.com/docs/web-platform/long-animation-frames) provides Chromium attribution, while browser behavior checks must also cover WebKit.
- [ ] L2 — Compare bounded runtime typesetting with a build-time MathJax prototype on the same snapshots. Select the smaller maintainable change that improves startup without relocating unacceptable stalls to scrolling. Preserve formula accessibility and Markdown meaning.
- [ ] L3 — Remove repeated full-heading geometry scans from ordinary scroll updates. Verify invalidation for fonts, formulas, resizing, and disclosures, plus anchor/history/focus behavior.
- [ ] L4 — If layout/paint measurements still justify it, add section-level rendering containment. Verify realistic scroll-height estimates, browser find, selection/copy, deep links, printing, and overflow on Chromium and WebKit.
- [ ] L5 — Exercise current articles and an isolated growth fixture with increasing formula/diagram density. Update the owning architecture, authoring, and testing guides; run normal checks, unit tests, and relevant production-browser regressions before shipping the chosen implementation.

Runtime changes belong in the existing content lifecycle and generator boundaries. Authors should continue writing normal MDX, formulas, and semantic disclosures; optimization should not require manual per-paragraph loading controls.

## Local evidence and reproduction

Raw reports, the exploratory harness, and build/profile logs are retained in the ignored `tmp/long-article-performance-2026-09-13/` directory of the working checkout. `f0f5b53/` contains the exploratory and CPU-slowdown controls; `1f7b856/` contains the final repeated comparison. These local files are not published handbook assets or a new CI gate.

To reproduce, create an isolated checkout of the named commit, install its declared dependencies, build it, and serve the production output. Copy the retained `profile.mts` into that checkout's `tmp/longread-research/`, start preview on port 4493, and run it from the checkout root:

```bash
node tmp/longread-research/profile.mts \
  rl:real:1:r1 rl:lazy:1:r1 \
  rl:real:1:r2 rl:lazy:1:r2 \
  rl:real:1:r3 rl:lazy:1:r3 \
  diffusion:real:1:current
```

The harness imports the existing `e2e/mathjax-assets.ts` helper and expects the pinned browser to be installed. Follow [browser troubleshooting](../../../docs/browser-troubleshooting.md) for host-specific libraries. It is an exploratory local script, outside the checked tooling surface; L1 replaces it with maintained measurement tooling.
