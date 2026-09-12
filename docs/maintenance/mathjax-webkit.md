# MathJax worker startup in WebKit

The real rendering regression uses MathJax 4.1.3, its matching New Computer
Modern font package, and its speech worker/rules. During the 2026-09-12 audit,
Playwright's WebKit 26.5 rendered visible formulas but did not finish
`MathJax.whenReady()`. The speech worker never loaded its entry script.

A separate browser probe reproduced the cause: a Blob worker that immediately
posted `ready` succeeded when its URL remained valid and emitted an error when
the URL was revoked immediately after construction. MathJax 4.1.3's
[HTML adaptor](https://github.com/mathjax/MathJax-src/blob/4.1.3/ts/adaptors/HTMLAdaptor.ts)
uses the latter sequence.

`src/app/utils/mathjax-worker.ts` replaces only the initialized MathJax
adaptor's `createWorker` method. It retains the URL until the first worker
message, an error, or termination. Constructor failure also releases it.
It preserves the configured worker path, rules path, and message listener;
global `Worker` and `URL` behavior is unchanged. Speech and Braille remain enabled.

Unit tests verify URL lifetime and failure cleanup. Production browser tests
wait for the existing [MathJax queue](https://docs.mathjax.org/en/latest/web/typeset.html),
check formula errors/font loading, and verify SVG-label placement in light/dark
themes at desktop/narrow widths. They use the real pinned engine/font bytes.
A temporary HTTP server supplies the same worker/rules because WebKit worker
requests do not consistently pass through Playwright routing. Only asset
locations are configured by the test; rendering and accessibility are real.

When upgrading MathJax, update both exact test packages and the runtime CDN URL.
Remove the adaptor workaround only after the unmodified upstream worker passes
the real WebKit rendering tests. Screenshots are inspection artifacts, not
pixel baselines or a claim of coverage on every Safari device.
