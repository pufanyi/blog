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
| Home | 466,159 B | 85,163 B | 70,617 B |
| Blog archive | 590,430 B | 95,147 B | 71,166 B |
| CF551C article | 693,027 B | 162,790 B | 103,450 B |
| First search, additional resources | 1,748,669 B | — | — |

Measurement: 2026-09-12, 97 articles including the consolidated reinforcement
learning notes, Angular build/CLI/SSR 22.1.8. These results include the concurrent
search refactor and content updates. Against the original audit, CF551C inline
styles decreased 37.2%, HTML 28.1%, and program resources 5.3%. Home and search
program resources grew 5.6% and 3.7%; this is a combined revision comparison,
not an isolated attribution to any one change.

Article/search rows were remeasured on 2026-09-20 (99 articles). Static formula
HTML replaces browser typesetting and initial body-module duplication: CF551C
HTML grows by 25,095 B while decoded program resources fall by 25,895 B. Inline
formula CSS is included in HTML, not additional transfer. The search baseline
reflects intervening authored corpus growth; formula expansion is deliberately
excluded from search. Home/archive budgets retain their previous limits.

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
