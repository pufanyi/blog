# Long article rendering review — 2026-09-20

## Scope and outcome

This is a diagnostic review of commit `11ccbf8d8672739f15bec6a320cd7b57c6172d07`,
not an implementation of the proposed rendering changes. This task did not change
application code or authored content. The production build passed with the declared
Node 24.18.1 and pnpm 12.3.4, prerendering 163 routes.

Unrelated ViT diagram/style edits appeared after the measured build and were
left untouched. These measurements and build validation cover the recorded
snapshot, not those later edits.

Retain static page generation and continuous article HTML. Prioritize formula
processing, then avoid unnecessary body transfer/reconstruction and repeated
scroll-time geometry reads. Build-time MathJax is the preferred architectural
candidate for static formulas, but requires a measured prototype before choosing
it over bounded browser typesetting. Enabling lazy MathJax alone improves startup
but does not establish acceptable reading responsiveness.

This review updates the evidence behind the
[September 13 runtime investigation](2026-09-13-long-article-performance.md).
It supports the existing [reading design](../maintenance/long-article-reading.md);
its proposed R1–R6 and L1–L5 implementation tasks remain incomplete.

## What the site currently renders

- `angular.json` sets `outputMode: 'static'`. `app.routes.server.ts` prerenders
  every known article. Requests receive HTML generated during the build, not
  HTML rendered by Angular on each request.
- The browser hydrates the application and handles subsequent route navigation.
  `app.config.ts` explicitly disables incremental hydration. Article bodies are
  HTML strings bound through `PostContentDirective`'s `innerHTML`; they are not
  individual Angular chapter views that automatically respond to `@defer`.
- Article modules are lazy-loaded per slug. Summaries exclude article bodies;
  search and its full-text data have separate deferred loading. More articles
  therefore do not put every body into the initial application bundle.
- An individual article is inserted in full. There is no section-level
  `content-visibility` or removal of offscreen prose.
- MathJax loads only when TeX is present, but `typesetMath` passes the entire
  article to `typesetPromise`. Closed disclosures are included.
- Generated images and PDF frames already use lazy loading. Giscus appends its
  client script after the first render, regardless of the comment area's
  distance from the viewport. Post enhancement imports begin on attachment;
  individual enhancements can additionally manage visibility themselves.

The current CLI reports 403.06 kB of raw initial resources and an estimated
104.19 kB transfer. Those figures omit article chunks, MathJax, and other
subsequent resources and must not be treated as total article visit cost.

## Measurement method

The existing exploratory harness was adapted in ignored
`tmp/longread-research-2026-09-20/profile.mts`, using the freshly built production
preview on port 4593. It uses matching Playwright Chromium 151.0.7922.34 with a
390 × 844 CSS-pixel viewport and fresh browser contexts. MathJax 4.1.3, its pinned
font package, and speech worker/maps are served locally from installed packages.
Unrelated external integrations are stubbed. The host's existing temporary
Chromium libraries and CJK font configuration were reused without dependency or
machine configuration changes.

RL baseline and `ui/lazy` cases were alternated three times without CPU
throttling. Diffusion and SSL baselines, Diffusion lazy, an RL no-op control,
and the RL 4× CPU stress cases were each measured once. The lazy variant is
injected by the browser harness with `lazyMargin: '400px'`; it is not a shipped
application change.

Startup records tasks longer than 50 ms until the MathJax queue, fonts, and a
500 ms observation interval settle. Queue duration includes asynchronous work;
it is not continuous UI blocking. Scrolling makes 90 position updates, one per
animation frame, based on the height at the start of the pass. Deferred layout
changes that height, so variants may expose different content. These passes
diagnose deferred stalls and are not controlled FPS or normal-reading tests.

These are local host diagnostics, not deployed-site, real-phone, field INP,
LCP, or Lighthouse TBT measurements. Fourfold CPU throttling is a stress setting,
not a calibrated phone model. No current WebKit performance run was performed.

## Current measurements

Element counts exclude text nodes and the page shell. Formula counts include
inline equations and diagram labels.

| Article | Elements before math | Elements after math | Formulas | Formulas in closed disclosures | Longest initial task |
| --- | ---: | ---: | ---: | ---: | ---: |
| RL | 1,019 | 19,937 | 341 | 27 | 952 ms median; 919–983 ms |
| Diffusion | 4,038 | 25,090 | 638 | 76 | 1,149 ms; one run |
| SSL | 2,847 | 10,527 | 263 | 159 | 475 ms; one run |

All three RL baseline scroll passes and the single Diffusion/SSL baseline scroll
passes recorded no tasks longer than 50 ms on the unthrottled host. This does not
establish smoothness on slower devices. The RL no-op MathJax control reduced the
longest startup task to 102 ms in one run, supporting formula processing as the
first target; omitting formula rendering is not a product solution.

| RL experiment | Initial article elements | Longest initial task | Long tasks during rapid scroll | Longest scroll task |
| --- | ---: | ---: | ---: | ---: |
| Existing, three runs | 19,937 | 952 ms median | 0 in each run | None over 50 ms |
| Lazy, three runs | 2,474–2,476 | 138 ms median; 134–176 ms | 5–9 | 113–156 ms |
| Existing, 4× CPU, one run | 19,937 | 4,010 ms | 40 | 203 ms |
| Lazy, 4× CPU, one run | 2,458 | 641 ms | 16 | 788 ms |

Diffusion's single lazy run reduced the initial article to 5,504 elements and
the longest startup task to 247 ms, while recording seven scroll long tasks
with a maximum of 120 ms. Lazy `mjx-container` placeholders are included in
formula counts: those counts do not prove all equations have visible output.
No explicit MathJax error nodes or captured asset/page errors were recorded.
Accessibility, printing, fragment restoration, and formula-reference correctness
were not validated for the experimental variants.

The heading tracker read 3,168 heading rectangles during each RL scroll pass,
2,640 in Diffusion, and 3,872 in SSL. These reads are not necessarily fresh forced
layouts, but the full scan runs on each scheduled scroll frame and conflicts
with the goal of skipping offscreen subtree layout.

## Additional finding: duplicate body delivery and reconstruction

A separate cold Diffusion probe stubbed external integrations and intercepted
the `.post-body` `innerHTML` setter without changing its result. It observed:

- The HTML document response was 630,266 decoded bytes and already contained
  the full article.
- The browser also fetched `chunk-NH5FCoAK.js`, 567,198 decoded bytes, containing
  the article's `contentHtml` and TOC.
- Hydration assigned `.post-body.innerHTML` once, replacing the existing first
  element and reconstructing its 4,038 element descendants. The setter took
  10.3 ms in this single diagnostic run.

Offline Brotli compression of those two artifacts yielded 71,842 and 62,056
bytes respectively. Those are artifact compression results, not observed CDN
transfer sizes. The duplication is real, but should not be confused with a
1.2 MB compressed transfer or a second one-second bottleneck.

This matters when considering build-time formulas: expanded formula output
could be delivered and parsed twice unless the initial document's existing
article is reused. A design should keep server generation, initial document
adoption, and subsequent client-route loading explicit. Avoid adding another
full HTML copy to serialized transfer state. Retain client-navigation support
and derive the TOC from existing generated metadata.

## Recommended implementation sequence

1. Make the real-engine benchmark maintainable, with separate startup and
   active-reading phases, then compare two formula prototypes on the same
   revision. The preferred architectural candidate is build-time CHTML from
   the existing MathJax engine for static formulas, with browser rendering
   limited to genuinely changing content. The alternative is visible-first,
   bounded browser processing with controlled look-ahead and deferred closed
   disclosures. A single H2 can still contain too much work for one batch.
2. Include initial article adoption in the build-time prototype so it measures
   a viable delivery path. Compare compressed document/article payloads,
   parsing/layout, incremental generation time, and repeated navigation.
   Preserve original TeX for Markdown, copy behavior, accessible math,
   theme/fonts, SVG labels, equation references, and narrow-screen overflow.
   Static output does not remove formula DOM or make every accessibility
   interaction work automatically. Select one maintainable static-article
   strategy after this comparison.
3. Cache heading positions outside ordinary scroll updates, or use a bounded
   observation strategy. Recompute when geometry changes: formula completion,
   images/fonts, resizing, and disclosure expansion. Keep fragments, focus,
   progress, history, and user-scroll cancellation under their current owners.
4. If remaining layout/paint cost justifies it, generate stable content groups
   and test `content-visibility: auto` with remembered intrinsic heights. Use
   useful content granularity, not an arbitrary character limit or one giant
   wrapper per article. Geometry reads and MathJax measurements can defeat
   containment. Check browser Find, selection, links, overflow and complete
   printing in Chromium and WebKit.
5. Defer comments and costly optional interaction setup until near the viewport
   or explicit interaction, while preserving their static meaning. Angular
   incremental hydration is suitable for actual component boundaries; changing
   its global option alone cannot schedule the generated HTML's formulas.

Keep continuous prose in the document. Removing offscreen sections would add
browser Find, selection, fragment, accessibility, history, and print work that
the present evidence does not justify. Public article splitting should follow
independent learning objectives. Splitting source files alone does not reduce
runtime cost. No framework migration or per-request server rendering is needed
to address the measured bottleneck.

The existing resource budgets stub MathJax and cannot validate these runtime
improvements. Acceptance should include early TOC use, a deep link, disclosure
expansion, ordinary and rapid scrolling, reload/back navigation, printing, and
an isolated larger article fixture. Do not establish hard millisecond gates
from these few local samples.

## Sources and retained evidence

- [Angular rendering modes](https://angular.dev/guide/ssr): distinguishes static
  prerendering, request-time SSR, and client rendering.
- [Angular incremental hydration](https://angular.dev/guide/incremental-hydration):
  component/defer boundaries and viewport/interaction triggers.
- [MathJax lazy typesetting](https://docs.mathjax.org/en/latest/output/lazy.html):
  deferred output, look-ahead margins, and limitations for equation references.
- [MathJax Node examples](https://docs.mathjax.org/en/latest/server/examples.html):
  supported build-time CHTML and other rendering approaches.
- [Browser rendering containment](https://web.dev/articles/content-visibility):
  skipped layout/paint, preserved document content, intrinsic sizes, and geometry
  APIs that can force skipped work.

The ignored `tmp/longread-research-2026-09-20/` directory retains the adapted
harness, per-case JSON, `summary.json`, `followup-summary.json`, and the
`hydration-probe.mts`/`hydration-probe.json` diagnostic. The current production
build was validated; source/unit suites were not rerun because this task changed
no application code, authored content, or public documentation contract.
