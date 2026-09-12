# Local browser environment

Prefer Playwright's matching supported host and browser installation. CI installs
Chromium's headless shell and WebKit with `--with-deps`; do not add temporary host
workarounds to project dependencies or CI.

- For Linux browser screenshots, verify a CJK fallback font is available. On
  WSL, a temporary Fontconfig configuration can load Windows fonts without
  changing the site's typography.

- In minimal Linux environments, missing Playwright shared libraries can be
  supplied by extracting matching distro packages into a temporary directory
  and setting a process-scoped `LD_LIBRARY_PATH`. Use `FONTCONFIG_FILE` for
  temporary fonts; keep these host workarounds out of project dependencies.
  On older glibc hosts, point `MINIFLARE_WORKERD_PATH` at a temporary wrapper
  that launches the installed workerd through a newer extracted glibc loader.
  Verify actual CJK glyph rendering: a previous task's subset font may omit
  characters even when Fontconfig reports a CJK family.

An old host may make Playwright select a frozen WebKit build whose protocol is
incompatible with the current Playwright package. Validate the actual browser
version; installing an arbitrary older WebKit is not a valid current-browser
check. A temporary matching supported-platform download plus a private newer
runtime can work, but its loader and C++ libraries must be isolated to the
browser executable. Putting a newer glibc in global `LD_LIBRARY_PATH` can break
Node and Chromium. Keep any such wrapper outside the repository and report the
engine used. The maintenance validation used WebKit 26.5.

`BLOG_PREVIEW_PORT` and `BLOG_CLOUDFLARE_PORT` select isolated browser-test ports
(defaults 4173 and 8787). Tests deliberately refuse to reuse an existing server.
Use the site's generated production output, not another task's development
server. Retain traces for failed tests and inspect actual CJK glyphs and both
themes in screenshots.
