# Long article implementation — 2026-09-20

Base: `11ccbf8d8672739f15bec6a320cd7b57c6172d07`, 99 articles. Work was isolated
in `/tmp/blog-longread.9orj6o` with independent dependencies. Concurrent ViT edits
and new robotics content in the main worktree are outside this validation snapshot.

## Decisions

- Keep static prerendering and continuous article DOM. Generate MathJax CHTML,
  adaptive CSS, assistive MathML and retained TeX at build time; publish local
  fonts. Serialize the engine and isolate each article's TeX parser/macros.
- Adopt the initial prerendered body using transferred TOC/slug, without loading
  the body module or replacing `innerHTML`. Keep normal per-article imports for
  SPA navigation. Do not cache an adopted empty body in the repository.
- Explicit formula-menu activation uses `tex-mml-chtml.js` and the selected
  formula's resolved MathML, preserving the worker compatibility fix. The
  TeX-only bundle does not register the MathML constructor despite preloading its
  internal component. Native copying retains TeX; printing opens/restores details.
- Cache heading coordinates and binary-search during scrolling. Invalidate on
  actual geometry changes, media/font loads and disclosures. Dispose before DOM
  replacement, including pending enhancements, math registrations and views.
- Defer comments and marked heavy examples until within 600px of the viewport;
  focus/pointer interaction also starts an example. Preserve static fallbacks.
- Keep search text derived from pre-typeset content. Its generated module was
  byte-identical to the baseline (`915ea5a1a80843329a4613bf756e0c79eb908ff828f011b4570c47d32946aa5d`).

## Runtime evidence

Production Chromium 151, 390×844, fixed fonts/external stubs except real MathJax
in the original baseline. Static output uses the same pinned engine at build
time. Local diagnostics use 90 frame-stepped scroll jumps; not real-user FPS,
LCP or INP. Raw probes remain in ignored `tmp/longread-implementation`.

| Article | Previous startup longest task | Static startup longest task | Static scroll heading reads |
| --- | ---: | ---: | ---: |
| RL | 952 ms median of 3 | 172 ms median of 3 | 0 |
| Diffusion | 1,149 ms single sample | 100 ms single sample | 0 |
| SSL | 475 ms single sample | 95 ms single sample | 0 |

Ordinary unthrottled scroll samples had no tasks above 50ms. A separate 4x CPU
sample still showed 30 long tasks (max 167ms) for RL and 10 (max 96ms) for
Diffusion: static DOM layout/paint has not disappeared. Do not claim universal
smoothness. `e2e/long-article.spec.ts` preserves reproducible per-phase diagnostics
and doubles the DOM as a growth stress case, without noisy timing assertions.

Static raw HTML grows: RL ~1.38 MB and Diffusion ~1.90 MB, including assistive
MathML. Initial hydration no longer downloads the corresponding ~1.30/~1.87 MB
decoded body module. CF551C's code+HTML total stays roughly flat (855,817 B vs
856,617 B); its formula CSS now lives in HTML. Resource budgets retain separate
HTML/style/code accounting. Search growth predates this implementation.

Offline Brotli of the retained Diffusion artifacts is 71,778 B old HTML plus
62,056 B duplicated body JS, versus 109,747 B new HTML with no initial body JS.
This excludes shared application assets, fonts and the old browser math engine;
it is not observed CDN transfer accounting. Static RL/SSL HTML alone compresses
to 62,899/77,383 B. Raw expansion and improved compression must be reported
separately.

## Containment experiment: not enabled

A runtime prototype wrapped blocks into groups of about 900 elements, measured
actual heights and applied `content-visibility:auto`. At 4x CPU RL scrolling
fell from 30 long tasks to 0, Diffusion from 10 to 1, but flow-root grouping
changed article height by 591px/518px. A no-wrapper block prototype reduced RL
to 10 long tasks and Diffusion to 0, but RL gained 4px and scrolling caused
108/60 heading geometry reads as intrinsic sizes changed. These are not safe
drop-in reading-layout changes. Neither prototype is published. Future work
needs stable semantic grouping, resize/disclosure handling, print/find/deep-link
coverage and a full reading-journey review, not guessed placeholder heights.

The decision is consistent with [MDN's containment model](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/content-visibility):
auto keeps content searchable/accessibly exposed, but skipped layout still needs
correct intrinsic sizing. MathJax configuration follows its
[startup input contract](https://docs.mathjax.org/en/latest/options/startup/startup.html).

## Validation scope

Run source checks, content/application tests, production prerender and the
production browser suite sequentially after final implementation changes.
Browser regressions cover static/no-JS math, real menu/worker rendering, both
themes, disclosures, overflow, first-load payloads, SPA history, reload/fragment
positions, deferred examples/comments, growth and cleanup. Multi-navigation
WebKit tests have a 90s scenario budget for repeated large DOM parsing under
tracing; timing is not asserted as a performance SLA.

No deployment or push is part of this task. The historical reading-design and
runtime audits remain unchanged; these runtime changes do not substitute for
future reading-interface work.
