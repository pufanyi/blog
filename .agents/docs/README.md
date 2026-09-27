# Agent working records

This directory holds investigations, implementation plans, and validation evidence for agents working on the repository. It is not part of the published `/docs` handbook. Durable instructions belong in the relevant `AGENTS.md`; current author and developer workflows belong in [`docs/`](../../docs/index.md).

## Active work

- [Compression modernization research — 2026-09-24](audits/2026-09-24-compression-modernization.md): live compression/cache headers, asset inventory, and prioritized optimization candidates.
- [Long article rendering review — 2026-09-20](audits/2026-09-20-long-article-rendering.md): current production measurements, body delivery/hydration findings, and rendering recommendations.
- [Long article reading experience](maintenance/long-article-reading.md): reader-journey findings, the interface proposal, and its ordered implementation tasks.
- [Long article runtime investigation — 2026-09-13](audits/2026-09-13-long-article-performance.md): production measurements and runtime follow-ups supporting the reading proposal.

## Historical evidence

- [Dependency refresh — 2026-09-27](maintenance/2026-09-27-dependency-refresh.md): Node/pnpm and package updates, exception cleanup, isolated baseline comparison, and validation boundaries.

- [CS Revisited: Computer Networks 01 — 2026-09-26](audits/2026-09-26-cs-revisit-networks.md): FA26 weeks 1–4 coverage, protocol-source boundaries, nested series organization, and article validation.

- [Offscreen world simulation tutorial — 2026-09-24](audits/2026-09-24-offscreen-world-simulation.md): problem-first large-world tutorial, primary-source research on streaming, simulation, networking and persistence, article revisions, and owner-only Cloudflare Access setup.
- [Compression implementation — 2026-09-24](maintenance/2026-09-24-compression-implementation.md): icon and diagram reductions, cache policy, delivery diagnostics, and isolated reproduction of pre-existing budget failures.
- [RL score-centering chapter — 2026-09-22](audits/2026-09-22-rl-score-centering.md): source verification, baseline/IS/BPO distinctions, numerical examples, and isolated article validation.
- [ViT model explanations — 2026-09-22](audits/2026-09-22-vit-model-explanations.md): independent model chapters, original-source verification, compression diagrams, and validation evidence.
- [Modern communication protocols tutorial — 2026-09-22](audits/2026-09-22-modern-communication-protocols.md): course/specification source boundaries, worked examples, and article validation.
- [Simulation tutorial learning path — 2026-09-22](audits/2026-09-22-simulation-domain-tutorial.md): domain-first restructuring, source checks, numerical examples, and validation evidence.
- [Media compression course integration — 2026-09-22](audits/2026-09-22-media-compression.md): actual lecture reading, tutorial coverage, numerical examples, and validation evidence.
- [Long article implementation — 2026-09-20](maintenance/2026-09-20-long-article-implementation.md): static formulas, initial DOM adoption, deferred enhancements, runtime tradeoffs and validation scope.
- [Robotics simulation article — 2026-09-20](audits/2026-09-20-robotics-simulation.md): official-source research boundaries and isolated content, build, and browser validation.
- [Maintainability audit — 2026-09-12](audits/2026-09-12-maintainability.md): the original baseline before maintenance fixes.
- [Completed maintenance tasks](maintenance/tasks.md): implementation outcomes, validation snapshots, and their limits.

Preserve the commit, date, and scope of recorded observations. Update the owning instructions or handbook when behavior changes; old validation does not cover later edits. Keep raw logs and temporary prototypes in ignored `tmp/` directories, and link new retained records from this index.
