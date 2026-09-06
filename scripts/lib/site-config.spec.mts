import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  loadSiteConfiguration,
  parseBlogConfig,
  parseCommentsConfig,
  parseRedirects,
  parseSiteConfig,
} from './site-config.mts';

const configuration = loadSiteConfiguration(
  fileURLToPath(new URL('../../configs/', import.meta.url)),
);

test('site configuration normalizes origins and preserves configurable metadata', () => {
  const site = parseSiteConfig({
    ...configuration.site,
    url: 'https://example.org/',
    title: 'Research notes',
  });
  assert.equal(site.url, 'https://example.org');
  assert.equal(site.title, 'Research notes');
  assert.throws(
    () => parseSiteConfig({ ...site, url: 'https://example.org/blog' }),
    /site.yaml.url.*origin/,
  );
  assert.throws(
    () => parseSiteConfig({ ...site, defaultImage: 'javascript:alert(1)' }),
    /site.yaml.defaultImage.*http/,
  );
});

test('page sizes must be positive integers and config errors identify the field', () => {
  for (const postsPerPage of [0, -1, 1.5, '10', Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(
      () => parseBlogConfig({ ...configuration.blog, postsPerPage }),
      /blog.yaml.postsPerPage.*positive integer/,
    );
  }
  assert.equal(parseBlogConfig({ ...configuration.blog, postsPerPage: 7 }).postsPerPage, 7);
  assert.throws(
    () => parseBlogConfig({ ...configuration.blog, showDates: 'false' }),
    /blog.yaml.showDates.*without quotes/,
  );
  assert.throws(
    () => parseBlogConfig({ ...configuration.blog, postPerPage: 10 }),
    /blog.yaml.postPerPage.*unknown/,
  );
});

test('nested typos, incomplete files, and invalid comment settings fail early', () => {
  assert.throws(
    () =>
      parseSiteConfig({
        ...configuration.site,
        footer: { ...configuration.site.footer, sourceUrl: 'https://example.org' },
      }),
    /footer.sourceUrl.*unknown/,
  );
  assert.throws(() => parseBlogConfig({}), /blog.yaml.postsPerPage/);
  assert.throws(
    () => parseCommentsConfig({ ...configuration.comments, repo: 'just-a-name' }),
    /comments.yaml.repo/,
  );
  assert.throws(
    () => parseCommentsConfig({ ...configuration.comments, inputPosition: 'middle' }),
    /comments.yaml.inputPosition/,
  );
  assert.equal(parseCommentsConfig({ ...configuration.comments, enabled: false }).enabled, false);
});

test('redirect settings reject duplicate paths and unsafe destinations', () => {
  assert.deepEqual(parseRedirects([]), []);
  const redirect = { from: '/old/', to: 'https://example.org/new/', title: 'New site' };
  assert.equal(parseRedirects([redirect])[0]?.from, 'old');
  assert.throws(() => parseRedirects([redirect, { ...redirect, from: 'old' }]), /duplicate route/);
  assert.throws(
    () => parseRedirects([{ ...redirect, to: 'javascript:alert(1)' }]),
    /redirects.yaml\[0\].to/,
  );
  assert.throws(
    () => parseRedirects([{ ...redirect, from: 'bad*path' }]),
    /redirects.yaml\[0\].from/,
  );
});
