# Simulation tutorial learning path — 2026-09-22

## Scope

Reorganized `content/posts/ml/notes/simulation-engines/index.mdx` around learning
robotics simulation, using a robot pushing a block throughout. The former
MuJoCo, Isaac Sim, Genesis, and Newton profiles and selection tables no longer
determine the chapter structure. Implementations now illustrate the relevant
representation, solver, system, and execution choices.

The sequence is state and observation, coordinates, dynamics and actuation,
time integration, collision detection, coupled contact, the assembled physics
kernel, deformable materials and coupling, sensors and scene data, batched
learning, differentiation, and validation/sim-to-real. New explanations connect
mass matrices to kinetic energy, stiffness to integration stability, contact
impulses to effective mass, XPBD corrections to compliance, and terminal losses
to trajectory adjoints. Minimal experiments connect the explanation to model
checking and parameter identification.

Existing authors, five build-time figures, and `private: true` are preserved.
The title, description, and substantive update date now reflect the domain
tutorial. No application code, client script, diagram source, or styling was
changed. The incorrect shared release URL block was removed together with the
product comparison framing. The bibliography has 21 cited sources.

The general domain-first rule was added to `docs/ml-editorial.md`, the owning
editorial guide. Writing, citation, article visibility, and rendering contracts
were reviewed and remain unchanged. In particular, the private article retains
its prerendered HTML route and must not acquire a public Markdown export.

## Research and numerical checks

Read the official online sources for the mechanisms retained or expanded:

- Tedrake's *Underactuated Robotics*, Multi-Body Dynamics: kinetic energy and
  manipulator equations, coordinate/velocity dimensions, and contact
  time-stepping. The online course-note landing page identifies Spring 2024;
  the bibliography cites the maintained chapter without inventing a newer term.
- MuJoCo computation, integration, simulation/data organization, and MJX
  documentation; retained the distinction between MJX-JAX differentiation and
  the non-autodiff MJX-Warp backend.
- PhysX articulation, solver iteration/TGS, and advanced collision documentation;
  distinguish iterations of a fixed discrete system from algorithms whose
  iterations include internal substeps.
- XPBD original paper, especially the compliant constraint equations and
  multiplier update on PDF pages 3–4.
- Genesis material, constraint, coupling, and differentiable simulation docs;
  retained solver/contact/coupler-specific gradient boundaries.
- Newton collision/contact documentation and the previously downloaded 1.6.0
  architecture/solver sources; implementation examples remain version-specific.
- Isaac Sim 6.1 scene/backend integration and Isaac Lab task concepts; Newton
  integration remains identified as experimental for that version.

Independent numerical checks verified the support impulse and sliding
acceleration, a two-contact coupled response, explicit-Euler oscillator energy
growth and semi-implicit stability bounds, the XPBD compliant constraint and
center-of-mass preservation, and a trajectory adjoint against central finite
differences. These are analytical tutorial examples, not engine benchmarks.
No simulator packages or four-engine performance experiments were run.

## Validation

Validation runs in the shared checkout from clean baseline `e5aa6b9`, with no
other worktree edits present, using Node 24.18.1 and pnpm 12.3.4. Lifecycle
commands run sequentially. Temporary evidence is under ignored
`tmp/simulation-restructure/`.

- `pnpm format:bib` completed; only the intended bibliography changed.
- `pnpm check` passed after the final article and bibliography changes.
- `pnpm test --watch=false` passed: 89 content tests and 200 application tests.
- `pnpm build` passed, prerendering 167 routes and preparing deployment output.
- Served `/blog/ml/notes/simulation-engines` in Chromium 151.0.7922.34 and
  WebKit 26.5 at 1280 and 390 CSS pixels, in light and dark themes. Traversed
  every chapter/subsection, followed a table-of-contents link, checked all TOC
  targets, opened all five native disclosures, and captured the opening,
  figures, integration, gradient, and validation sections. Representative
  desktop and narrow screenshots were visually inspected.
- All four browser/width combinations contained 239 static math containers,
  five figures, five disclosures, and 21 bibliography entries. No page errors,
  broken bibliography targets, undefined TeX, MathJax error nodes, empty SVG
  titles, raw caption formulas, or document-level horizontal overflow were found.
- Normal reading did not load the browser MathJax engine or worker. Startup
  and full heading traversal were measured separately: approximately 0.5 s /
  1.4 s in Chromium and 4.9–5.3 s / 1.6 s in WebKit. These are local smoke-test
  timings, including font readiness, not controlled performance benchmarks.
- The private article has no public Markdown export. Its visibility setting
  and protected-route contract remain unchanged.
- `git diff --check` passed. No commit, push, or deployment was performed for
  this restructuring task.

Browser validation reused the existing temporary host-library, CJK font, and
Mesa configuration documented by earlier audits. No host configuration or
dependency changes were added to the repository. The preview used its own port
48765 and was stopped after review.
