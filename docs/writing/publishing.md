# Publishing and updating posts

Content is published with the application build. A local edit changes the development preview; readers of the public site see it only after the production deployment completes.

## Before committing

1. Review the diff and preserve unrelated author edits. Check the title, publication date, relative asset paths, and optional update date.
2. Run `pnpm generate:data` and open the article directly. Check its archive/category entries and the Markdown alternative at `/blog/<slug>.md`.
3. Inspect narrow and desktop widths in both themes. Check wide formulas and tables, image descriptions, citations, downloads, and embedded content.
4. Run `pnpm check` and `pnpm test --watch=false` sequentially. Run the relevant production browser tests when changing rendering, diagrams, interaction, or hosting.
5. Update the relevant handbook page if the change introduces a new authoring convention, configuration option, workflow, or reusable limitation.

Checks and tests regenerate content automatically. A successful typecheck does not prove browser layout is correct, and `pnpm check` does not run tests. See [testing](../testing.md) for selecting additional validation.

## Updating an existing article

Preserve the original `date`. Add or change `updated` for a substantive content revision, using the actual known date. The same value appears on the page, in Markdown, article structured data, sitemap, and feeds. Leave unknown historical dates unset; do not use migration commits or filesystem timestamps.

Keep existing prose author-owned. Make the requested correction without rewriting surrounding material unless the author asks. Prefer stable section headings and explain new conventions in the handbook when other authors will need them.

## Renaming or moving an article

The full directory path defines the article URL. Before moving it, identify incoming links, old URLs, and any `/posts/<old-slug>/...` strings in components or CSS. Markdown image paths are rewritten automatically; absolute asset links in source code and styles need explicit updates.

Choose and test a redirect from the old URL. External legacy path redirects are configured in `configs/redirects.yaml`; internal blog route migrations also have shared mappings in `src/app/utils/blog-redirects.ts`. Consult [routing and deployment](../deployment.md) before adding a redirect so both client navigation and direct static visits work. Rebuild and verify the old URL, new canonical, and affected heading fragments.

## Drafts and removal

Set `draft: true` to omit an article from generated article pages, summaries, search, Markdown, and feeds. Remove the article directory when intentionally removing its public attachments as well. Non-excluded files in draft directories can still be published as assets.

Generation prunes obsolete generated modules and exports. A full production build must follow content removal so the deployed static output reflects the change. Decide how old incoming URLs should behave: a deliberate redirect or the shared 404 page.

## Deployment handoff

Use [deployment and production preview](../deployment.md) to build and inspect the exact output. Before every push, both `pnpm check` and `pnpm test --watch=false` must pass after the final change. CI also runs browser regressions. Publishing uses the existing repository deployment workflow; this checklist does not replace its credentials or branch configuration.
