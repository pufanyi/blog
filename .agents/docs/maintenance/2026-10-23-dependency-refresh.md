# Dependency refresh — 2026-10-23

The starting commit was `8bdb14b`, with a clean working tree. This change updates
29 direct dependencies and their resolved transitive dependencies, Node from
24.21.0 to the patched 24 LTS release 24.22.1, and pnpm from 12.6.0 to 12.15.0.
Registry metadata was checked on 2026-10-23. All direct dependencies are at their
latest stable releases except the deliberate Node 24 type definitions and
Angular-compatible TypeScript 6.0.3. MathJax/NewCM 4.1.3 and Phosphor 2.1.2 remain
current, so their runtime URLs, browser fixtures, and icon subset do not change.

Notable updates include Angular framework/compiler 22.2.3, CDK/build/CLI/SSR
22.2.4, PDF viewer 31.0.1, Playwright 1.64.1, Wrangler 4.152.0, React 19.3.1,
Shiki 4.5.0, Biome 2.6.2, and Vitest 5.0.5. GitHub Actions already use the current
major tags (`checkout@v7`, `setup-node@v7`, and `pnpm/action-setup@v6`); CI reads
`.nvmrc` and the package-manager pin. The PDF viewer's release notes were checked
against our disabled editor controls, fixed source routing, and theme styles.

## Security and dependency exceptions

Node 24.22.1's own `fetch` rejected both certificate test endpoints linked from
the [Render advisory](https://render.com/docs/advisory-emudhra) with
`CERT_REVOKED`. This validates the local Node client, not Cloudflare's production
build configuration or a reader's browser. Production must rebuild with the new
runtime and must not override it with an older platform environment setting.

Angular build pins Vite 8.3.0; the exact-version override selects 8.3.5 to fix the
published 8.3.0–8.3.2 advisories. The targeted micromark math override selects
KaTeX 0.18.2 because its upstream range remains `^0.16.0`. Both exceptions and
removal criteria are documented in the dependency guide. The remaining braces
advisory has no upstream patch and stays visible in the audit. It comes only
from the development Markdown CLI, whose input glob is fixed by this repository.
Production dependency audit reports zero findings.

The exact workerd build permission follows 1.20261019.1; the unused esbuild
0.28.1 permission is removed. pnpm records exact release-age exceptions for the
reviewed Angular toolchain and Wrangler/Miniflare versions. No broad trust,
release-age, or build-script bypass was added.

## Validation and comparison

Strict peer validation and a frozen install passed. Source checks, 106 content
tests, and 241 Angular tests passed. Production generation includes 112 posts,
165 sitemap URLs, and 164 Markdown alternatives. The development watcher was
verified in Chromium by loading the dependency guide, appending a temporary
paragraph, observing it appear after regeneration, restoring the original
source, and observing its removal. The probe was fully restored.

The production browser run completed 116 tests successfully with 3 intentional
skips before being interrupted at WebKit startup. One desktop performance test
failed on the existing search payload budget. PDF rendering, independent embeds,
themes, missing-file behavior, CMYK profiles, real Chromium MathJax rendering,
reading/navigation/search, and static content behavior passed. A separate
Cloudflare run passed all 8 tests.

An unchanged isolated worktree of `8bdb14b`, with its own frozen dependencies,
Node 24.21.0 and pnpm 12.6.0, reproduced the same performance failure:

| Homepage resource | Before | After |
| --- | ---: | ---: |
| Initial decoded code/styles | 429,555 B | 428,049 B |
| HTML | 88,880 B | 88,880 B |
| Inline styles | 74,344 B | 74,344 B |
| First-search payload | 2,479,693 B | 2,479,693 B |

The search limit is 2,413,582 B. This refresh does not relax that budget or claim
a passing full browser suite. The other two baseline route budgets passed.

On this macOS 27.0.1 host, both Playwright 1.64.1/WebKit 27.2 (build 2370) and the
unchanged baseline Playwright 1.63.0/WebKit build 2359 failed a minimal browser
launch before page creation, with a `ClientCallsAuxiliary` XPC connection error
and a 15-second launch timeout. WebKit application behavior remains unverified;
no browser binaries or OS settings were modified to bypass this failure.

Raw logs, audit JSON and the dependency metadata inventory are under ignored
`tmp/dependency-refresh/`. Browser artifacts remain in `test-results/` and the
Cloudflare run's separate output directory. No production deployment was made.
