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
| CF551C article | 718,922 B | 137,695 B | 90,106 B |
| First search, additional resources | 1,482,726 B | — | — |

Measurement: 2026-09-12, 97 articles including the consolidated reinforcement
learning notes, Angular build/CLI/SSR 22.1.8. These results include the concurrent
search refactor and content updates. Against the original audit, CF551C inline
styles decreased 37.2%, HTML 28.1%, and program resources 5.3%. Home and search
program resources grew 5.6% and 3.7%; this is a combined revision comparison,
not an isolated attribution to any one change.

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
