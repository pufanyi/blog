# MathJax worker startup in WebKit

The former real rendering regression used MathJax 4.1.3, its matching New Computer
Modern font package, and its speech worker/rules. During the 2026-09-12 audit,
Playwright's WebKit 26.5 rendered visible formulas but did not finish
`MathJax.whenReady()`. The speech worker never loaded its entry script.

A separate browser probe reproduced the cause: a Blob worker that immediately
posted `ready` succeeded when its URL remained valid and emitted an error when
the URL was revoked immediately after construction. MathJax 4.1.3's
[HTML adaptor](https://github.com/mathjax/MathJax-src/blob/4.1.3/ts/adaptors/HTMLAdaptor.ts)
uses the latter sequence.

`src/app/shared/math/mathjax-worker.ts` replaces only the initialized MathJax
adaptor's `createWorker` method. It retains the URL until the first worker
message, an error, or termination. Constructor failure also releases it.
It preserves the configured worker path, rules path, and message listener;
global `Worker` and `URL` behavior is unchanged. Speech and Braille remain enabled.

Article formulas now arrive as build-rendered CHTML and assistive MathML. The
article copy handler uses retained TeX, and right-click keeps the native browser
behavior; neither path loads the browser engine or starts the worker. The runtime
`tex-chtml.js` engine remains on demand for Angular-authored views containing raw
TeX, such as post summaries and the not-found page. Its custom context menu is
disabled, while generated speech and Braille remain enabled. Check worker behavior on one of these dynamic rendering paths, not the static
article DOM.

Unit tests verify URL lifetime and failure cleanup. Browser E2E tests have been
removed. When changing MathJax, manually verify dynamic rendering, disabled
custom menus, static formulas, font loading, and SVG-label placement in both
themes and at desktop/phone widths, using the real engine and fonts.

When upgrading MathJax, update both exact build-time packages and the runtime CDN
URL. Remove the adaptor workaround only after checking that the unmodified
upstream worker starts correctly in a current WebKit browser.
