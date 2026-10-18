# Frontend ownership refactor — 2026-10-18

## Scope and baseline

Implements GitHub issue #10 from baseline `16df95b`. Preserve the site's visual
design and authored content while concentrating feature implementation and making
cross-component coordination explicit. No framework or dependency upgrade, URL
migration, generated-output relocation, or content rewrite was performed.

Baseline and final runs used Node 24.21.0, pnpm 12.6.0, matching Playwright
Chromium/WebKit (WebKit 26.6), and the served production build. Dependencies were
installed with `pnpm install --frozen-lockfile`. Lifecycle commands ran sequentially.
A separate detached baseline worktree had its own installation and output trees
for the later WebKit comparison; it did not share `node_modules` with this checkout.

The initial macOS content-test failure came from a symlinked temporary directory
causing the generated Worker to import `/private/Users/...`. Using
`TMPDIR=/private/tmp` made the same unchanged tests pass. The owning browser
troubleshooting guide now records this local setup requirement.

## Implementation decisions

- Features own their pages, local UI, data adapters, runtime helpers and tests.
  Shared profile summary/error presentation remain shared because they have
  multiple page consumers. Empty technical buckets and the unused CV section
  constant were removed.
- `src/contracts` contains build/browser data and pure rules. Compiler templates
  emit the new type imports; existing transitive input discovery and the `src`
  watcher continue tracking them. `src/app/data` remains generated and ignored.
- Root composition connects routing/providers and metadata. The metadata writer
  accepts a descriptor without importing feature implementations; article
  structured-data construction lives in reader data.
- Pages own `PageChromeService` registrations. Obsolete updates/disposals cannot
  overwrite the current page. Nested reader navigation has no global service
  writes. Tests cover replacement, reuse and idempotent cleanup.
- Reader navigation delegates desktop geometry and mobile dialog mechanics to
  directives on the existing DOM elements. This preserves subgrid/flex geometry
  and avoids introducing extra wrapper components merely to shorten files.
- `PostContentDirective` adapts Angular rendering to `ArticleRuntime`, which
  owns mounted views, listeners, observers and pending readiness/enhancement work.
  The page owns router fragment commits; history/reload scrolling remains global.
- Missing article resolution renders its recovery view without advertising reading
  context or controls; a page-level regression test covers this fallback.
- Search has a small shell launcher, deferred modal, per-open `SearchSession`,
  and shared deferred engine. Tests exercise stale results, dismissal, pending
  Enter and load failure without mounting an entire application.
- Pages own paper elements and shared paper CSS supplies the existing values.
  Reader/docs no longer modify ancestor layout via `:has`. The shell explicitly
  owns mobile dock clearance around its content/footer. Rich-text typography,
  code/table styling and code copying have a neutral shared owner.
- Import checks resolve static/type imports, re-exports and literal dynamic
  imports. Shared/platform cannot depend on shell/features; production build
  tools use contracts. Features can compose sibling route entry points, while
  shell can import the small search launcher. Root composition is the deliberate
  place for application-wide connections. The check is part of both ordinary
  and generated CI checks.

## Appearance comparison

Captured `/`, `/cv`, `/blog`, `/docs`, the diffusion article, and integer-break
(an article without an outline) at 390×900 and 1280×900, in light and dark themes.
The final 24 screenshots are pixel-identical to the baseline, and all measured
paper/toolbar/article/docs rectangles match exactly. The first comparison had
only eight pixels differing by one channel level at a native input border; the
final recapture has no differing pixels.

Existing production tests additionally cover widths 320–1600, safe areas,
outline alignment, scrolling/drawer bounds, print visibility, and no-JavaScript
reading. This is representative visual evidence, not a claim to have captured
every article or every possible viewport. External fonts/analytics/comments are
stubbed consistently in these comparisons; real MathJax has separate coverage.

## WebKit focus correction

The first complete browser run exposed two focus-restoration failures. Both
also failed on unchanged `16df95b` in the isolated baseline: the mobile contents
sheet and search dialog did not return focus to their pointer trigger on Escape.
A focused event probe showed macOS WebKit left `document.activeElement` on the
body during button clicks. Recording only that value cannot identify the opener.

Toolbar actions/search and the contents dock now pass the actual activating
button. Keyboard search captures the focused opener. Dialogs retain this explicit
target and restore it only when appropriate and still connected. The two exact
failing WebKit tests passed after the change; no test assertion was weakened.

## Validation

- `pnpm check`: passed, including strict app/templates/tooling/E2E types,
  formatting, import boundaries, lint and generated-document links.
- `pnpm test --watch=false`: 99 content/tooling tests and 240 application tests
  passed (36 application test files).
- `pnpm build`: passed, with 164 sitemap URLs and 163 Markdown alternatives.
- Final complete production browser run: 170 passed, 8 intentionally skipped,
  and the one unchanged cold-search budget failure described below.

The initial baseline navigation/layout/performance selection passed 35 tests,
skipped one, and failed the cold-search byte budget. This same pre-existing
budget remains visible in the final run: 2,423,491 decoded bytes against a
2,413,582 limit. The cold-search byte count is exactly unchanged; no budget was
relaxed. This is a known existing failure, not an all-green browser-suite claim.

| Served route | Initial code before → after | HTML before → after | Inline CSS before → after |
| --- | --- | --- | --- |
| `/` | 426,750 → 429,058 | 88,241 → 88,514 | 73,877 → 73,978 |
| `/blog` | 710,867 → 713,488 | 101,796 → 102,085 | 74,357 → 74,458 |
| `/blog/oi-icpc/codeforces/cf551c` | 818,965 → 821,966 | 172,941 → 173,056 | 112,077 → 111,948 |

All initial-route budgets pass. The small coordination/ownership APIs add roughly
2–3 KB of decoded initial code. Cold search remains separate and warm queries
make no new resource requests. Existing tests retain private-post exclusion,
initial article DOM adoption, no ordinary-reading browser engine, lazy article
attachments, real MathJax/WebKit, TeX copying, history restoration, PDFs,
metadata/Markdown negotiation and Cloudflare routing.

Long-article production diagnostics retain separate startup and scroll phases
at 4× CPU slowdown. They confirm zero per-scroll heading geometry reads. Raw
host timings are diagnostic; no comparable baseline timing run was taken for
those diagnostics, so this refactor makes no startup/scroll speedup claim.

## Evidence locations and maintenance

Ignored local evidence lives under `tmp/refactor-baseline`, `tmp/refactor-after`,
`tmp/refactor-*.log`, and `test-results`. Do not treat those local files as tracked
artifacts. This record retains the measured outcome and limits; current ownership
rules are in `docs/architecture.md`, `docs/development.md`, and `AGENTS.md`.

To change a TOC interaction, start in `features/reader/navigation`; page-level
coordination is in `reader-page.ts`. To change shared code blocks, edit
`shared/rich-content`. To add a page-specific toolbar action, register it from
the route page and release that handle with the page lifetime.
