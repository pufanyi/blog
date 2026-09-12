# Deployment and production preview

The site is prerendered by Angular and hosted through Cloudflare Workers Static Assets. Documentation is built and deployed alongside the blog, with the same shell, theme, origin, and URL conventions.

## Build and inspect

```bash
pnpm build
pnpm preview
```

The build generates source-derived modules first, prerenders routes, then prepares deployment metadata. The Node preview serves `dist/blog/browser` at `http://127.0.0.1:4173/` by default. It is useful for inspecting the production application but cannot reproduce every Cloudflare asset redirect.

For actual Worker/static-asset behavior after building:

```bash
pnpm preview:cloudflare
```

This starts local Wrangler at `http://127.0.0.1:8787/`. Use the Cloudflare Playwright project to check route handling and HTTP behavior. Do not infer successful publication from a local preview: production changes become public only through the repository's configured deployment process.

## Build outputs and ownership

| Output | Produced from |
| --- | --- |
| HTML routes | Angular client/server routes and generated content metadata |
| `404.html` | The prerendered `/404` page |
| `_redirects` | `configs/redirects.yaml` |
| `sitemap.xml`, `robots.txt` | Prerender manifest, canonical URLs, and noindex metadata |
| `feed.xml`, `atom.xml` | Published article summaries and authored dates |
| Markdown exports and `llms.txt` | The same prose as HTML articles, CV, directories, and documentation |
| `dist/blog/markdown-routes.json`, `worker.mjs` | Prerendered Markdown alternate links and the shared request handler |

Never hand-edit generated files. The Worker entry and its map stay outside public static assets. A build validates that every advertised Markdown alternate exists.

## URLs, redirects, and missing pages

Canonicals use slashless URLs such as `/blog/notes/example` and `/docs/development`. Cloudflare `assets.html_handling` is `drop-trailing-slash`, so these canonical URLs must return 200 directly. Check direct visits as well as Angular navigation when adding a route.

Prerender every article, ancestor category, archive page, and documentation page from the same metadata used by the router. Redirect pages need prerendering when the static host must handle direct visits. Use the shared 404 experience for unknown paths, with `noindex` metadata and an actual HTTP 404 from the production host.

Sitemap generation excludes redirect and noindex pages. Article `lastmod` comes from `updated ?? date`; a build timestamp is not a content modification date. Documentation has no invented publication/update timestamps, so it has no article dates or `BlogPosting` structured data.

## Markdown negotiation and discovery

Every handbook page advertises its Markdown alternative. `/docs` uses `/docs/index.md`; other pages use `/docs/<slug>.md`. Article exports use `/blog/<slug>.md`; archive pages share `/blog/index.md`; homepage and CV share `/profile.md`.

```bash
curl -H 'Accept: text/markdown' http://127.0.0.1:8787/docs/development
```

Only an explicit preferred `text/markdown` accepts Markdown. Ordinary browser requests receive HTML. Negotiated responses use `Vary: Accept` and avoid shared caching keyed only by URL; the underlying HTML and Markdown assets retain separate caches. One-to-one article and documentation exports identify their HTML canonical, including direct GET/HEAD and conditional 304 responses. Shared archive and profile exports are not canonicalized to partial pages.

Keep `wrangler.jsonc` worker-first coverage and `public/_headers` MIME rules aligned for `/blog/*` and `/docs/*`. Missing `.md` URLs must return an HTML 404 with the correct MIME type; Cloudflare can otherwise apply the requested URL's Markdown header to its HTML fallback. PDF viewer `.mjs` and `.wasm` files need JavaScript and WebAssembly MIME types in preview too.

## Release checks

Run check and noninteractive unit tests after the final change, then build and run the relevant production browser tests. Verify direct URLs, canonicals, internal documentation links, Markdown responses, feeds, and the custom 404. Review the actual source diff before pushing. Credentials and production deployment access belong to the existing repository environment; never add them to public documentation or static assets.
