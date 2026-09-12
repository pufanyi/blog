# Maintaining documentation

Documentation is part of a change's completion criteria. Update the page that explains the affected behavior in the same change as the implementation, so authors and developers can follow the current workflow.

## Where to update

| Changed behavior | Owning documentation |
| --- | --- |
| Installation, commands, watchers, CI, source-tool ownership | [Local development](development.md) |
| Content compilation, caching, routes, metadata, lifecycle, exports | [Architecture](architecture.md) |
| YAML keys, defaults, and configuration behavior | [Configuration](configuration.md) |
| Test setup, coverage contracts, or quality gates | [Testing](testing.md) |
| Hosting, static routes, redirects, MIME, or negotiation | [Deployment](deployment.md) |
| Post layout, metadata fields, or article organization | [First post](writing/first-post.md) and [publishing](writing/publishing.md) |
| MDX syntax, math, media, controllers, or citations | The corresponding [writing guide](index.md#for-blog-authors) |
| Dependency exceptions or host-specific workarounds | [Dependencies](dependencies.md) or [browser troubleshooting](browser-troubleshooting.md) |
| Documentation renderer, navigation, links, or publication | This page |

Explain the trigger, resulting behavior, working commands/examples, and relevant limitations. Remove stale instructions rather than appending contradictory notes. Keep agent-specific rules concise in [`AGENTS.md`](../AGENTS.md) and [`content/AGENTS.md`](../content/AGENTS.md); link them to the human-facing handbook.

An internal refactor with unchanged contracts may need no prose change. Review the relevant page and state why no documentation update is needed in the change description. A file-touch requirement alone cannot establish that documentation is accurate.

## Add or reorganize a page

1. Add a Markdown file under `docs/` with a descriptive lowercase path, such as `writing/new-topic.md`. Start with exactly one `#` title and a concise opening paragraph; these supply navigation and metadata.
2. Register its repository-relative path in the appropriate group in [`navigation.json`](navigation.json). The first entry is `index.md`; nested `index.md` filenames are reserved. Every Markdown file must appear exactly once.
3. Use `##` and `###` sections for generated anchors and the page table of contents. Use relative Markdown links, for example `../development.md#commands`. Keep links usable in the repository as well as the website.
4. Link the new guide from its related guide or landing page. Keep one topic per page and avoid copying existing explanations.
5. Run `pnpm generate:data`, inspect `/docs/<path-without-md>`, then run the relevant checks. A route or rendering change also needs a production build and browser tests.

Existing maintenance reports remain under their original filenames. Treat dated audits and completed task records as historical evidence; correct current guides when behavior changes. Do not rewrite an old measurement to imply it was measured on new code.

## Rendering and links

`scripts/lib/docs.mts` compiles GitHub-flavored Markdown using the already-installed Marked renderer. Documentation does not execute MDX components. Put JSX, TeX, and article syntax examples in fenced blocks. Code highlighting and heading IDs reuse the blog's build-time helpers; typography, code blocks, and tables reuse its styles. The shared paper width can be adjusted through `--paper-max-width`; documentation uses a wider desktop paper for its sidebar. Tables retain a readable minimum width and scroll inside a focusable region on narrow screens.

The generator validates navigation coverage, titles, relative documentation links, and section fragments before publishing outputs. Relative repository links outside `docs/` must exist and are rewritten to the configured repository source URL. Its `sourceUrl` is the repository's browsable branch root, currently GitHub's `blob/main` URL. Update it when moving or forking the repository. Linked repository directories use the corresponding tree URL.

External URLs are preserved; generation does not crawl the internet or validate their content. Site-absolute links outside `/docs` also remain unchanged. The checker validates document heading fragments, not fragments in external source files. Prefer relative document links so the generator can catch renames and typos.

Only files registered in the public documentation navigation are pages; navigation requires all Markdown files under `docs/` to be registered. Keep private notes and credentials outside this directory. Supporting source/configuration links open the repository instead of publishing arbitrary repository files as site assets.

## Generated data and browser behavior

The existing `build-posts.mts` orchestrator includes `docs/` in its input fingerprint and publishes document modules and Markdown exports in the same transaction as blog content. Generation failure retains the previous published output. Unchanged sources reuse the manifest while rechecking linked repository paths, so a deleted source file still produces a broken-link error with a warm cache. Deleted documents prune their generated pages/modules on the next build.

`src/app/data/docs.ts` contains small summaries. `doc-loaders.ts` maps each page to a dynamic import under `data/docs/`; the full handbook stays out of the eager shell and blog search corpus. The `/docs` route loads the handbook navigation and only the requested body. The local navigation filter searches page titles/descriptions; the global search control continues to search blog articles.

The page includes grouped navigation, a mobile disclosure, a table of contents, previous/next links within its group, and links to the source and Markdown export. Plain links and initial content work in prerendered HTML without JavaScript. Browser enhancement handles internal document navigation and code-copy buttons and removes its listeners on navigation.

## Keeping it current during development

`pnpm start` and `pnpm watch` watch `docs/` as well as content, configuration, and compiler inputs. Saving documentation regenerates the same source-backed pages; there is no second manual HTML copy. Invalid documentation reports an error and leaves the last successful output available until corrected.

Automatic rebuilding does not write explanations for changed behavior. The contributor making the code change owns the accompanying handbook update, and the review checklist records that decision. Production receives both together on the next deployment. See [deployment](deployment.md) for canonical URLs, sitemap discovery, Markdown MIME, and negotiation.
