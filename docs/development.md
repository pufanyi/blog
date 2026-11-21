# Development and validation

Use Node from `.nvmrc` and the pinned pnpm in `package.json`.
Install with `pnpm install --frozen-lockfile`.

## Commands

| Command | Behavior |
| --- | --- |
| `pnpm start` | Generate once, then watch authored content/configuration and serve Angular |
| `pnpm watch` | Watch content and the Angular development build |
| `pnpm generate:data` | One content generation; unchanged outputs keep their mtimes |
| `pnpm check:boundaries` | Resolve source imports and enforce feature/shared/build dependency directions |
| `pnpm check:sizes` | Enforce single-file line budgets (400 lines for CSS, 500 lines for TS/TSX/MTS/HTML) |
| `pnpm check` | Generate, format/lint, boundary/size checks, Angular/templates, tooling/content typechecks |
| `pnpm test --watch=false` | Generate, Node content tests, then Angular unit tests |
| `pnpm build` | Generate, production prerender, then deployment manifests/assets |
| `pnpm preview` / `pnpm preview:cloudflare` | Serve the existing production build |
| `pnpm biome:write` | Apply configured Biome formatting and safe lint fixes |
| `pnpm format:bib` | Normalize authored bibliography files |

The `prebuild`, `pretest`, and `precheck` hooks generate content. The start/watch
wrapper performs its own initial generation; there is no separate `prestart`.
The `*:generated` variants deliberately omit generation when derived outputs are
already fresh. Keep them aligned with their ordinary counterparts.

The watcher observes MDX, handbook Markdown/navigation, bibliography/assets, YAML, local component dependencies,
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

### Icon subset maintenance

The site uses a checked-in WOFF2 subset of Phosphor regular in
`src/styles/icons`, retaining the upstream icon geometry and class names.
Content generation rejects icon names missing from its stylesheet. Use complete
`ph-name` literals in templates, TypeScript, or CV/configuration YAML; use
`var(--icon-caret-right)` for the article disclosure marker. Do not assemble
icon names from string fragments, since discovery cannot resolve them.

After adding icons or updating `@phosphor-icons/web`, regenerate with the optional
maintenance tool FontTools (ordinary builds need only Node and pnpm):

```bash
python -m venv /tmp/blog-font-tools
/tmp/blog-font-tools/bin/pip install 'fonttools[woff]==4.61.1'
PHOSPHOR_SUBSETTER=/tmp/blog-font-tools/bin/pyftsubset node scripts/subset-icons.mts
pnpm exec biome format --write src/styles/icons/phosphor.css
```

Commit both the generated CSS and WOFF2. The generator retains the upstream MIT
license in the stylesheet. Check toolbar, CV/social icons, directory icons and
article disclosure markers in the production browser build.

### Source checks

| Files | Formatting/lint | Type and behavior validation |
| --- | --- | --- |
| Application TS | Biome + ESLint + import boundaries | Angular compiler/strict templates + unit tests |
| Angular HTML | Angular template ESLint | `ngc` strict template compilation |
| Tooling MTS and article TS/TSX | Biome + ESLint | `tsconfig.scripts.json` + content tests |
| CSS and root JSON | Biome | Production build + manual browser review |
| MDX | Remark | Generator + renderer and export regressions |
| BibTeX | BibTeX checker | Citation renderer and export regressions |
| Configuration/CV YAML | Runtime schema validation | Generator and schema tests |

- Prefer `.mts` for Node ESM scripts and executable configuration, `.ts` for
  Angular/shared code, and `.tsx` for JSX. `tsconfig.scripts.json` checks all
  tooling, script tests, and post-local components strictly, without `allowJs`.
  Include post-local JSX helpers and reusable `content/shared` components as well
  as component entrypoints: `tsx` needs those files covered by this config to use
  the automatic React JSX runtime.
  Keep build-time TSX files excluded from Angular's post asset copy rules.
  Keep native Node entrypoints compatible with type stripping; MDX generation
  and its tests use `tsx` because they load authored JSX components.

- ESLint loads `eslint.config.mts` through the explicit `jiti` dev dependency.
  Remark discovers `.remarkrc.json`, which points to `remark.config.mts` as a
  preset; its current configuration loader does not discover TypeScript files.

- Run unit tests with `pnpm test`; use `pnpm test --watch=false` for a
  noninteractive run. `pnpm check` includes Angular application/template compilation,
  content/tooling typechecks, and lint; it does not run tests or a production build.
  If Vitest workers exit unexpectedly on a host reporting many CPUs, retry with
  `VITEST_MAX_WORKERS=2 pnpm test --watch=false` to limit local concurrency.

- Angular's unit-test builder does not support `vi.mock` for relative imports.
  Override injectable dependencies through `TestBed` when testing configuration.

## Browser coverage

E2E browser automation has been removed. The author reviews published articles
by reading them and checking their interactions. Use manual desktop/mobile
review for layout, navigation, search, formulas, and PDFs when relevant; do not
install browsers or recreate automated suites for routine changes.
For a local production preview, run `pnpm build` followed by `pnpm preview`.
Use `pnpm preview:cloudflare` when checking Worker/static-asset routing.

GitHub CI runs Biome lint and formatting checks (`biome ci .`) in the quality job
without installing Node dependencies, generating content, or running tests. The
final required `check` job requires that job to succeed. Full `pnpm check` and
`pnpm test --watch=false` remain local pre-push checks.
Use a focused unit test for a logic regression; avoid assertions that merely
mirror implementation details or depend on unrelated authored prose.

## Documentation workflow

Read the [handbook](index.md) for author and developer entry points. The watcher also monitors `docs/`; saving a page or its navigation regenerates the documentation site at `/docs`. Invalid document links or anchors fail generation. Update the [owning guide](documentation.md#where-to-update) with changes to commands, configuration, or application behavior. See [testing](testing.md) for choosing validation and [deployment](deployment.md) for production output.
