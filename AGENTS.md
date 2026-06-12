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
- Start the local development server with `pnpm start`.
- Build with `pnpm build`.
- Run unit tests with `pnpm test`.
- Run formatting and lint checks with `pnpm biome:check`.
- Apply automatic Biome fixes with `pnpm biome:write`.

## Content

- Blog posts live under `content/posts`.
- The prebuild/prestart hooks run `node scripts/build-posts.mjs`, so post
  metadata and generated content are refreshed before `pnpm build` or
  `pnpm start`.
