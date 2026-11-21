# Testing and quality checks

Choose validation around the behavior a change can break. This repository combines strict source checks, content-generation tests, and Angular unit tests; each catches a different class of failure.

## Required commands

```bash
pnpm check
pnpm test --watch=false
```

Run these sequentially. Their lifecycle hooks write shared generated files. Before every push, run both check and noninteractive unit tests after the final change. If anything changes afterward, run them again. Browser behavior is reviewed manually; E2E automation has been removed.

`pnpm check` includes Biome linting and formatting, import-boundary validation, Angular application and strict-template compilation, strict tooling typechecks, ESLint, and article MDX/BibTeX checks. Documentation structure, internal links, and anchors are validated by its generation hook. It does not execute tests or build production pages.

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

## Manual browser review

The author rereads published articles and checks their interactions. Automated
E2E tests, Playwright configuration, and browser installation are no longer part
of this repository. Do not run or recreate browser automation unless explicitly
requested by the user.

For changes needing a local production preview, run `pnpm build` and then
`pnpm preview`. Review the affected reading journey at desktop and phone widths,
including navigation, disclosures, formulas, images, and controls. Use
`pnpm preview:cloudflare` for actual Worker/static-asset routing.
See [host troubleshooting](browser-troubleshooting.md) for local preview issues.

## CI and performance evidence

The quality workflow runs lightweight Biome lint and formatting checks
(`biome ci .`) via `biomejs/setup-biome` without generating content or running
tests; the final required `check` status depends on the quality job. Run
`pnpm check` and `pnpm test --watch=false` locally before pushing.

The [performance records](maintenance/performance.md) retain historical browser
measurements. They are reference data, not active automated resource budgets.
Use browser developer tools for targeted performance investigations when needed.
