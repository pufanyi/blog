# Dependency policy and exceptions

Use Node 24.22.1 from `.nvmrc`, pnpm 12.15.0 from `package.json`, and
`pnpm install --frozen-lockfile`. Update
`package.json`, `pnpm-lock.yaml`, relevant install-script permissions, CI, and
operator instructions together when their workflow changes. Confirm peers,
checks, unit tests, a production build, and affected browser behavior.

Keep `@types/node` on the Node 24 line and TypeScript on 6.0.x while Angular 22
requires `>=6.0 <6.1`. A newer TypeScript major is not a compatible update yet.

Node 24.22.1 includes the eMudhra certificate-trust security fix described in the
[Render advisory](https://render.com/docs/advisory-emudhra). Use this version or a
newer patched Node 24 release in local development, CI, and the actual deployment
build environment; a platform `NODE_VERSION` override must not select an older
runtime. Rebuild deployed assets after updating the build environment.

`pnpm-workspace.yaml` is the single owner of dependency exceptions. Exact
exceptions are deliberate review points, not a general bypass for future
versions. Review them when updating their parent dependency.

| Exception | Recorded reason and removal criterion |
| --- | --- |
| `allowBuilds` exact versions | Allow the installed native/build tools: Parcel watcher, esbuild, LMDB/msgpack extraction, and workerd. Authorize only versions needed by the resolved lockfile; remove stale entries when no installed dependency requires them. The resolved esbuild version is 0.28.2. |
| Angular build/CLI/SSR 22.2.4 | Builds on the 22.1.8 SQLite cache serialization fix. See [cache evidence](maintenance/angular-cache.md). Keep framework/build peer ranges compatible on later upgrades. |
| `minimumReleaseAgeExclude` exact versions | pnpm 12.15 records the explicitly selected Angular tooling 22.2.4, Wrangler 4.152.0, and its Miniflare dependency while they are inside the release-age window. These are limited to the reviewed lockfile versions; remove after the window or on the next refresh. |
| `vite@8.3.0` → `8.3.5` | Angular build 22.2.4 pins 8.3.0, which has published development-server advisories fixed in 8.3.3. Use the current patched 8.3 release; remove when Angular no longer pins the vulnerable version. |
| `micromark-extension-math@3.1.0>katex` → `0.18.2` | The upstream `^0.16.0` range excludes the prototype-pollution gadget fix ([advisory](https://github.com/advisories/GHSA-238p-pmpm-9mq7)). Override only this parent; remove when its declared range includes the fix. Article rendering still uses MathJax. |
| MathJax and NewCM font 4.1.3 exact dev dependencies | Build-time article formulas, published local fonts, and deterministic real-browser assets matching the production CDN URL. Builds require dev dependencies. Update renderer, fonts and runtime/test versions together; retain the [WebKit worker regression](maintenance/mathjax-webkit.md). |

The older SDK, Hono Node server, and Rollup overrides, `listr2` peer exception,
and release-age exclusions were removed after the September 2026 refresh resolved
compatible versions without them. Keep any future exception tied to a reproduced
problem and review it with its parent dependency.

Do not infer upgrade safety from an install alone. Preview Cloudflare routing
when changing Wrangler/workerd; verify PDF canvases, engine assets, and the CMYK
profile when changing the PDF viewer; verify generated citations/Markdown and
article-local components when changing MDX/rendering packages.

## Remaining audit finding

As of 2026-10-23, `remark-cli → unified-args → chokidar → braces@3.0.3`
still reports [a stack-exhaustion advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm),
with no published patch. This is a development-only CLI dependency: our lint
command supplies a fixed repository glob and does not enable watch mode or
accept visitor patterns. It is not shipped in the browser or Worker. Keep the
finding visible in `pnpm audit` and revisit when upstream publishes a fix; do
not force a newer Chokidar major into the old CLI, which relies on glob support.
