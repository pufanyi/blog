# AGENTS.md

Project guidance for agents working in this repository.

## Version Control

- This repository uses Git for version control.
- Check state with `git status`.
- Inspect history with `git log`.
- Inspect changes with `git diff`.
- Manage branches with `git branch` and `git switch`.
- Sync with remotes using `git fetch`, `git pull`, and `git push`.

## Development

- Use `pnpm` for package scripts.
- Generate derived content data with `pnpm generate:data`.
- Start the local development server with `pnpm start`.
- Build with `pnpm build`.
- Run unit tests with `pnpm test`.
- Run formatting and lint checks with `pnpm biome:check`.
- Apply automatic Biome fixes with `pnpm biome:write`.

## Design

- All color choices should follow the muted Morandi theme and use the semantic
  color variables from `src/styles/morandi.css`.
- All Angular-authored images should use `app-image-lightbox`, which wraps
  `NgOptimizedImage` and `medium-zoom`. Do not add bare template `<img>` tags
  unless there is a concrete framework limitation.
- MDX-generated post images are emitted as plain HTML first, then hydrated
  by the post page into `app-image-lightbox` instances. Keep generated image
  HTML dimensioned with `width`/`height` whenever possible so `NgOptimizedImage`
  can run correctly after hydration.

## Content

- Each blog post lives at `content/posts/<slug>/index.mdx`; the directory name is
  the post slug. `index.mdx` starts with YAML front matter delimited by `---`;
  `title`, `date` (`YYYY-MM-DD`), and `description` are required, while
  `coverImage` is optional.
- Post-local image/assets live alongside `index.mdx` under
  `content/posts/<slug>/` and are referenced from Markdown with relative image
  paths. The generator rewrites those paths to `/posts/<slug>/...`, and Angular
  copies non-MDX files from `content/posts` into the published `/posts`
  asset path.
- Add an AI summary image button beside an MDX heading by appending
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
- Rich-text fields in `content/cv.yaml` support inline Markdown while retaining
  compatibility with authored HTML. This applies to abstract paragraphs, entry
  details and items, subsection items, and section content; structural fields
  such as titles, dates, locations, and header data remain plain text.
- The `prebuild`, `prestart`, and `pretest` hooks run `pnpm generate:data`, so
  post metadata and generated content are refreshed before `pnpm build`,
  `pnpm start`, or `pnpm test`.
- Files under `src/app/data` are generated from `content` and ignored by Git.
  Do not edit or commit them directly; update the source content files instead.
