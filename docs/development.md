# Development and validation

Use Node from `.nvmrc` and the pinned pnpm in `package.json`.
Install with `pnpm install --frozen-lockfile`.

## Commands

| Command | Behavior |
| --- | --- |
| `pnpm start` | Generate once, then watch authored content/configuration and serve Angular |
| `pnpm watch` | Watch content and the Angular development build |
| `pnpm generate:data` | One content generation; unchanged outputs keep their mtimes |
| `pnpm check` | Generate, format/lint, Angular/templates, tooling/content and E2E typechecks |
| `pnpm test --watch=false` | Generate, Node content tests, then Angular unit tests |
| `pnpm build` | Generate, production prerender, then deployment manifests/assets |
| `pnpm test:e2e` | Production build and Chromium/WebKit/Cloudflare browser projects |
| `pnpm preview` / `pnpm preview:cloudflare` | Serve the existing production build |
| `pnpm biome:write` | Apply configured source formatting |
| `pnpm format:bib` | Normalize authored bibliography files |

The `prebuild`, `pretest`, and `precheck` hooks generate content. The start/watch
wrapper performs its own initial generation; there is no separate `prestart`.
The `*:generated` variants deliberately omit generation for CI's already-fresh
outputs. Keep them aligned with their ordinary counterparts.

The watcher observes MDX, bibliography/assets, YAML, local component dependencies,
compiler scripts, package/lock, and TypeScript configuration. It serializes and
coalesces changes, using a fresh generator process to avoid stale imported JSX.
An invalid edit keeps the last successful preview and prints the error; save a
correction to resume. `pnpm generate:data` remains useful for a one-off refresh.

Run these lifecycle-hooked commands sequentially: they write shared generated
files, and pnpm's dependency verification can also relink `node_modules`.
When concurrent tasks share the checkout, use an isolated validation snapshot
with its own generated directories and dependencies; a shared `node_modules`
symlink can disappear or change during another task's installation.
Seed the snapshot from a committed base and overlay only the task's changes;
copying a live worktree can capture another task's incomplete edits.

## Tool ownership

| Files | Formatting/lint | Type and behavior validation |
| --- | --- | --- |
| Application TS | Biome + ESLint | Angular compiler/strict templates + unit tests |
| Angular HTML | Angular template ESLint | `ngc` strict template compilation |
| Tooling MTS and article TS/TSX | Biome + ESLint | `tsconfig.scripts.json` + content tests |
| Browser-test TS | Biome + ESLint | `tsconfig.e2e.json` + served production browser tests |
| CSS and root JSON | Biome | Production build + relevant browser checks |
| MDX | Remark | Generator + renderer and export regressions |
| BibTeX | BibTeX checker | Citation renderer and export regressions |
| Configuration/CV YAML | Runtime schema validation | Generator and schema tests |

- Prefer `.mts` for Node ESM scripts and executable configuration, `.ts` for
  Angular/shared code, and `.tsx` for JSX. `tsconfig.scripts.json` checks all
  tooling, script tests, and post-local components strictly, without `allowJs`.
  Include post-local JSX helpers as well as component entrypoints: `tsx` needs
  those files covered by this config to use the automatic React JSX runtime.
  Keep build-time TSX files excluded from Angular's post asset copy rules.
  Keep native Node entrypoints compatible with type stripping; MDX generation
  and its tests use `tsx` because they load authored JSX components.

- ESLint loads `eslint.config.mts` through the explicit `jiti` dev dependency.
  Remark discovers `.remarkrc.json`, which points to `remark.config.mts` as a
  preset; its current configuration loader does not discover TypeScript files.

- Run unit tests with `pnpm test`; use `pnpm test --watch=false` for a
  noninteractive run. `pnpm check` includes Angular application/template compilation,
  content/tooling and E2E typechecks, and lint; it does not run tests or a production build.
  If Vitest workers exit unexpectedly on a host reporting many CPUs, retry with
  `VITEST_MAX_WORKERS=2 pnpm test --watch=false` to limit local concurrency.

- Angular's unit-test builder does not support `vi.mock` for relative imports.
  Override injectable dependencies through `TestBed` when testing configuration.

- Before focusing an offscreen control in a browser test, scroll it into view.
  Otherwise global smooth scrolling can overlap the next navigation.

## Browser coverage

Install browsers with `pnpm exec playwright install --with-deps chromium webkit`.
CI uses `--only-shell chromium` and the default Chromium channel. Desktop/mobile
Chromium cover navigation, search, history, metadata, PDFs and content assets;
WebKit covers search and real MathJax with SVG labels. The Cloudflare project
exercises actual Worker/static-asset routing. Its two corresponding Chromium
checks are intentionally skipped to avoid claiming Node preview reproduces
Cloudflare behavior.

- Check search with real, bubbling keyboard events and both Chinese and
  English queries. Verify one-step arrow navigation, focus containment,
  dismissal, and focus restoration on the served page.

Focused navigation/reading tests use a delayed MathJax stub to control layout
races. `rendering.spec.ts` separately uses pinned real engine/font/worker bytes;
keep both kinds of coverage. Resource budgets retain per-request JSON, and real
rendering retains light/dark diagram captures even on success. CI retains full
failure traces/reports. Screenshots are review evidence, not pixel snapshots.
See [performance budgets](maintenance/performance.md),
[MathJax compatibility](maintenance/mathjax-webkit.md), and
[local host troubleshooting](browser-troubleshooting.md).

The quality and browser CI jobs run independently. The final required `check`
job must require both to succeed. `pnpm check` does not run tests or build.
Use a focused behavior test for a regression; avoid assertions that merely mirror
implementation details or depend on unrelated authored prose.
