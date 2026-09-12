# Project working agreements

Keep these notes current. When work reveals a durable lesson, update its owning
instruction or document as part of the task; revise or remove stale guidance
instead of accumulating unrelated rules here.

## Scope and workflow

- Use `pnpm` and the Node/pnpm versions declared by the repository. Install with
  `pnpm install --frozen-lockfile`.
- Inspect `git status`, history, and diffs before changing shared work. Preserve
  unrelated edits. Use an isolated worktree with its own dependencies for
  concurrent validation; do not share a `node_modules` symlink or copy another
  task's partially edited live tree.
- Run lifecycle commands sequentially: generation writes shared output and pnpm
  can relink dependencies. `pnpm check` and `pnpm test --watch=false` must both
  pass after the final code/content change before every push. Check does not
  run tests or a production build. Re-run both if anything changes afterward.
- Prefer English for code/configuration comments and developer documentation.
  Preserve author-owned prose unless the task requests rewriting it.
- Restrict prose searches to `*.mdx` (and `*.bib` when needed); SVGs may embed
  large base64 images.
- Use the semantic Morandi colors in `src/styles/morandi.css`.

## Commands

| Task | Command |
| --- | --- |
| Develop with automatic content/config watching | `pnpm start` |
| Generate once | `pnpm generate:data` |
| Format, lint, Angular/template and strict TS checks | `pnpm check` |
| Noninteractive content and application tests | `pnpm test --watch=false` |
| Production build with prerender/deployment output | `pnpm build` |
| Production browser regressions | `pnpm test:e2e` |
| Format source / bibliography | `pnpm biome:write` / `pnpm format:bib` |

## Read the relevant guidance

- Authored posts, CV, diagrams, and citations: [content/AGENTS.md](content/AGENTS.md).
  The ML series additionally uses [editorial principles](docs/ml-editorial.md).
- Tooling, watchers, validation, or CI: [development](docs/development.md).
  Keep lifecycle-hooked and `*:generated` commands aligned; the final required
  CI `check` must require both quality and browser jobs to succeed.
- Generation, routes, metadata, article lifecycle, Markdown/feeds, PDFs, or
  hosting: [architecture and contracts](docs/architecture.md).
- Dependency/configuration exceptions: [dependency policy](docs/dependencies.md).
- Browser setup problems: [local troubleshooting](docs/browser-troubleshooting.md).
- Historical findings and completion evidence: [audit](docs/audits/2026-09-12-maintainability.md)
  and [ordered maintenance tasks](docs/maintenance/tasks.md).

## Essential boundaries

- Authored sources live in `content` and `configs`. `src/app/data` and
  `.generated` are ignored outputs; change sources, never generated files.
- Keep articles, styles, and browser examples together: article `styles.css`
  and `scripts/*.post-client.ts` are discovered automatically. Application
  components own shared presentation and generic attachment/cleanup only.
- Keep article bodies and the full-text corpus out of eager summaries/shell.
  Open the small search dialog before dynamically loading its engine/index.
- Preserve static HTML and Markdown meaning when adding interactivity. Dispose
  events, views, observers, and timers on navigation, including late imports.
- Assess performance on served production routes, including lazy/worker
  requests. Keep the resource budgets and real MathJax/WebKit regressions.
