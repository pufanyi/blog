import { copyFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

function normalizeRedirectPath(from) {
  if (typeof from !== 'string') {
    throw new TypeError('Redirect "from" values must be strings');
  }

  const path = from.replace(/^\/+|\/+$/g, '');
  if (!path || /[\s:*?#\\]/.test(path)) {
    throw new TypeError(`Redirect path cannot be represented safely in _redirects: ${from}`);
  }

  return `/${path}`;
}

export function renderCloudflareRedirects(redirects) {
  if (!Array.isArray(redirects)) {
    throw new TypeError('Redirect configuration must be an array');
  }

  const paths = redirects.map((redirect) => normalizeRedirectPath(redirect?.from));
  const lines = [
    '# Generated from content/redirects.yaml — do not edit manually',
    ...paths.map((path) => `${path} /index.csr 200`),
    ...paths.map((path) => `${path}/* /index.csr 200`),
  ];

  return `${lines.join('\n')}\n`;
}

export function prepareDeploymentAssets(browserDirectory, redirects) {
  const redirectFile = renderCloudflareRedirects(redirects);
  const prerendered404 = join(browserDirectory, '404', 'index.html');
  const csrShell = join(browserDirectory, 'index.csr.html');
  if (!existsSync(prerendered404)) {
    throw new Error(`Missing prerendered 404 page: ${prerendered404}`);
  }
  if (redirects.length > 0 && !existsSync(csrShell)) {
    throw new Error(`Missing Angular CSR shell: ${csrShell}`);
  }

  copyFileSync(prerendered404, join(browserDirectory, '404.html'));
  writeFileSync(join(browserDirectory, '_redirects'), redirectFile, 'utf8');
}
