# ML Revisited editorial principles

These principles apply to the series under `content/posts/ml/ml-revisit/`.

- The RL notes are one article at `rl/index.mdx`. Their Typst source and original
  bibliography remain under `tmp/typst-originals/`; preserve the later policy
  gradient revisions when consulting that older source. Keep unfinished sections
  marked as pending unless the author asks to complete them.
  Motivate REINFORCE by distinguishing the full trajectory integral from one
  sampled integrand value, then derive its unbiased gradient estimator once.

- The visual SSL overview is one long article at `ssl/index.mdx`, with shared
  SVG primitives in `ssl/scripts/elements.tsx` and styles in `ssl/styles.css`.
  Its former article and directory URLs redirect through `BLOG_REDIRECTS` in
  `src/app/utils/blog-redirects.ts`, shared by client routes and prerendering.
  Keep section anchors stable when reorganizing the article.

- Write for readers with some machine-learning or LLM background who may be
  encountering the specific topic for the first time. The series should support
  both initial learning and review. Briefly establish necessary prerequisites
  and introduce the terms needed to follow the explanation.
- Use plain language, concrete examples, and intuition to explain the problem
  and how the mechanism works. Connect the reasoning steps and explain what
  equations mean, so a first-time reader can follow the argument.
  Establish the problem, then introduce each prerequisite before using it in
  the mechanism. Do not add a heading for every reasoning step. Keep long
  derivations and implementation refinements in native `<details>` when they
  would interrupt the main explanation.
- Preserve substantial technical content and rigor: mechanisms, assumptions,
  essential equations, tradeoffs, and practical implications. Make this content
  easier to follow through clear explanations and visual support.
- Keep prose concise and focused. Remove repetition and unnecessary background
  while retaining the intermediate reasoning a first-time reader needs.
  For wording corrections, fix the specific ambiguity without expanding
  familiar basics into a tutorial or adding redundant examples.
- Use illustrations generously when they make an idea clear at a glance.
  Make diagrams the primary explanation for model architectures, training flows,
  tensor layouts, and comparisons. Introduce each major mechanism with a visual
  that readers can follow before reading its equations: show inputs, intermediate
  representations, prediction targets, and gradient or parameter-update paths.
  Use short prose to connect the visual to the problem and explain essential
  assumptions or tradeoffs; remove prose that merely repeats visible steps.
  Keep only equations needed to read the mechanism in the main flow, with full
  objectives, derivations, and implementation refinements in native `<details>`.
  Preserve rigor and attribution. Prefer actual spatial or data relationships to
  paragraphs placed inside boxes, and provide meaningful diagram descriptions
  for Markdown exports and accessible reading. Follow the [Post Diagrams conventions](../content/AGENTS.md#post-diagrams).
