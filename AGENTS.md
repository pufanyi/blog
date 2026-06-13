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

## Design

- All color choices should follow the Catppuccin style and use existing
  Catppuccin CSS variables when possible.
- All Angular-authored images should use `app-image-lightbox`, which wraps
  `NgOptimizedImage` and `medium-zoom`. Do not add bare template `<img>` tags
  unless there is a concrete framework limitation.
- Markdown-generated post images are emitted as plain HTML first, then hydrated
  by the post page into `app-image-lightbox` instances. Keep generated image
  HTML dimensioned with `width`/`height` whenever possible so `NgOptimizedImage`
  can run correctly after hydration.

## Content

- Blog posts live under `content/posts`.
- Post-local image/assets can live under `content/posts/<slug>/` and be
  referenced from Markdown with relative image paths. The generator rewrites
  those paths to `/posts/<slug>/...`, and Angular copies non-Markdown files
  from `content/posts` into the published `/posts` asset path.
- Add an AI summary image button beside a Markdown heading by appending
  `<ai-img>relative-image.avif</ai-img>` to that heading. The generator rewrites
  the tag to an `AI Summary` button plus a hidden zoom source; clicking the
  button should open the image directly with `medium-zoom`, not expand an inline
  figure. Relative paths are normalized the same way as post-local images.
- Prefer mature UI/image tooling already in the project for interactions. For
  example, AI summary figures use `medium-zoom` for image inspection instead of
  ad-hoc navigation or custom zoom overlays.
- If an AI summary image dimension cannot be inferred automatically during data
  generation, add explicit `width` and `height` attributes to the `<ai-img>` tag.
- When adding or touching image assets, manually convert any non-AVIF images to
  AVIF and reference the converted files instead.
- The `prebuild`, `prestart`, and `pretest` hooks run `pnpm generate:data`, so
  post metadata and generated content are refreshed before `pnpm build`,
  `pnpm start`, or `pnpm test`.
- Files under `src/app/data` are generated from `content` and ignored by Git.
  Do not edit or commit them directly; update the source content/config files
  instead.
