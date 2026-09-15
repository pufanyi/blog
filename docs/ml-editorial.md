# ML Revisited editorial principles

These principles apply to the series under `content/posts/ml/ml-revisit/`.

- The RL notes are one article at `rl/index.mdx`. Their Typst source and original
  bibliography remain under `tmp/typst-originals/`; preserve the later policy
  gradient revisions when consulting that older source. Keep unfinished sections
  marked as pending unless the author asks to complete them.
  Motivate REINFORCE by distinguishing the full trajectory integral from one
  sampled integrand value, then derive its unbiased gradient estimator once.
  The GAE section is a complete tutorial: introduce rollout horizons and their
  mixture before the estimator, keeping bias definitions in supplementary details.

- Diffusion and its RL post-training chapter use increasing generation time: noise at
  `t=0`, data at `t=1`. Keep discrete DDPM noising indices explicitly separate.
  Distinguish conditional training pairs from marginal sampling trajectories,
  continuous-time ODE/SDE equivalence from finite-step errors, and CPS coefficient
  preservation from exact marginal sampling. In diffusion RL, distinguish joint
  Gaussian density ratios from dimension-averaged or variance-rescaled surrogates.
  Keep RL for diffusion models, including Flow-GRPO, DanceGRPO, CPS, and their
  figures and references, in `diffusion/index.mdx` after the sampling foundations.
  The RL article keeps a short entry linking to that chapter. Preserve legacy
  RL section anchors and the Diffusion reinforcement-learning and CPS anchors.
  Derive DDPM's reverse mean and variance from the known-image posterior before
  substituting the learned noise prediction. Distinguish posterior variance from
  other sampler variance choices, and mathematical step numbers from array indexes.

- The visual SSL overview is one long article at `ssl/index.mdx`, with shared
  SVG primitives in `ssl/scripts/elements.tsx` and styles in `ssl/styles.css`.
  Its former article and directory URLs redirect through `BLOG_REDIRECTS` in
  `src/app/utils/blog-redirects.ts`, shared by client routes and prerendering.
  Keep section anchors stable when reorganizing the article.

- Muon diagrams distinguish the outer training step from the internal
  Newton–Schulz iterations. Keep the saved momentum upstream of the matrix
  transform and show decoupled weight decay bypassing it. The spectrum plots
  distinguish ideal polar factors from the actual finite-step approximation.

- Write for readers with some machine-learning or LLM background who may be
  encountering the specific topic for the first time. The series should support
  both initial learning and review. Briefly establish necessary prerequisites
  and introduce the terms needed to follow the explanation.
- Use courses and papers to develop a coherent explanation for students.
  Organize the prose around the reader's questions, mechanisms, and worked
  examples; explain the subject directly instead of narrating how different
  lecturers teach it. Keep attribution beside the relevant idea and collect
  optional reading resources separately. Multiple perspectives should reveal
  connections within the subject, not become a comparison of teaching materials.
- Use plain language, concrete examples, and intuition to explain the problem
  and how the mechanism works. Connect the reasoning steps and explain what
  equations mean, so a first-time reader can follow the argument.
  Establish the problem, then introduce each prerequisite before using it in
  the mechanism. Introduce new formalisms through concrete operations: explain
  what changes, what should be preserved, and how a proposed correction achieves
  that. Naming the operation or citing an identity is not a substitute for this
  connection. Let the goal and constraints lead to the equation before presenting
  it as a result; integrate the motivation into the derivation instead of appending
  a separate explanation after an unexplained formula. Prefer a guided design over
  a recipe: let each step solve a need or failure revealed by the previous step,
  contrast it with the simplest plausible alternative, and assemble the final
  algorithm only after its parts are motivated. When a first-principles derivation
  would overwhelm the main explanation, give enough operational or geometric
  intuition for readers to understand why every essential operation is present
  and what would change without it. Do not add a heading for every reasoning step.
  Keep long
  derivations and implementation refinements in native `<details>` when they
  would interrupt the main explanation.
- Preserve substantial technical content and rigor: mechanisms, assumptions,
  essential equations, tradeoffs, and practical implications. Make this content
  easier to follow through clear explanations and visual support.
- Keep prose concise and focused. Remove repetition and unnecessary background
  while retaining the intermediate reasoning a first-time reader needs.
  For wording corrections, fix the specific ambiguity without expanding
  familiar basics into a tutorial or adding redundant examples.
- Choose the medium with the greater explanatory value. Use figures generously
  where spatial relationships, concrete vision examples, training flows, tensor
  layouts, or comparisons become clearer visually; do not require a figure for
  every mechanism. Keep definitions, reasoning, and caveats in prose when that
  is more direct. Information density means useful relationships a reader can
  grasp, not the number of labels squeezed into a figure.
  For vision examples, show what the model actually sees and must predict.
  Derive related crops or masks from the same scene, mark their source regions,
  and distinguish illustrative images and values from real model outputs.
  In training flows, distinguish per-example predictions from batch-computed
  targets, show which view supervises which prediction, and identify where
  gradients stop. Use short prose to explain assumptions and what to notice;
  avoid repeating every visible step. Keep essential equations in the main
  flow and put longer derivations or implementation refinements in `<details>`.
  Preserve rigor and attribution, and provide meaningful figure descriptions
  for Markdown exports and accessible reading. Follow the [Post Diagrams conventions](../content/AGENTS.md#post-diagrams).
