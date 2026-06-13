# AGENTS.md

Project guidance for agents working in this repository.

## Version Control

- This repository is a colocated Jujutsu workspace backed by Git. The `.git`
  directory is still present for Git interoperability, but day-to-day repository
  operations should use `jj`.
- Check state with `jj status`.
- Inspect history with `jj log`.
- Inspect changes with `jj diff`.
- Manage branches/bookmarks with `jj bookmark`.
- Sync through Git remotes with `jj git fetch` and `jj git push`.
- Use `git` directly only when a Git-specific command is required for tooling
  interoperability or when explicitly requested.

## Development

- Use `pnpm` for package scripts.
- Generate derived content data with `pnpm generate:data`.
- Start the local development server with `pnpm start`.
- Build with `pnpm build`.
- Run unit tests with `pnpm test`.
- Run formatting and lint checks with `pnpm biome:check`.
- Apply automatic Biome fixes with `pnpm biome:write`.

## Content

- Blog posts live under `content/posts`.
- Post-local image/assets can live under `content/posts/<slug>/` and be
  referenced from Markdown with relative image paths. The generator rewrites
  those paths to `/posts/<slug>/...`, and Angular copies non-Markdown files
  from `content/posts` into the published `/posts` asset path.
- When adding or touching image assets, manually convert any non-AVIF images to
  AVIF and reference the converted files instead.
- The `prebuild`, `prestart`, and `pretest` hooks run `pnpm generate:data`, so
  post metadata and generated content are refreshed before `pnpm build`,
  `pnpm start`, or `pnpm test`.
- Files under `src/app/data` are generated from `content` and ignored by Git.
  Do not edit or commit them directly; update the source content/config files
  instead.
