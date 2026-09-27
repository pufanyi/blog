# Production resource budgets

`e2e/performance.spec.ts` loads cold production pages and counts first-party
JavaScript, CSS, fetch, and XHR response bodies through browser-context events.
This includes worker requests; it does not rely on window resource timing.
HTML bytes and inline style bytes are measured separately. The tests use the
same Chromium production preview as the navigation regressions.

The gate allows 10% growth over the measured baseline below. It protects cold
visits and first search use as the corpus grows. It is a regression budget,
not a device-independent LCP/INP target or a compressed transfer measurement.
Images, fonts, PDF content, and third-party integrations are outside this code
budget. Tests stub external requests; `rendering.spec.ts` complements those
stubs with the actual pinned MathJax engine and fonts.

| Route/action | Decoded program resources | HTML | Inline styles |
| --- | ---: | ---: | ---: |
| Home | 426,564 B | 88,664 B | 74,041 B |
| Blog archive | 695,835 B | 101,555 B | 74,579 B |
| CF551C article | 803,370 B | 173,248 B | 112,240 B |
| First search, additional resources | 2,194,165 B | — | — |

Measurement: 2026-09-27, 105 articles, Node 24.21.0, Angular 22.2.0, and
Playwright 1.63.0 Chromium on the served production build. The old 2026-09-12
and 2026-09-20 limits predated later article and search-corpus growth. On an
isolated checkout of the unchanged commit with Node 24.18.1 and the previous
lockfile, the same three code and search gates failed: home 422,741 B, blog
692,172 B, CF551C 799,490 B, and first search 2,194,246 B. The dependency
refresh measured 426,564 B, 695,835 B, 803,370 B, and 2,194,165 B respectively.
The new baselines retain 10% headroom and track the current corpus and build
output. Static formula CSS remains included in HTML, not an additional transfer.

A local sample recorded 83 ms to focus the search input, 218 ms from opening to
the first Chinese results, and 20 ms for a warm English query. These host timings
are diagnostic observations and are not asserted. The search behavior suite
instead holds the engine download open and verifies that typing, dismissal,
and focus recovery already work. Warm queries must request no additional code.

Each budget test writes `resources.json` with the exact URLs, sizes, and search
phases, and attaches it to the Playwright report. When a budget fails, inspect
those requests before changing the baseline. Explain intentional growth in the
change description; do not raise all budgets because one article grows. Keep
unrelated diagram styles out of this representative article.

The report also includes a separate `delivery` list for all observed first-party
responses, including documents, fonts, images and worker requests. It records
`Content-Encoding`, encoded response-body bytes from Playwright request sizes,
and decoded body bytes, split between initial reading and cold search. These
exclude HTTP headers but may include transfer framing reported by the browser.
The Node preview
normally uses `identity`; its results must not be labeled production compression
savings. Lazy images not requested by that journey and stubbed third-party
resources are outside this observation. Existing decoded-code budgets remain
independent of these delivery diagnostics.

## Long article runtime

Payload budgets do not measure the browser's formula-processing or scrolling
cost. When reviewing math-heavy articles, also use the real pinned MathJax engine
and distinguish startup tasks, settled scrolling, and work deferred until a
section becomes visible. An engine download being lazy does not mean its
per-article typesetting is lazy. Closed disclosures can still incur that work.

Real-engine rendering tests check correctness; they do not currently enforce
long-article runtime budgets. Record runtime measurements with their tested
revision and conditions before using them to justify an optimization.

Generated articles now ship complete CHTML formulas and local fonts. Reading,
including opening disclosures, selecting, copying, or right-clicking formulas does
not load the browser MathJax engine. Angular-authored views with raw TeX still use
the on-demand runtime engine, with its custom context menu disabled.
Initial navigation adopts prerendered HTML, whereas subsequent SPA navigation
loads a single article module. Assess both paths: larger HTML is a deliberate
tradeoff for removing client typesetting, not a claim that raw markup shrank.

After `pnpm build`, run `pnpm exec playwright test e2e/long-article.spec.ts
--project=desktop` for RL, Diffusion and SSL at a 390px viewport and Chromium 4x
CPU slowdown. Each test attaches startup/scroll long tasks and heading geometry
reads, then repeats with a test-only doubled article DOM. The 90 frame-stepped
scroll jumps are a stress diagnostic, not a real-user FPS benchmark. Timings
are reported rather than gated; body duplication and unsolicited engine loads
are gated. Use the static and dynamic formula rendering suites alongside this
diagnostic.
