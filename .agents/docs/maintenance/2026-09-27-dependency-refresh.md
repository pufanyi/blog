# Dependency refresh — 2026-09-27

The starting commit was `ef0f736`. Its working tree was clean. This refresh
updates the pinned runtime and package manager to Node 24.21.0 and pnpm 12.6.0,
aligns Angular packages on 22.2.0, and refreshes the compatible direct and
transitive dependencies in the lockfile. It also moves `@types/node` to the Node
24 line. TypeScript remains on 6.0.3 because Angular 22 requires `<6.1`;
MathJax and its matching NewCM font remain exactly 4.1.3 because those were
already current and are shared by build output and real-browser tests.

The refresh removed three historical overrides, the `listr2` peer exception,
and release-age exclusions after strict peer resolution succeeded. The
`allowBuilds` list now names the resolved workerd 1.20260925.1 and retains only
the other installed build-tool versions. A frozen install passed. `pnpm audit`
reported 10 high and 8 moderate entries before the refresh, and zero after it.

## Isolated comparison

An isolated worktree of unchanged `ef0f736`, with its own frozen dependencies
and generated output under Node 24.18.1/pnpm 12.3.4, was built and tested on
the same host. Its targeted Chromium tests failed on the same metadata, search,
and four resource assertions as the refreshed checkout. Later articles added
coauthors and a post named “Attention”; the old tests assumed a single author
and treated a substring match in the archive as a link to the older post. The
updated tests check every authored contributor and the exact article link.

| Decoded resource | Unchanged commit | Refreshed checkout |
| --- | ---: | ---: |
| Home code | 422,741 B | 426,564 B |
| Archive code | 692,172 B | 695,835 B |
| CF551C code | 799,490 B | 803,370 B |
| First search | 2,194,246 B | 2,194,165 B |

The prior code/search budgets dated from a smaller corpus. The refreshed
measurements became the new baselines with the existing 10% headroom. This
keeps the budgets active while recording the current 105-article build. The
first search's decoded resource size was effectively unchanged by the package
refresh.

## Validation and host limits

Strict peer checking, `pnpm check`, 92 content tests, 227 Angular tests, cold
and warm production builds, and a live development-watcher edit/restore passed.
The production build prerendered 176 routes and prepared 156 Markdown
alternatives. The first full browser run completed all test cases but its pnpm
wrapped preview server prevented normal shutdown. Starting the preview and
Wrangler Node entrypoints directly fixed teardown; a separate browser run
verified process exit. The focused metadata, search, and performance browser
run passed all 17 desktop/mobile tests. A later full desktop/mobile run had one
five-second article-readiness timeout under fourfold CPU throttling while
another worker ran; the same test passed alone. Extending that readiness wait
to 30 seconds gave 139 passed and 8 skipped in the final desktop/mobile run.
All 8 Cloudflare routing tests passed with the direct server entrypoints.

Playwright 1.63.0 downloaded WebKit 26.6 on this Arch/WSL host. Its WPE
launcher reset the inherited library path, so local validation used temporary
Ubuntu runtime libraries and a temporary launcher adjustment outside the
repository. The downloaded browser launchers were restored afterward. With
those host adjustments, 15 of 20 WebKit tests passed, including the real
MathJax rendering tests. Five failed on link/formula visibility or a history
scroll position. The unchanged commit with Playwright 1.62.1/WebKit 26.5
reproduced all five assertions on this same host, including the expected
scroll position of 2400 versus zero. These failures are not new evidence of an
upgrade regression; this host does not provide a clean WebKit gate.

The dependency and exception policy is in
[`docs/dependencies.md`](../../../docs/dependencies.md), resource budgets in
[`docs/maintenance/performance.md`](../../../docs/maintenance/performance.md),
and local browser guidance in
[`docs/browser-troubleshooting.md`](../../../docs/browser-troubleshooting.md).
