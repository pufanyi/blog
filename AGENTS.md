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
  Every technical tutorial uses the detailed [editorial principles](docs/ml-editorial.md);
  the filename is retained for compatibility even though the guidance is no longer ML-only.
- Tooling, watchers, validation, or CI: [development](docs/development.md).
  Keep lifecycle-hooked and `*:generated` commands aligned; the final required
  CI `check` must require the quality job to succeed. Browser tests run locally
  when relevant and are not part of GitHub CI.
- Generation, routes, metadata, article lifecycle, Markdown/feeds, PDFs, or
  hosting: [architecture and contracts](docs/architecture.md).
- Dependency/configuration exceptions: [dependency policy](docs/dependencies.md).
- Browser setup problems: [local troubleshooting](docs/browser-troubleshooting.md).
- Agent investigations, plans, and completion evidence: [agent records](.agents/docs/README.md).

## Essential boundaries

- Keep feature implementation and tests together under `src/app/features`.
  Shared/platform code must not import feature or shell implementations; build
  code uses framework-free `src/contracts`. Route composition and the shell's
  small search launcher are explicit entry points, checked by `pnpm check:boundaries`.
- Route pages own scoped page-chrome registrations. Nested controls emit intent;
  they do not mutate global toolbar state. Layout rules belong to their paper or
  shell owner, without descendant-sensitive selectors changing ancestors.
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
- For math-heavy articles, measure real-engine startup and scrolling separately.
  Article formulas are build-rendered; ordinary reading must not load the browser
  engine or duplicate the initial body module. Right-click must preserve the
  static formula DOM, while copied selections retain TeX delimiters. Exercise the
  real engine on Angular-authored views that still contain raw TeX. Keep
  build-time TeX state article-local.
  Payload budgets alone miss layout/paint costs; lazy output can move stalls into
  scrolling. See the [runtime implementation record](.agents/docs/maintenance/2026-09-20-long-article-implementation.md)
  and [original investigation](.agents/docs/audits/2026-09-13-long-article-performance.md).
- Review long articles through the complete reading journey: navigation, text,
  continuity, media, and responsiveness. Keep runtime findings within the
  [reading design](.agents/docs/maintenance/long-article-reading.md), not as its substitute.

## Tutorial writing principles

- Write for students learning or reviewing the subject. Assume relevant general
  background, but introduce the prerequisites and terms needed for this topic.
- Default to lecture-note prose: enter the subject directly, organize by conceptual
  dependencies, and use definitions, mechanisms, examples, and diagrams to explain
  it. Avoid literary openings, invented stories, suspense, rhetorical question
  chains, and repeated explanations of why readers should learn the topic.
  Concision must preserve reasoning; it does not mean terse lists of unexplained terms.
- Learn from authoritative courses and original papers, then build a coherent
  explanation in the article's own voice. Explain the subject directly;
  multiple perspectives should help readers understand the same mechanism.
  Avoid narrating how individual lecturers teach or organize their material.
- State the subject or technical problem directly; explain a method's purpose
  where it clarifies the mechanism, without a mandatory motivational preamble.
  Connect the objective, mathematical quantities, and actual training or
  inference steps. Use a concrete worked example across these connections
  when it makes the reasoning easier to follow.
  Before introducing a new formalism, work through the operation it represents:
  what changes, what should be preserved, and why the proposed correction works.
  In tutorial prose, derive the formula from that goal and those constraints
  before presenting it as a result. Integrate the motivation into the derivation;
  avoid announcing an unexplained formula and adding a separate justification later.
  Explain dependencies and design choices directly, using a simple alternative
  where it helps establish a tradeoff. Do not force a discovery narrative around
  every definition or operation. If the full derivation is too
  involved, still give an operational or geometric intuition for every essential
  design choice instead of asking the reader to accept a recipe.
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
  the detailed [tutorial editorial principles](docs/ml-editorial.md) and
  [content agreements](content/AGENTS.md) for the series and media conventions.

## Keep the handbook current

- Treat `docs/` as the human-facing source of truth, published at `/docs`. Update
  the relevant page in the same change as code, configuration, commands, tests,
  or authoring contracts. Use the [ownership map](docs/documentation.md#where-to-update).
- Keep durable agent rules in the relevant `AGENTS.md`. Store detailed agent
  audits, plans, handoffs, and validation records in `.agents/docs/`, linked from
  its index. These records stay outside `docs/` and its public navigation.
- Review the owning guide even for internal refactors; explain in the change
  description when the documented contract is unchanged. Do not add meaningless
  documentation edits simply to satisfy a file-touch checklist.
- Register every handbook Markdown file in `docs/navigation.json`. Keep one
  source of prose, relative links, and stable headings; generation validates
  local document links and anchors. Preserve dated agent records as historical
  evidence in `.agents/docs/`.
