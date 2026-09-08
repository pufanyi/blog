# PDF color profile

`ngx-extended-pdf-viewer` 30.0.0 omits the CMYK profile required by its PDF.js
engine. PDF.js resolves its default `../web/iccs/` URL from the worker under
`/assets/pdf-viewer/`, so this directory supplies the missing asset.

`CGATS001Compat-v2-micro.icc` is copied unchanged from
[Compact ICC Profiles](https://github.com/saucecontrol/Compact-ICC-Profiles/blob/bdd84663061bc4ae95ca70decff54f581e27f702/profiles/CGATS001Compat-v2-micro.icc),
the same revision used by Mozilla PDF.js. It is released under CC0-1.0; the
upstream license is included in `LICENSE`.
