# Production resource budgets

The E2E performance suite was removed in November 2026. The measurements below
are historical reference data; no automated browser resource gate is active.
The former gate allowed 10% growth in decoded first-party JavaScript, CSS, fetch,
and XHR bodies, including workers. HTML and inline styles were measured separately.
Images, fonts, PDFs, and third-party integrations were outside that code budget.
These numbers are not compressed transfer measurements or LCP/INP targets.

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

For targeted investigations, use browser developer tools on a served production
build. Compare initial reading, cold search, and warm search separately, including
lazy chunks and worker requests. Record the revision, corpus size, browser, and
measurement conditions; distinguish encoded transfer sizes from decoded bodies.

## Long article runtime

Payload size alone does not measure layout, paint, or scrolling cost. Measure
startup and settled scrolling separately when investigating long articles.
Use representative phone and desktop widths and inspect real formulas.

Generated articles now ship complete CHTML formulas and local fonts. Reading,
including opening disclosures, selecting, copying, or right-clicking formulas does
not load the browser MathJax engine. Angular-authored views with raw TeX still use
the on-demand runtime engine, with its custom context menu disabled.
Initial navigation adopts prerendered HTML, whereas subsequent SPA navigation
loads a single article module. Assess both paths: larger HTML is a deliberate
tradeoff for removing client typesetting, not a claim that raw markup shrank.
