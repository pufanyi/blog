# Blog maintainability audit — 2026-09-12

This document preserves the original baseline. Implementation outcomes and
validation are recorded in the [ordered maintenance task list](../maintenance/tasks.md).

The main maintenance risk is the growing cost of adding and changing article features. The application already has useful boundaries and meaningful regression tests. Article presentation, content compilation, quality gates, and operational guidance need stronger boundaries so their maintenance cost does not keep growing with the collection.

## Scope and reproducibility

Audited commit: `10cb862e03ae68f087e663f6d68166ca1bae5e6d`.

The working tree changed during the audit: search behavior was being refactored and the policy-gradient article was being reorganized. Validation therefore used a clean archive of the audited commit at `/tmp/blog-audit.3XWC3B`, with its own dependencies installed using `pnpm install --offline --frozen-lockfile`. Search findings describe the baseline before that concurrent refactor. They do not assess its final implementation.

The audit covered application code, article components, styles, the content/deployment pipeline, scripts, configuration, CI, unit tests, browser tests, generated links, and selected production-page payloads. It did not review every article's technical claims or measure production Core Web Vitals, real-user performance, or dependency vulnerability status.

The host used Node 24.19.0, pnpm 12.3.4, and Ubuntu 20.04. Node differed from the `.nvmrc` pin of 24.18.1 but was within the declared engine range. Validation ran on a local temporary filesystem, so timings are neither CI timings nor a controlled performance benchmark. Browser dependencies were extracted into a temporary directory; workerd used a temporary newer-glibc launcher. Ports 4293/8893 replaced 4173/8787 only in the validation copy because an existing preview occupied 4173. The matching hardcoded E2E origin was adjusted, and server reuse was disabled. Application implementation and test assertions were otherwise unchanged.

Raw logs, measurement JSON, and browser probes are retained under the workspace's ignored `tmp/audit/` directory.

## Verified baseline

| Check | Result |
| --- | --- |
| `pnpm check` | Passed; 47.0 s in the isolated copy |
| `VITEST_MAX_WORKERS=2 pnpm test --watch=false` | Passed: 66 Node content tests and 50 Angular tests; 40.1 s including generation |
| `pnpm build` | Passed; 141 prerendered routes; 50.6 s including pre/post hooks |
| Playwright | 52 passed, 2 intentionally skipped, 43.0 s; desktop/mobile Chromium and Cloudflare |
| Generated article integrity | 97 articles, 569 local link/media references checked; no missing local targets, missing article fragments, or duplicate HTML IDs found in this scope |
| Real MathJax sample | SSL article at 1280 px and 390 px: 192 MathJax containers, no detected math errors/undefined commands or document-wide horizontal overflow |
| No-change content regeneration | 16.296 s; all 227 output files had unchanged bytes and were nevertheless rewritten |

The two skipped tests are copies of a Cloudflare-specific URL-normalization test under the desktop/mobile projects. That test passed in the Cloudflare project.

Direct browser access to the MathJax CDN initially failed with this host's proxy authentication error. The successful sample used the real MathJax 4.1.3 assets fetched through `curl` and supplied unchanged to the browser, including its additional CDN assets. This checks actual formula rendering, not production CDN reachability. Other external integrations were stubbed. It is a sample, not a visual certification of all articles or a WebKit check.

Source size, excluding generated application data:

| Area | Files | Lines |
| --- | ---: | ---: |
| Application TypeScript, excluding tests | 64 | 3,148 |
| Build/tooling `.mts`, excluding tests | 23 | 2,130 |
| Post-local `.tsx` | 27 | 4,944 |
| Application CSS | 44 | 6,429 |
| Node content tests | 20 | 1,850 |
| Angular tests | 17 | 966 |
| E2E tests | 4 | 852 |

The post-local component code is already larger than the application TypeScript. Maintenance work should account for that code as part of the software system. The repository has 97 articles and 62 direct dependencies (21 dependencies, 41 dev dependencies); dependency count alone does not establish poor quality.

## Assessment by dimension

| Dimension | Assessment |
| --- | --- |
| Code cleanliness | Application modules are generally compact. Large gaps in formatting/lint scope and an unused duplicated article component undermine consistency. |
| Maintainability | The primary concern: article-specific CSS, runtime hooks, and numeric models cross article/application boundaries. Adding content features requires editing shared implementation. |
| Sustainability | Full regeneration, unconditional rewrites, disabled Angular caching, and manual content regeneration increase feedback and operating costs. Operational knowledge is concentrated in a long global instruction file. |
| Performance | Deferred article bodies, deferred search, and on-demand MathJax are useful foundations. Current budgets do not constrain complete route payloads, search startup, or accumulated article styles. |
| Code quality | Strict TypeScript, configuration validation, lockfile installation, and CI gates are strong. The advertised checks need a precise scope; not every executable file receives linting or application compilation. |
| Test quality | Strong regressions for several real user journeys. Coverage of browser-engine differences, visual math behavior, lifecycle failure paths, and performance limits is much thinner. No reliable numeric coverage percentage was established. |

## Findings and priorities

P1 means the next maintenance iteration; P2 means a subsequent focused improvement. These are maintenance priorities, not claims of an active production outage.

### P1 — Article features have too much influence on shared application code

Evidence:

- [`PostComponent`](../../src/app/pages/post/post.ts), starting at line 38, registers every article stylesheet. Fifteen files under `styles/media/` contain 55,227 source bytes of article-specific CSS.
- [`PostContentDirective`](../../src/app/directives/post-content.ts), line 58, knows about the FlashAttention selector and controller import directly.
- The FlashAttention model and player live in `src/app/utils/flash-forward`, while their authored markup lives under the article tree. This shares the numerical source of truth, but places an article feature inside the general application source tree.
- `collective-op/scripts/collectives.post-component.tsx` and `infra-tp/scripts/collectives.post-component.tsx` are byte-for-byte identical, 535-line files. `infra-tp/index.mdx` does not invoke the exported component. The component loader still imports every matching entrypoint in an article's scripts directory.
- In the last 80 commits ending at the audited commit, `PostComponent` changed in 14 commits. This is a change-frequency observation, not proof that every change was unnecessary.

The impact is concrete: the prerendered CF551C page includes SSL-specific rules even though it has no SSL diagram. Its inline styles total 143,425 bytes; its article body is 30,539 bytes. The style total includes shared/global styles, so it must not all be attributed to the fifteen article files.

Recommended change: remove the unused duplicate first. Then introduce a small, explicit contract for article assets and optional controllers, with declarations close to their article. Generate or validate the asset/controller associations instead of growing the shared component list. Keep reusable diagram primitives in a build-time shared location and preserve the existing shared numerical models. A controller should expose installation and cleanup through one consistent interface. Avoid adding a broad plugin framework before there are concrete reusable cases.

Acceptance criteria: adding an isolated article diagram/controller does not require editing `PostComponent` or `PostContentDirective`; unrelated articles do not receive its CSS; navigation cleanup and Markdown exports continue to work.

### P1 — A no-change generation rewrites the entire derived corpus

Evidence:

- [`scripts/build-posts.mts`](../../scripts/build-posts.mts), lines 41–56, deletes and rebuilds the article output directory and unconditionally writes article modules.
- The same generator recompiles all articles, rebuilds the complete search index, and emits all Markdown/feed exports.
- [`package.json`](../../package.json), lines 6–16 and 30–32, runs generation before check, test, build, start, and E2E's build.
- A measured no-change run took 16.296 seconds and rewrote all 227 outputs while changing none of their contents.
- `start` and `watch` generate once, then watch Angular output; they do not watch authored MDX/BibTeX/YAML inputs themselves. The README correctly tells authors to invoke generation manually for configuration edits.
- [`angular.json`](../../angular.json), lines 10–11, disables Angular's persistent cache. Git history shows this setting was introduced alongside a PDF hydration test fix, without a documented cache-specific reason in that change.

This increases filesystem events and unnecessary work during editing. A later generation error can also leave a partially updated set of derived artifacts because publication is not transactional. That partial-state risk was inferred from the write order; it was not reproduced as a production incident.

Recommended sequence:

1. Write only when bytes change and prune only obsolete outputs. Preserve the last successful output set when generation fails.
2. Add a watcher for authored content and its imported build-time dependencies.
3. Re-evaluate the disabled Angular cache with a documented reproducer for any invalidation concern. Angular documents disk caching as a way to reuse build/test work: [Angular cache documentation](https://angular.dev/cli/cache).
4. Add per-article caching only after dependencies are explicit. Cache keys must account for MDX, BibTeX, imported TSX/shared models, renderer changes, and relevant configuration; hashing only `index.mdx` would create stale output bugs.

CI already generates once in its quality job and uses the `*:generated` scripts. Preserve that improvement and keep the required aggregate status check.

Acceptance criteria: a no-change generation preserves output mtimes; editing one article does not recompile unrelated article bodies; a failed edit leaves the last successful preview usable; author changes update the dev preview automatically.

### P1 — Quality gates have substantial scope gaps

Evidence:

- [`biome.json`](../../biome.json), lines 3–4, includes only tooling `.mts` and two configuration files. Its linter is disabled at lines 18–19. `biome check .` is therefore not repository-wide code linting or formatting.
- Angular lint targets only `src/**/*.ts` and `src/**/*.html` in `angular.json`, lines 103–109.
- ESLint's TypeScript configuration matches `**/*.ts`, not `.mts` or `.tsx`. `eslint --print-config` returned `undefined` for both `scripts/build-posts.mts` and a post-local TSX helper.
- The strict content typecheck is valuable, but it does not substitute for semantic linting. The post components, script code, E2E files, and CSS do not receive a common consistent formatting gate.
- `pnpm check` explicitly typechecks content/tooling and E2E, then runs lint. It does not run the Angular compiler over the complete application/templates. CI's separate production build does provide that safeguard.

Recommended change: document a file-type-to-tool ownership table, cover all executable source files, and make the complete application/template check available through an unambiguous command. Keep Angular template linting. Select one formatting owner per file type rather than running competing formatters on the same files. Add useful type-aware lint rules selectively; they provide checks beyond syntax-only linting and incur extra type-analysis work, as described in [typescript-eslint's typed linting guide](https://typescript-eslint.io/getting-started/typed-linting/).

Acceptance criteria: `.ts`, `.mts`, `.tsx`, templates, and styles each have a documented validation owner; representative defects in each executable source category are caught by the advertised gate. Apply large formatting-only changes separately from behavior changes.

### P1 — Performance budgets measure too little of the delivered experience

The build's `initial` total is 208,022 bytes, but actual route loads also request lazy/shared chunks. Measured first-party JavaScript/CSS response bodies on cold local production-page visits were:

| Route/action | Uncompressed JS/CSS bytes |
| --- | ---: |
| Homepage `/` | 441,498 |
| Archive `/blog` | 575,368 |
| Article `/blog/oi-icpc/codeforces/cf551c` | 758,871 |
| First search opening, additional resources | 1,430,448 |

These figures exclude HTML, images, fonts, and external scripts. They are decoded resource sizes, not production compressed network transfers. Third-party requests were stubbed for these route measurements. Each context was cold; a theme interaction ensured client code had attached. They establish a budget gap, not an LCP or INP regression.

The baseline search-modal chunk alone is 1,420,680 bytes, or 265,742 bytes when locally Brotli-compressed. The post component chunk is 152,026 bytes, or 29,337 bytes Brotli. The local compression results are estimates of compression potential, not measurements of deployed response headers.

The baseline search service statically imports the complete generated index/documents and synchronously imports the index in its constructor. One local sample took 282 ms from the search click to the input becoming available and 15 ms for query-plus-result rendering. Those single samples are not stable device/network benchmarks. Concurrent search work was already addressing this area; verify its final cold-load behavior before proposing another search implementation.

Current budgets cover `initial` and each component stylesheet, not the total article styles, route payload, or search feature. The E2E loading test searches downloaded JavaScript text for `contentHtml`; it checks a useful lazy-loading invariant but neither constrains bytes nor remains independent of output property names.

Recommended change: retain the invariant test, and add production-page resource budgets for representative routes and cold search. Track application-owned resources separately from third-party integrations. Record search opening separately from query/rendering, and include worker resources if the engine moves into a worker. Add named lazy-bundle budgets where useful. Angular explicitly distinguishes initial/bootstrap budgets from lazy-bundle budgets: [Angular size budgets](https://angular.dev/tools/cli/build#configuring-size-budgets).

Acceptance criteria: adding an unrelated diagram or growing the search corpus cannot materially increase a representative route's payload without a visible check/report change. Set limits from measured baselines and an explicit device/network target, not arbitrary round numbers.

### P2 — The next tests should target lifecycle, failure, and rendering boundaries

Existing strengths are substantial: bubbling keyboard navigation, Chinese search, focus containment/restoration, scroll/history recovery, PDF canvases and missing-PDF behavior, MathJax-delayed layout, Markdown negotiation, canonical URLs, collapsed APA citations, and shared numerical-model assertions. These are behavior checks with practical value.

The less protected areas are:

- `PostContentDirective`, content image hydration, citation preview overlays, and asynchronous controller initialization lack focused failure/cleanup regression coverage. A diagram's numeric model tests do not prove that navigation disposes its observers/events correctly.
- The main blog E2E suite stubs MathJax. That is appropriate for reliable navigation tests, but cannot catch unsupported TeX, foreign-object label layout, or actual font metrics.
- Both visual browser projects use Chromium. No WebKit project exists despite the repository documenting a WebKit-specific SVG/MathJax concern.
- There are no screenshot regression baselines or automated accessibility audits. Neither should be applied indiscriminately to every article; a representative set of complex figures/dialogs would have higher value.
- Several generic feature tests depend on named published articles and headings. For example, search tests name VAE/diffusion slugs and TOC tests name an autoregressive section. Routine editorial moves can require changes to unrelated behavior tests.
- The 418-line blog E2E file combines many concerns, and some individual tests contain long chains of interactions. Splitting by user behavior would make failures easier to diagnose without changing coverage goals.

Recommended change: preserve a small set of real-corpus integration tests; use controlled fixtures for pure search ranking/empty states and precise renderer boundaries. Add a real-MathJax smoke suite with pinned local assets, a small WebKit rendering/navigation set, and focused cleanup/failure tests. Exercise failure of deferred imports, navigation before initialization finishes, repeated opening/closing, and clipboard rejection. Put resource budgets beside those scenarios.

The existing approach of user-facing locators and third-party stubs aligns with [Playwright's best practices](https://playwright.dev/docs/best-practices). The gap is the absence of complementary tests for the deliberately stubbed behavior. A global coverage percentage or more happy-path assertions would not directly solve it.

### P2 — Compiler/deployment boundaries should be made explicit before more extensions

The renderer currently combines component discovery, MDX evaluation, citation metadata/link repair, native-disclosure rewriting, table wrapping, image dimensions, PDF routing, TOC generation, and syntax highlighting. It is roughly 388 lines and has useful helper functions; its size alone is not a reason to split it. The important risk is ordering: Markdown export must precede highlighting, citation repair must precede downstream metadata extraction, and HTML adjustments affect both runtime enhancement and exports.

Recommended change: document a short staged pipeline and its input/output contracts, keeping tests around observable output semantics. Extract stages when they acquire independent responsibility or repeated use. Reuse a parsed document where profiling shows repeated parsing matters. `searchableText` and `postprocessMdxHtml` create JSDOM windows without the explicit `finally`/`window.close()` used by neighboring helpers; align resource ownership when changing those stages. This is an ownership inconsistency, not a measured memory leak.

CV YAML is cast to `CvData` after parsing while site configuration/front matter receive explicit runtime validation. Add equivalent boundary validation when changing the CV model, so malformed authored data produces a file/field error rather than failing later in rendering.

Static asset copying is broad. The PDF library publishes 455 files totaling 20,743,031 bytes, including multiple engine builds. These are deployment bytes, not a claim that every visitor downloads 20 MB. Inspect used asset variants before narrowing the copy rules; preserve the PDF regression suite. Likewise, make exclusion of build-only article files follow an explicit convention as new file types are introduced.

### P2 — Durable operating knowledge needs smaller, better-located homes

The audited `AGENTS.md` has 473 lines. It changed in 37 of the last 80 commits. It contains architectural constraints, migration recipes, browser-host workarounds, content style, feature-specific implementation lessons, and editorial guidance.

Many entries capture valid lessons. Keeping all of them globally active increases the reading burden and makes it harder to distinguish permanent contracts from a workaround for one tool version or host.

Recommended change: keep repository-wide commands and architectural invariants at the root; move article/editorial rules to appropriately scoped instructions; place host recipes in a development troubleshooting document; link a short content/deployment architecture document. Before shrinking a rule, replace testable invariants with executable checks where practical. Record a reason and removal condition for dependency overrides and disabled caches.

Success means an ordinary prose edit has a clear short workflow, while renderer or hosting changes still reveal all relevant constraints. Merely shortening the instruction file without preserving its useful knowledge would lose safety.

## Suggested implementation order

| Order | Scope | Completion signal |
| --- | --- | --- |
| 1 | Correct quality-gate documentation; remove the unused 535-line duplicate; define formatter/linter ownership | Validation scope is explicit and executable source is covered |
| 2 | Preserve mtimes on no-change generation; protect the last successful output; investigate cache disabling | A repeated generation does not rewrite the corpus |
| 3 | Isolate article styles/controllers and define their lifecycle | Adding an article feature leaves unrelated pages and shared registration code unchanged |
| 4 | Add route/cold-search payload reports and focused lifecycle/rendering regressions | Growth and asynchronous cleanup failures are caught automatically |
| 5 | Add dependency-aware content watching/caching and reorganize operational documentation | Authoring feedback scales primarily with the changed content |

Keep these as small reviewable changes with behavior and formatting work separated. The current evidence supports targeted refactoring of the existing Angular application. It does not establish a need to migrate frameworks, replace MDX, combine every test runner, or build a general plugin platform.

The audit itself changes only this report and a clarification of the existing validation note in `AGENTS.md`. Product implementation, article content, and concurrent work were left to their respective tasks.
