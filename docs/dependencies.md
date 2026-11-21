# Dependency policy and exceptions

Use Node 26.13.1 (Lithium LTS) from `.nvmrc`, pnpm 12.21.0 from `package.json`,
and `pnpm install --frozen-lockfile`. Update
`package.json`, `pnpm-lock.yaml`, relevant install-script permissions, CI, and
operator instructions together when their workflow changes. Confirm peers,
checks, unit tests, a production build, and affected browser behavior.

Keep `@types/node` on the Node 26 line and TypeScript on 6.0.x while Angular 22
requires `>=6.0 <6.1`. A newer TypeScript major is not a compatible update yet.

Node 26.13.1 is the patched Active LTS release (including the November 2026
HTTP/2 and TLS security fixes and the earlier eMudhra certificate-trust fix).
Use this version or a newer patched Node 26 release in local development, CI,
and the actual deployment build environment; a platform `NODE_VERSION` override
must not select an older runtime. Rebuild deployed assets after updating the
build environment.

`pnpm-workspace.yaml` is the single owner of dependency exceptions. Exact
exceptions are deliberate review points, not a general bypass for future
versions. Review them when updating their parent dependency.

| Exception | Recorded reason and removal criterion |
| --- | --- |
| `allowBuilds` exact versions | Allow the installed native/build tools: Parcel watcher `2.6.0`, esbuild `0.28.2`, LMDB `3.5.9`, msgpackr-extract `3.0.4`, and workerd `1.20261118.1`. Authorize only versions needed by the resolved lockfile; remove stale entries when no installed dependency requires them. |
| Angular build/CLI/SSR 22.3.0 | Builds on the 22.1.8 SQLite cache serialization fix. See [cache evidence](maintenance/angular-cache.md). Keep framework/build peer ranges compatible on later upgrades. |
| `micromark-extension-math@3.1.0>katex` → `0.18.2` | The upstream `^0.16.0` range excludes the prototype-pollution gadget fix ([advisory](https://github.com/advisories/GHSA-238p-pmpm-9mq7)). Override only this parent; remove when its declared range includes the fix. Article rendering still uses MathJax. |
| MathJax and NewCM font 4.1.3 exact dev dependencies | Build-time article formulas, published local fonts, matching the production CDN URL. Builds require dev dependencies. Update renderer, fonts and runtime versions together; verify [WebKit worker behavior](maintenance/mathjax-webkit.md). |

The `vite@8.3.0` → `8.3.5` override and stale `minimumReleaseAgeExclude`
entries were removed in the November 2026 refresh once `@angular/build` 22.3.0
adopted Vite 8.3.8 and the resolved lockfile passed pnpm 12.21.0 supply-chain
policy checks without release-age exclusions. Earlier SDK, Hono Node server,
Rollup, and `listr2` exceptions were likewise removed in prior refreshes. Keep
any future exception tied to a reproduced problem and review it with its parent
dependency.

Do not infer upgrade safety from an install alone. Preview Cloudflare routing
when changing Wrangler/workerd; verify PDF canvases, engine assets, and the CMYK
profile when changing the PDF viewer; verify generated citations/Markdown and
article-local components when changing MDX/rendering packages.

## Remaining audit finding

As of 2026-11-21, `pnpm audit --prod` reports zero findings, and the prior
`undici` (via Wrangler/Miniflare) and ESLint `minimatch` advisories are
resolved. Two moderate development-only advisories remain under
`remark-cli → unified-args → unified-engine`: `glob` (`<=14.0.1`,
[GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4)) and
its transitive `minimatch` (`<11.0.1`,
[GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)). Our
lint command supplies a fixed repository glob and does not enable watch mode or
accept visitor patterns; neither package ships in the browser or Worker. Keep
these findings visible in `pnpm audit` and revisit when `remark-cli` /
`unified-engine` publishes an update; do not force incompatible major overrides
into the legacy CLI.

## Article chessboards

The shared chess kit in `content/shared/chess` uses two Lichess packages, both
licensed under GPL-3.0-or-later:

- **`@lichess-org/chessground` 10.5.0.** It draws the interactive boards, and
  its browser module loads only through the kit's lazy article enhancement.
  The local Cburnett SVG pieces in `public/assets/chess/pieces` are extracted
  from that version's `chessground.cburnett.css`. Preserve the
  [third-party notice](../public/licenses/chessground.txt) when updating the
  package or the pieces.
- **`chessops` 0.15.1.** It is a development dependency and runs only during
  generation. It parses PGN and replays moves under each variant's rules. The
  browser never imports it: build-time modules pass plain FENs and moves to
  the client through `model.ts`, which must stay free of chessops imports.

The original project files retain their MIT notice; the combined browser
distribution includes GPL-covered code and must be distributed under
GPL-compatible terms with corresponding source.
