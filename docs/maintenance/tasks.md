# Maintenance task list

Work proceeds in dependency order. Every item includes implementation and its targeted verification; final integration includes existing search/content changes.

- [x] T1 — Code quality: cover executable source with ESLint and compile Angular/templates in the check gate.
- [x] T2 — Code cleanliness: remove unused duplicate code and enforce consistent TypeScript/TSX/CSS formatting.
- [ ] T3 — Sustainable generation: preserve unchanged files and last successful outputs on generation failure.
- [ ] T4 — Maintainability: article-local styles/controllers with one lifecycle contract.
- [ ] T5 — Sustainable authoring: dependency-aware incremental generation, watching, and validated Angular caching.
- [ ] T6 — Performance: enforce served-route and cold-search resource budgets; measure improvements.
- [ ] T7 — Test quality: lifecycle/failure cases, real MathJax, representative WebKit regressions, and focused E2E organization.
- [ ] T8 — Documentation/integration: scoped instructions, clear operator workflow, complete checks/unit/browser validation.

## Validation record

Record each completed task's commands, outcomes, and remaining limitations here.

### T1 — Complete

ESLint now covers `.ts`, `.mts`, `.tsx` and Angular templates, excluding generated output. `pnpm check` includes `ngc --noEmit` for the application and strict templates. New lint findings were corrected without changing rendered content. A temporary invalid template binding was rejected by the new gate and removed. `pnpm check` and all 116 unit tests passed.

### T2 — Complete

Removed the unused duplicate collective diagram and unused Prettier configuration. Biome covers application/tooling/test TypeScript, article TSX, CSS, and root JSON configuration (210 files). All 97 generated article texts, code blocks, formulas, and TOCs matched the audit baseline. Checks and all 116 unit tests passed.
