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

## Tutorial writing principles

- Write for students learning or reviewing the subject. Assume relevant general
  background, but introduce the prerequisites and terms needed for this topic.
- Learn from authoritative courses and original papers, then build a coherent
  explanation in the article's own voice. Explain the subject directly;
  multiple perspectives should help readers understand the same mechanism.
  Avoid narrating how individual lecturers teach or organize their material.
- Start with the problem and explain why the method or derivation is needed.
  Connect the objective, mathematical quantities, and actual training or
  inference steps. Use a concrete worked example across these connections
  when it makes the reasoning easier to follow.
- Derive essential results once, explain their meaning, and refer back to them
  later. Preserve assumptions, equations, tradeoffs, and practical implications;
  put lengthy derivations and implementation refinements in `<details>` when
  they interrupt the main explanation.
- Turn review feedback into a standalone tutorial. Resolve the underlying
  conceptual gap without carrying the conversation, rebuttals, or a reader's
  personal mistake into the prose. Remove redundant explanations while keeping
  the intermediate reasoning a first-time reader needs.
- Use diagrams when they reveal useful relationships at a glance: concrete
  inputs and outputs, transformations, supervision, or training and sampling
  flows. Prefer vectors for technical diagrams. Keep prose when it is clearer;
  avoid decorative diagrams, paragraph-filled boxes, and unnecessary labels.
- Attribute methods, specific claims, and adapted figures beside the relevant
  idea. Keep optional reading separate from the explanatory narrative. Follow
  the detailed [ML editorial principles](docs/ml-editorial.md) and
  [content agreements](content/AGENTS.md) for the series and media conventions.

## Keep the handbook current

- Treat `docs/` as the human-facing source of truth, published at `/docs`. Update
  the relevant page in the same change as code, configuration, commands, tests,
  or authoring contracts. Use the [ownership map](docs/documentation.md#where-to-update).
- Review the owning guide even for internal refactors; explain in the change
  description when the documented contract is unchanged. Do not add meaningless
  documentation edits simply to satisfy a file-touch checklist.
- Register every handbook Markdown file in `docs/navigation.json`. Keep one
  source of prose, relative links, and stable headings; generation validates
  local document links and anchors. Preserve dated records as historical evidence.
