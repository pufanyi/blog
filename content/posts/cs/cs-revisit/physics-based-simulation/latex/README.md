# Physics-Based Simulation LaTeX Template

LaTeX book template for studying and translating [*Physics-Based Simulation*](https://phys-sim-book.github.io/) (Version 1.0.3) into Chinese using XeLaTeX (`ctexbook`) and Biber (`biblatex`).

## Directory Structure

```text
latex/
├── main.tex                  # Master book file (full 9-part, 37-chapter outline)
├── phys-sim-book.sty         # Layout, Morandi palette, callout boxes, listings, algorithms
├── macros.tex                # Physics-based simulation math notation macros
├── references.bib            # BibLaTeX bibliography (seeded with li2026physics)
├── .latexmkrc                # XeLaTeX + Biber config (outputs to build/)
├── Makefile                  # Convenience build targets
├── figures/                  # Chapter figures (referenced without the figures/ prefix)
└── chapters/
    ├── 00-preface.tex
    └── part01-optimization/
        └── ch01-discrete-space-and-time.tex
```

## Build

Requires a TeX distribution with XeLaTeX, `ctex`, `tcolorbox`, `algorithm2e`, `listings`, `biblatex`, and `biber` (TeX Live 2023+ or MacTeX recommended).

```bash
# Build PDF to build/main.pdf
make

# Watch for changes and recompile automatically
make watch

# Remove auxiliary files (keep build/main.pdf)
make clean

# Remove the entire build/ directory
make distclean
```

You can also invoke `latexmk main.tex` directly, or upload this directory to Overleaf with compiler set to **XeLaTeX**.

## Workflow Tips

- **Incremental chapters**: `main.tex` lists all 9 parts and 37 chapters from the original book. Uncomment `\include{...}` as you create each chapter file.
- **Fast single-chapter compilation**: Uncomment `\includeonly{...}` in `main.tex` to compile only the chapter you are currently translating while keeping cross-references intact.
- **Environments**:
  - Math: `definition`, `theorem`, `lemma`, `proposition`, `corollary`, `example`, `remark`
  - Notes & summaries: `studynote`, `transnote`, `warningbox`, `summarybox`
  - Helpers: `\term{中文}{English}`, `\eng{English}`, `\todo{...}`
- **Print layout**: Change `oneside,openany` to `twoside,openright` in `\documentclass[...]{ctexbook}` inside `main.tex`.
