# GitHub code quotations — 2026-10-18

## Contract and ownership

Standalone bare GitHub file permalinks with a full commit SHA and an explicit line
selection expand during MDX compilation. Explicit Markdown links (including URLs
used as labels), inline links, code fences, and unpinned links retain their normal
meaning. The authoring handbook owns the syntax and limits.

`scripts/lib/github-code.mts` owns recognition, bounded public raw-file fetching,
immutable whole-file caching, range validation, and semantic syntax-tree expansion.
The existing code renderer adds presentation-only line numbers and preserves
external annotation comments. The MDX HTML postprocessor combines the source
caption with the shared copy control after capturing semantic export HTML.
No frontend component or browser fetching dependency was introduced.

## Verification

- Required final gates: `pnpm check` and `pnpm test --watch=false`.
- Content/tooling suite: 106 tests; application suite: 241 tests across 36 files.
- Production build succeeded with 165 sitemap URLs and 164 Markdown alternatives.
- Targeted production browser regressions: 9 tests across desktop Chromium,
  mobile Chromium, and WebKit. Code-card tests mount actual compiler output into
  a served article, using production styles and the shared copy helper; they do
  not add a test article to the published corpus. Existing article/docs code-block
  regressions also passed.
- Six light/dark code-card screenshots were captured; desktop light and mobile
  WebKit dark were visually inspected. Line numbering, literal source comments,
  exact copy text, and absence of page overflow passed.
- The supplied `git/git` commit's `blob.h#L8-L12` was fetched through the real
  loader and rendered successfully, including its Markdown source attribution.
- Cache tests cover shared requests, offline reuse, corruption recovery, failed
  requests, binary/invalid UTF-8 input, and the file size limit. MDX tests cover
  link spelling, nested disclosures, literal HTML, exports, and contextual errors.
- The Markdown lint integration permits supported standalone quotes while keeping
  ordinary bare-URL diagnostics; its regression exercises the actual preset.

## Local environment

Validation used Node 24.21.0 / pnpm 12.6.0, `TMPDIR=/private/tmp`, and the existing
matching local Playwright browsers. Logs are under `/tmp/blog-github-code-*.log`;
browser evidence is in ignored `test-results/`. No dependency or CI changes were
needed. The first render of an uncached quote needs GitHub network access.
