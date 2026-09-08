import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import type { PostSummary } from '../../src/app/models/post.model';
import { loadSiteConfiguration } from './site-config.mts';
import { buildSyndicationFeeds } from './syndication.mts';

test('RSS and Atom preserve dates, escape authored text and resurface updates with stable article IDs', (t) => {
  const site = loadSiteConfiguration(fileURLToPath(new URL('../../configs', import.meta.url))).site;
  const posts: PostSummary[] = [
    {
      slug: 'old',
      title: '中文 <XML> & "quotes"',
      description: 'A ]]> & B < C',
      date: '2020-01-01',
      updated: '2026-09-08',
    },
    { slug: 'recent', title: 'Recent', description: 'Recent post', date: '2026-09-01' },
  ];
  const feeds = buildSyndicationFeeds(posts, site);
  assert.deepEqual(feeds, buildSyndicationFeeds([...posts].reverse(), site));
  const rss = new JSDOM(feeds.get('feed.xml')!, { contentType: 'application/xml' });
  const atom = new JSDOM(feeds.get('atom.xml')!, { contentType: 'application/xml' });
  t.after(() => {
    rss.window.close();
    atom.window.close();
  });
  const items = rss.window.document.querySelectorAll('item');
  assert.equal(items.length, 2);
  assert.equal(items[0].querySelector('title')?.textContent, posts[0].title);
  assert.equal(items[0].querySelector('description')?.textContent, posts[0].description);
  assert.equal(items[0].querySelector('guid')?.textContent, `${site.url}/blog/old`);
  assert.equal(items[0].querySelector('pubDate')?.textContent, 'Wed, 01 Jan 2020 00:00:00 GMT');
  assert.equal(
    rss.window.document.querySelector('lastBuildDate')?.textContent,
    'Tue, 08 Sep 2026 00:00:00 GMT',
  );
  const entries = atom.window.document.querySelectorAll('entry');
  assert.equal(entries.length, 2);
  assert.equal(entries[0].querySelector('id')?.textContent, `${site.url}/blog/old`);
  assert.equal(entries[0].querySelector('published')?.textContent, '2020-01-01T00:00:00Z');
  assert.equal(entries[0].querySelector('updated')?.textContent, '2026-09-08T00:00:00Z');
  assert.equal(entries[1].querySelector('updated')?.textContent, '2026-09-01T00:00:00Z');
  assert.equal(entries[0].querySelector('summary')?.textContent, posts[0].description);
  assert.equal(
    entries[0].querySelector('link[type="text/markdown"]')?.getAttribute('href'),
    `${site.url}/blog/old.md`,
  );
  assert.equal(
    atom.window.document.querySelector('feed > updated')?.textContent,
    '2026-09-08T00:00:00Z',
  );
  assert.equal(atom.window.document.documentElement.namespaceURI, 'http://www.w3.org/2005/Atom');
  assert.throws(() => buildSyndicationFeeds([], site), /dated published article/);
});
