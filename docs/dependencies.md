# Dependency policy and exceptions

Use Node 24.21.0 from `.nvmrc`, pnpm 12.6.0 from `package.json`, and
`pnpm install --frozen-lockfile`. Update
`package.json`, `pnpm-lock.yaml`, relevant install-script permissions, CI, and
operator instructions together when their workflow changes. Confirm peers,
checks, unit tests, a production build, and affected browser behavior.

Keep `@types/node` on the Node 24 line and TypeScript on 6.0.x while Angular 22
requires `>=6.0 <6.1`. A newer TypeScript major is not a compatible update yet.

`pnpm-workspace.yaml` is the single owner of dependency exceptions. Exact
exceptions are deliberate review points, not a general bypass for future
versions. Review them when updating their parent dependency.

| Exception | Recorded reason and removal criterion |
| --- | --- |
| `allowBuilds` exact versions | Allow the installed native/build tools: Parcel watcher, esbuild, LMDB/msgpack extraction, and workerd. Authorize only versions needed by the resolved lockfile; remove stale entries when no installed dependency requires them. Both esbuild 0.28.1 and 0.28.2 are currently transitive dependencies. |
| Angular build/CLI/SSR 22.2.0 | Builds on the 22.1.8 SQLite cache serialization fix. See [cache evidence](maintenance/angular-cache.md). Keep framework/build peer ranges compatible on later upgrades. |
| MathJax and NewCM font 4.1.3 exact dev dependencies | Build-time article formulas, published local fonts, and deterministic real-browser assets matching the production CDN URL. Builds require dev dependencies. Update renderer, fonts and runtime/test versions together; retain the [WebKit worker regression](maintenance/mathjax-webkit.md). |

The older SDK, Hono Node server, and Rollup overrides, `listr2` peer exception,
and release-age exclusions were removed after the September 2026 refresh resolved
compatible versions without them. Keep any future exception tied to a reproduced
problem and review it with its parent dependency.

Do not infer upgrade safety from an install alone. Preview Cloudflare routing
when changing Wrangler/workerd; verify PDF canvases, engine assets, and the CMYK
profile when changing the PDF viewer; verify generated citations/Markdown and
article-local components when changing MDX/rendering packages.
