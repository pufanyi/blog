# Testing and quality checks

Choose validation around the behavior a change can break. This repository combines strict source checks, content-generation tests, Angular unit tests, and production browser regressions; each catches a different class of failure.

## Required commands

```bash
pnpm check
pnpm test --watch=false
pnpm test:e2e
```

Run these sequentially. Their lifecycle hooks write shared generated files, and `test:e2e` builds production output before launching Playwright. Before every push, run both check and noninteractive unit tests after the final change. If anything changes afterward, run them again.

`pnpm check` includes Biome formatting, Angular application and strict-template compilation, strict tooling and E2E typechecks, ESLint, and article MDX/BibTeX checks. Documentation structure, internal links, and anchors are validated by its generation hook. It does not execute tests or build production pages.

`pnpm test --watch=false` runs Node content/tooling tests followed by Angular unit tests. If the host's CPU count causes Vitest worker failures, use `VITEST_MAX_WORKERS=2 pnpm test --watch=false`.

## Match tests to changes

| Change | Useful evidence |
| --- | --- |
| Prose or handbook wording | Generation and link checks; inspect the relevant rendered page |
| Parser, compiler, cache, or publication | Small input fixtures, invalid inputs, no-op behavior, failure recovery, removed outputs |
| Angular state or lifecycle | User-visible state changes, dependency overrides, teardown and late asynchronous completion |
| Routes or metadata | Prerendered HTML, direct visits, client navigation, canonical and noindex behavior |
| Search | Chinese/English queries, ranking, real keyboard events, focus containment/restoration, cold and warm loading |
| Formula, diagram, or reading layout | Real MathJax plus Chromium/WebKit at narrow and desktop widths, both themes |
| Hosting or Markdown | Actual Cloudflare Worker requests, negotiation, MIME, redirects, direct exports, missing routes |
| Performance | Served production resources including lazy chunks and worker requests |

Do not add a test that merely repeats a constant from the implementation or checks incidental markup. Regression tests should fail for the underlying bug: for example, removing cleanup, loading the full search index eagerly, or serving an HTML 404 with a Markdown MIME type.

## Unit-test conventions

Tooling tests live beside helpers as `scripts/lib/*.spec.mts` and run through `tsx`. Use temporary directories for file-generation tests and dispose them. Verify that failed generation preserves the prior successful published outputs and that removed sources prune derived files.

Angular tests live beside application code. Override injectable services with `TestBed`; the Angular unit-test builder does not support `vi.mock` for relative imports. Use controlled promises and observable effects for lifecycle tests instead of arbitrary delays. Verify listeners, views, observers, timers, and late imports are released on navigation.

## Browser setup and focused runs

Install the matching browser versions after dependency upgrades:

```bash
pnpm exec playwright install --with-deps chromium webkit
pnpm build
pnpm exec playwright test e2e/docs.spec.ts --project=desktop --project=mobile
```

Calling Playwright directly reuses existing production output, so build after changing source. `BLOG_PREVIEW_PORT` and `BLOG_CLOUDFLARE_PORT` select isolated server ports when defaults are occupied. Playwright owns its servers and does not reuse an existing development server. See [host troubleshooting](browser-troubleshooting.md) for Linux library, font, and workerd issues.

Shared browser fixtures stub third-party analytics/comments and provide a deterministic MathJax delay for reading/scroll tests. Separate real-engine tests serve the pinned MathJax, font, and speech-worker assets. Do not use the delayed stub as evidence that formulas actually typeset.

Wait for `.post-body[data-rendered="true"]` before testing attached article controls. This marker does not await lazy article-specific enhancements or MathJax; those have their own readiness conditions. Scroll offscreen controls into view before focusing them to avoid smooth-scroll races with the next navigation.

## CI and performance evidence

The quality workflow runs source checks/unit tests and browser tests in parallel in separate jobs. The quality job generates once and uses `*:generated` commands afterward; the final required `check` status depends on both jobs. Keep generated and normal commands aligned when adding checks.

Resource budgets cover representative production pages and cold search with worker traffic included. Warm queries must add no resources. Use the per-request reports to explain changes rather than increasing a threshold without investigation. CI retains reports and visual diagnostics, including successful rendering captures; screenshots are diagnostic artifacts rather than pixel baselines. See [performance records](maintenance/performance.md).
