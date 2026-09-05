import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { prepareDeploymentAssets, renderCloudflareRedirects } from './deployment-assets.mts';

test('renderCloudflareRedirects preserves client-rendered redirect routes', () => {
  assert.equal(
    renderCloudflareRedirects([{ from: 'legacy' }, { from: '/nested/path/' }]),
    `# Generated from content/redirects.yaml — do not edit manually
/legacy /index.csr 200
/nested/path /index.csr 200
/legacy/* /index.csr 200
/nested/path/* /index.csr 200
`,
  );
});

test('prepareDeploymentAssets promotes the prerender and writes redirect rules', (t) => {
  const browserDirectory = mkdtempSync(join(tmpdir(), 'blog-deployment-'));
  t.after(() => rmSync(browserDirectory, { recursive: true, force: true }));
  mkdirSync(join(browserDirectory, '404'));
  writeFileSync(join(browserDirectory, '404', 'index.html'), '<h1>Not found</h1>');
  writeFileSync(join(browserDirectory, 'index.csr.html'), '<app-root></app-root>');

  prepareDeploymentAssets(browserDirectory, [{ from: 'legacy' }]);

  assert.equal(readFileSync(join(browserDirectory, '404.html'), 'utf8'), '<h1>Not found</h1>');
  assert.match(readFileSync(join(browserDirectory, '_redirects'), 'utf8'), /^\/legacy /m);
});

test('prepareDeploymentAssets fails instead of deploying a homepage fallback', () => {
  assert.throws(
    () => prepareDeploymentAssets('/missing-build-output', []),
    /Missing prerendered 404 page/,
  );
});
