# Blog

Fanyi Pu's Angular blog, with MDX posts, build-time citations and diagrams,
prerendered routes, and a shared Morandi theme.

## Development

Use the Node version in `.nvmrc` and pnpm version in `package.json`.

```bash
pnpm install
pnpm start
```

The development server runs at `http://localhost:4200/`. Posts live in
`content/posts/<slug>/index.mdx`, where `<slug>` is the full relative path (for
example, `oi-icpc/codeforces/cf551c`). Articles use `/blog/<slug>`; ancestor
directories such as `/blog/contents/oi-icpc` list their immediate folders and
posts. `/blog/contents` is the root directory. Folder dates use the latest
descendant article's publication `date`, ignoring `updated`.
`/blog` remains the paginated archive.
See `AGENTS.md` for content conventions.
`pnpm generate:data` rebuilds derived data, and also runs before start, build,
test, and check commands.

Site settings live in [`configs/`](configs/README.md): archive page size and
display options, site metadata and citation authorship, footer, comments, and
redirects. The default archive page size is 10. After editing YAML while the
development server is running, run `pnpm generate:data` to refresh the app.

Node tooling and executable configuration use `.mts`; Angular/shared code uses
`.ts`, and authored JSX uses `.tsx`. Standalone scripts run directly on Node 24.
MDX generation and its tests use `tsx` to load the post-local JSX components.
All tooling, configuration, and script tests are included in strict typechecking.

ESLint loads `eslint.config.mts` with `jiti`. Remark finds `.remarkrc.json` and
loads its `remark.config.mts` preset, keeping plugin configuration in TypeScript.

## Content and page lifecycle

- `scripts/build-posts.mts` orchestrates generation; `scripts/lib/mdx-renderer.mts`
  compiles MDX, citations, highlighted code, and the table of contents.
- Generated files under `src/app/data` are ignored by Git. `posts.ts` contains
  summaries, `posts/<slug>.ts` contains one article body and TOC, and
  `post-loaders.ts` provides dynamic imports. Routes resolve articles through
  `src/app/services/post-repository.ts`.
- Search loads when its modal opens. Its generated plaintext documents and
  serialized FlexSearch index use the same Chinese/English tokenizer as browser
  queries; ordinary page visits do not load that index or all article bodies.
- `PostComponent` composes the page. `PostContentDirective` enhances the rendered
  body and owns cleanup; `PostNavigationComponent` owns the TOC drawer/sidebar.
  MathJax is requested only when a rendered view contains TeX.
- `PageMetadataStrategy` updates titles, descriptions, canonical links, and share
  metadata in both browser navigation and prerendered HTML. `PageScrollService`
  restores reading positions and anchors after asynchronous layout changes.

## Production preview

```bash
pnpm build
pnpm preview
```

The preview serves `dist/blog/browser` at `http://127.0.0.1:4173/`, including the
generated custom `404.html`. The build also generates Cloudflare `_redirects`
from `configs/redirects.yaml`.

The Cloudflare deployment uses Workers Static Assets. Postbuild derives a
Markdown route map from prerendered `rel="alternate"` links, validates each
export, and writes the Worker entry outside the public asset directory.
`wrangler.jsonc` runs that Worker before the relevant page routes. Use
`pnpm preview:cloudflare` to test the actual Cloudflare runtime at
`http://127.0.0.1:8787/` after building.

Agents can request the generated Markdown directly at the original page URL:

```bash
curl -H 'Accept: text/markdown' http://127.0.0.1:8787/blog/cf77c
```

Home and CV requests return `/profile.md`, blog archive pages return
`/blog/index.md`, and article pages return `/blog/<slug>.md`. The response is
the existing export, including formulas, code, references, and asset links.
Clients must explicitly prefer `text/markdown`; requests without that preference
receive HTML and HTTP `Link` headers advertising the Markdown and `/llms.txt`.
Both variants include `Vary: Accept` and prevent shared caching of the negotiated
URL; the underlying files retain Cloudflare's separate static asset caches.
Article Markdown responses also provide an HTTP `rel="canonical"` pointing to
the HTML article. Cloudflare serves canonical HTML URLs without trailing slashes
directly, matching page metadata and the sitemap.

Homepage and CV pages publish `ProfilePage`/`Person` JSON-LD generated from the
existing CV, including its bilingual name and external profile links. Article
authors refer to the same `/#person` identity.

## Article updates and feeds

Use an optional authored `updated` date for substantive article changes:

```yaml
title: Example article
date: "2026-08-01"
updated: "2026-09-08"
description: An example article.
```

The generator validates calendar dates and rejects updates before publication.
The same date appears on the article and in its Markdown, `dateModified`, and
sitemap `lastmod`. Omit `updated` when the historical modification date is
unknown; build times and migration commits are not content modification dates.

`/feed.xml` (RSS 2.0) and `/atom.xml` (Atom 1.0) include summaries and links for
all published articles, sorted by `updated` or the original publication date.
Entries retain stable article IDs when updated. Both include links to Markdown;
Atom explicitly distinguishes publication and update dates. The feed timestamp
uses the latest known article date. Feeds require at least one published post
with a date and are regenerated with the other content assets.
Subscribe through the footer links or discover the feeds in HTML metadata and
`/llms.txt`.

## Validation

```bash
pnpm check
pnpm test --watch=false
pnpm exec playwright install chromium
pnpm test:e2e
```

`check` runs tooling formatting, content/tooling and browser-test typechecks,
Angular lint, and MDX/BibTeX checks. Unit tests cover content rendering and Angular
behavior. `test:e2e` builds production output and tests desktop/mobile Chromium:
search keyboard/focus behavior, Chinese queries, route metadata, scroll/history,
TOC anchors, prerendered 404 behavior, and deferred network loading.
The Cloudflare project verifies HTTP discovery and content negotiation against
the local Worker, including all published Markdown exports and missing routes.

Browser tests simulate delayed MathJax layout and stub analytics/comments so
third-party outages do not determine CI results. Inspect the served site with
real MathJax after changing formula rendering. CI runs the same validation and
uploads Playwright reports, screenshots, and traces on failure.
