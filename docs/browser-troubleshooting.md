# Local browser environment

Browser review is manual. Use an installed browser with `pnpm start`, or run
`pnpm build` followed by `pnpm preview` to inspect production output. E2E browser
installation and automated test servers are no longer part of this project.

- Check desktop and phone widths and both themes when layout changes.
- For Linux screenshots, verify a CJK fallback font is available. On WSL, a
  temporary Fontconfig configuration can load Windows fonts without changing
  the site's typography. Verify actual glyphs, not just the reported family.
- Use `PORT=4174 pnpm preview` if the default production preview port is occupied.
- Use `pnpm preview:cloudflare` for actual Worker/static-asset routing. Keep
  host-specific workarounds outside project dependencies and CI.

On macOS, a symlinked temporary directory can make the generated Worker unit
test's relative source import resolve under `/private/Users` instead of `/Users`.
Run local validation with `TMPDIR=/private/tmp` to keep fixture creation and module
resolution on the same canonical path. This does not change production output.
