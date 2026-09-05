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
`content/posts/<slug>/index.mdx`; see `AGENTS.md` for content conventions.
`pnpm generate:data` rebuilds derived data, and also runs before start, build,
test, and check commands.

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
from `content/redirects.yaml`.

## Validation

```bash
pnpm check
pnpm test --watch=false
pnpm exec playwright install chromium
pnpm test:e2e
```

`check` runs script formatting, content/generator and browser-test typechecks,
Angular lint, and MDX/BibTeX checks. Unit tests cover content rendering and Angular
behavior. `test:e2e` builds production output and tests desktop/mobile Chromium:
search keyboard/focus behavior, Chinese queries, route metadata, scroll/history,
TOC anchors, prerendered 404 behavior, and deferred network loading.

Browser tests simulate delayed MathJax layout and stub analytics/comments so
third-party outages do not determine CI results. Inspect the served site with
real MathJax after changing formula rendering. CI runs the same validation and
uploads Playwright reports, screenshots, and traces on failure.
