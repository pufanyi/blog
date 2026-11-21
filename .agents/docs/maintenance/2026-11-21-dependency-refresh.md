# Dependency refresh — 2026-11-21

The starting commit was `60df90e`, with a clean working tree. This change updates
28 direct dependencies and their resolved transitive dependencies, Node from
`24.22.1` to `24.22.3`, and pnpm from `12.15.0` to `12.21.0`. Registry metadata
was checked on `2026-11-21`.

## Package updates and intentional holds

Updated direct packages:

- **Angular & Angular ESLint**: `@angular/cdk`, `@angular/common`,
  `@angular/compiler`, `@angular/core`, `@angular/forms`,
  `@angular/platform-browser`, `@angular/platform-server`, `@angular/router`,
  `@angular/ssr`, `@angular/build`, `@angular/cli`, `@angular/compiler-cli` to
  `22.3.0`; `@angular-eslint/builder` and `angular-eslint` to `22.8.0`.
- **PDF viewer & DOM/Markdown toolchain**: `ngx-extended-pdf-viewer` `31.0.1` →
  `32.0.2` (pdf.js `6.5.1526`), `jsdom` `30.1.3` → `31.0.1`, `marked` `18.1.1` →
  `18.2.1`, `shiki` and `@shikijs/transformers` `4.5.0` → `4.6.0`.
- **Runtime UI, build & test tooling**: `@formkit/auto-animate` `0.10.0` →
  `0.10.2`, `medium-zoom` `1.1.0` → `1.1.2`, `tslib` `2.8.1` → `2.9.1`,
  `@biomejs/biome` `2.6.2` → `2.6.8` (`biome.json` `$schema` updated to
  `2.6.8`), `eslint` `10.13.0` → `10.15.0`, `typescript-eslint` `8.72.0` →
  `8.73.0`, `image-size` `2.0.4` → `2.1.0`, `vitest` `5.0.5` → `5.1.1`,
  `wrangler` `4.152.0` → `4.165.0`.

Held intentionally:

- `typescript` (`~6.0.3`): `@angular/compiler-cli@22.3.0` requires
  `>=6.0 <6.1` (`7.0.2` is not yet compatible).
- `@types/node` (`^24.19.2`): held on the Node 24 LTS line (latest on `@24`).
- `@types/jsdom` (`^30.0.0`): latest published `@types/jsdom` dist-tag (`30.0.0`).
- `mathjax` and `@mathjax/mathjax-newcm-font` (`4.1.3`): already at latest
  upstream release; CDN URL in `src/app/shared/math/mathjax.ts` unchanged.
- `@lichess-org/chessground` (`10.5.0`) and `chessops` (`0.15.1`): already at
  latest upstream releases.

## Compatibility notes, exceptions, and audit

- **`marked@18.2.1` fenced code block handling**: `marked` 18.2.1 preserves a
  trailing newline inside fenced code blocks ending in blank lines (aligning
  `marked.parse()` with CommonMark and `@mdx-js/mdx`). Updated the round-trip
  assertion in `scripts/lib/agent-content.spec.mts` (`${code}\n`) where the
  fixture wraps `code` (which already ends with `\n\n`) inside an extra
  newline before the closing fence.
- **`pnpm-workspace.yaml` cleanup**: Removed the `'vite@8.3.0': 8.3.5` override
  (no longer needed since `@angular/build@22.3.0` depends directly on
  `vite@8.3.8`) and cleared the stale `minimumReleaseAgeExclude` list (the
  refreshed lockfile passed pnpm 12.21.0's 949-entry supply-chain policy check
  without release-age exclusions). Updated `allowBuilds` to the exact resolved
  versions (`@parcel/watcher@2.6.0`, `esbuild@0.28.2`, `lmdb@3.5.9`,
  `msgpackr-extract@3.0.4`, `workerd@1.20261118.1`) and ran `pnpm dedupe` to
  consolidate `@angular-devkit/core` on `22.3.0`.
- **Peer check note**: `pnpm peers check` reports an upstream peer mismatch
  between optional WASM package `@oxc-parser/binding-wasm32-wasi@0.158.0` and
  `@napi-rs/wasm-runtime@1.2.7` (`@emnapi/core` / `@emnapi/runtime`
  `2.0.0-alpha.6` vs `^1.7.1 || 2.0.0-beta.2 || 2.0.0-beta.3`).
- **`pnpm audit`**: `pnpm audit --prod` reports zero vulnerabilities. Overall
  `pnpm audit` dropped from 10 advisories (4 high, 6 moderate) to 2 moderate
  development-only findings under `remark-cli → unified-args → unified-engine`
  (`glob` `GHSA-3g3m-2fjr-6pw4` and `minimatch` `GHSA-g3hv-75wg-m249`).

## Validation results

- `pnpm install --frozen-lockfile`: exited 0.
- `pnpm check`: exited 0 (`generate:data` rendered 115 posts and 165 exports;
  `biome check .`, `check:boundaries`, `ngc --noEmit`, `tsc --noEmit`, `eslint`,
  `remark`, and `check-bibtex` all passed).
- `pnpm test --watch=false`: exited 0 (`test:content` 126/126 passed; `ng test`
  37 test files, 249/249 tests passed).
- Production builds: cold `pnpm build` (17.807s) and warm `pnpm build` (16.684s)
  both succeeded (193 prerendered routes, 175 sitemap URLs, 174 Markdown
  alternatives), confirming Angular 22.3.0 disk caching.
- `pnpm preview:cloudflare`: smoke-tested local Worker at `http://127.0.0.1:8787`;
  `/`, `/docs/dependencies`, `/assets/pdf-viewer/viewer-6.5.1526.min.mjs`,
  `/assets/pdf-viewer/iccs/CGATS001Compat-v2-micro.icc`, and `Accept: text/markdown`
  content negotiation all returned HTTP 200 with expected content types.
