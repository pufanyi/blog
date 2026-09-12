# Dependency policy and exceptions

Use the pinned Node/pnpm versions and `pnpm install --frozen-lockfile`. Update
`package.json`, `pnpm-lock.yaml`, relevant install-script permissions, CI, and
operator instructions together when their workflow changes. Confirm peers,
checks, unit tests, a production build, and affected browser behavior.

`pnpm-workspace.yaml` is the single owner of dependency exceptions. Exact
exceptions are deliberate review points, not a general bypass for future
versions. Review them when updating their parent dependency.

| Exception | Recorded reason and removal criterion |
| --- | --- |
| SDK 1.30.0, Hono Node server 2.1.0, Rollup 4.62.4 overrides | Introduced in `0a83d01` during a dependency update; the repository does not record a more specific rationale. No vulnerability claim is inferred. Remove individually when the parent dependency resolves a compatible version without the override and install/peer/build/browser validation passes. |
| `minimumReleaseAgeExclude` exact versions | Permit the listed selected releases through pnpm's release-age policy. Existing historical entries do not document individual reasons. Remove an exception once normal resolution accepts that version; do not replace exact entries with broad package exemptions. |
| `listr2: 10.2.2` allowed peer | Historical CLI dependency compatibility exception from `0a83d01`. Remove when the parent peer range accepts the installed version and strict peer validation succeeds. |
| `allowBuilds` exact versions | Allow the installed native/build tools: Parcel watcher, esbuild, LMDB/msgpack extraction, and workerd. Authorize only versions needed by the resolved lockfile; remove stale entries when no installed dependency requires them. Both esbuild 0.28.1 and 0.28.2 are currently transitive dependencies. |
| Angular build/CLI/SSR 22.1.8 | Repairs the reproduced SQLite cache typed-array serialization failure. See [cache evidence](maintenance/angular-cache.md). Keep framework/build peer ranges compatible on later upgrades. |
| MathJax and NewCM font 4.1.3 exact dev dependencies | Deterministic real-browser assets matching the production CDN URL. Update runtime and test versions together; retain the [WebKit worker regression](maintenance/mathjax-webkit.md). |

Do not infer upgrade safety from an install alone. Preview Cloudflare routing
when changing Wrangler/workerd; verify PDF canvases, engine assets, and the CMYK
profile when changing the PDF viewer; verify generated citations/Markdown and
article-local components when changing MDX/rendering packages.
