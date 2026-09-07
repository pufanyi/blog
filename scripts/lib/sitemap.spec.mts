import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test, { type TestContext } from 'node:test';
import { JSDOM } from 'jsdom';
import { prepareSitemap } from './sitemap.mts';

function buildFixture(t: TestContext, pages: Record<string, string>): string {
  const buildDirectory = mkdtempSync(join(tmpdir(), 'blog-sitemap-'));
  t.after(() => rmSync(buildDirectory, { recursive: true, force: true }));
  const browserDirectory = join(buildDirectory, 'browser');
  writeFileSync(
    join(buildDirectory, 'prerendered-routes.json'),
    JSON.stringify({ routes: Object.fromEntries(Object.keys(pages).map((route) => [route, {}])) }),
  );
  for (const [route, head] of Object.entries(pages)) {
    const directory = join(browserDirectory, route);
    mkdirSync(directory, { recursive: true });
    writeFileSync(join(directory, 'index.html'), `<html><head>${head}</head><body></body></html>`);
  }
  return browserDirectory;
}

test('sitemap includes unique page canonicals and excludes noindex and redirect pages', (t) => {
  const browserDirectory = buildFixture(t, {
    '/': '<link rel="canonical" href="https://example.com/">',
    '/blog': '<link rel="canonical" href="https://example.com/blog">',
    '/blog/page/2': '<link rel="canonical" href="https://example.com/blog/page/2">',
    '/blog/new-post': '<link rel="canonical" href="https://example.com/blog/new-post">',
    '/blog/new-post-alias': '<link rel="canonical" href="https://example.com/blog/new-post">',
    '/blog/特殊&a': '<link rel="canonical" href="https://example.com/blog/特殊&amp;a">',
    '/404': '<meta name="robots" content="noindex, follow">',
    '/hidden': '<meta name="googlebot" content="NONE">',
    '/blog/page/1': '<meta http-equiv="refresh" content="0; url=/blog">',
  });

  assert.equal(prepareSitemap(browserDirectory, 'https://example.com'), 5);
  const xml = readFileSync(join(browserDirectory, 'sitemap.xml'), 'utf8');
  const dom = new JSDOM(xml, { contentType: 'application/xml' });
  t.after(() => dom.window.close());
  assert.equal(
    dom.window.document.documentElement.namespaceURI,
    'http://www.sitemaps.org/schemas/sitemap/0.9',
  );
  assert.deepEqual(
    Array.from(dom.window.document.querySelectorAll('loc'), (loc) => loc.textContent),
    [
      'https://example.com/',
      'https://example.com/blog',
      'https://example.com/blog/%E7%89%B9%E6%AE%8A&a',
      'https://example.com/blog/new-post',
      'https://example.com/blog/page/2',
    ],
  );
  assert.equal(dom.window.document.querySelector('lastmod'), null);
  assert.equal(
    readFileSync(join(browserDirectory, 'robots.txt'), 'utf8'),
    'User-agent: *\nAllow: /\n\nSitemap: https://example.com/sitemap.xml\n',
  );
});

test('sitemap generation fails when indexable pages have missing or invalid canonicals', (t) => {
  for (const head of [
    '',
    '<link rel="canonical" href="https://other.example/blog">',
    '<link rel="canonical" href="https://example.com/blog?query=value">',
    '<link rel="canonical" href="https://example.com/blog#heading">',
  ]) {
    const browserDirectory = buildFixture(t, { '/blog': head });
    assert.throws(() => prepareSitemap(browserDirectory, 'https://example.com'), /canonical/);
  }
});
