# Maintenance task list

Work proceeds in dependency order. Every item includes implementation and its targeted verification; final integration includes existing search/content changes.

- [x] T1 — Code quality: cover executable source with ESLint and compile Angular/templates in the check gate.
- [x] T2 — Code cleanliness: remove unused duplicate code and enforce consistent TypeScript/TSX/CSS formatting.
- [x] T3 — Sustainable generation: preserve unchanged files and last successful outputs on generation failure.
- [x] T4 — Maintainability: article-local styles/controllers with one lifecycle contract.
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

### T3 — Complete

Generation builds all representations before publishing. Dedicated output trees preserve identical files and roll back replacements after an I/O failure. Removed outputs are pruned only after successful staging. JSDOM ownership is explicit in rendering/search extraction, and CV YAML receives field-level validation. Tests cover unchanged mtimes, stale-output pruning, cross-tree rollback, path confinement, CV errors, and a late Markdown-export failure. The real corpus regenerated with zero writes. Checks and all 122 unit tests passed.

### T4 — Complete

All article-specific diagram CSS now lives in each article's `styles.css` and is included only in its rendered HTML. Static rendering and same-document SVG fragment URLs are preserved. Post clients and their shared numerical model are article-local; generated loaders use one `enhancePost`/cleanup contract. Build-only CSS/TypeScript is excluded from published assets. Async lifecycle tests cover late imports, failed imports, cleanup errors, and idempotent disposal. Browser tests cover static CSS, removal on navigation, real controller disposal, and private source paths. Checks, 124 unit tests, production build, and 56 browser tests passed (2 intentional skips). Preview ports are configurable and tests never reuse an unrelated running server.
