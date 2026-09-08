import { expect, test } from '@playwright/test';
import { JSDOM } from 'jsdom';
import { POSTS } from '../src/app/data/posts';

test('an HTTP-only reader can discover and fetch the complete Markdown collection', async ({ request }) => {
  const home = await request.get('/');
  expect(home.status()).toBe(200);
  const html = await home.text();
  expect(home.headers()['link']).toContain('<https://pufanyi.com/profile.md>; rel="alternate"; type="text/markdown"');
  expect(home.headers()['link']).toContain('<https://pufanyi.com/llms.txt>; rel="describedby"');
  expect(html).toMatch(/<link[^>]+rel="alternate"[^>]+type="text\/markdown"[^>]+href="https:\/\/pufanyi.com\/profile.md"/);
  expect(html).toMatch(/<link[^>]+rel="describedby"[^>]+href="https:\/\/pufanyi.com\/llms.txt"/);

  const guide = await request.get('/llms.txt');
  expect(guide.headers()['content-type']).toContain('text/plain');
  expect(await guide.text()).toContain('https://pufanyi.com/blog/index.md');
  const profile = await request.get('/profile.md');
  expect(profile.status()).toBe(200);
  expect(profile.headers()['content-type']).toContain('text/markdown');
  expect(await profile.text()).toContain('# Fanyi Pu 濮凡轶');
  expect(await profile.text()).toContain('## Education');

  const index = await request.get('/blog/index.md');
  expect(index.status()).toBe(200);
  expect(index.headers()['content-type']).toContain('text/markdown');
  const markdown = await index.text();
  const paths = [...markdown.matchAll(/https:\/\/pufanyi.com(\/blog\/[^)\s]+\.md)/g)].map(match => match[1]);
  const count = Number(markdown.match(/(\d+) published articles/)?.[1]);
  expect(count).toBeGreaterThan(0);
  expect(new Set(paths).size).toBe(count);
  for (const path of paths) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(response.headers()['content-type'], path).toContain('text/markdown');
    expect(response.headers()['link'], path).toContain(`<https://pufanyi.com${path.slice(0, -3)}>; rel="canonical"`);
    const article = await response.text();
    expect(article, path).toContain(`Canonical: <https://pufanyi.com${path.slice(0, -3)}>`);
    expect(article, path).toMatch(/^# /);
    const negotiated = await request.get(path.slice(0, -3), { headers: { Accept: 'text/markdown' } });
    expect(negotiated.status(), path).toBe(200);
    expect(negotiated.headers()['content-type'], path).toContain('text/markdown');
    expect(negotiated.headers()['link'], path).toContain(`<https://pufanyi.com${path.slice(0, -3)}>; rel="canonical"`);
    expect(await negotiated.text(), path).toBe(article);
  }
  const missing = await request.get('/blog/nonexistent-export.md');
  expect(missing.status()).toBe(404);
});

test('profile identity, feeds and authored updates are discoverable in prerendered content', async ({ request }) => {
  for (const path of ['/', '/cv']) {
    const dom = new JSDOM(await (await request.get(path)).text());
    try {
      const document = dom.window.document;
      const profile = JSON.parse(document.querySelector('#profile-structured-data')!.textContent!);
      expect(profile['@type']).toBe('ProfilePage');
      expect(profile.mainEntity['@id']).toBe('https://pufanyi.com/#person');
      expect(profile.mainEntity.name).toContain('濮凡轶');
      expect(profile.mainEntity.sameAs).toContain('https://github.com/pufanyi');
      expect(document.querySelector('link[type="application/rss+xml"]')?.getAttribute('href')).toBe('https://pufanyi.com/feed.xml');
      expect(document.querySelector('link[type="application/atom+xml"]')?.getAttribute('href')).toBe('https://pufanyi.com/atom.xml');
    } finally {
      dom.window.close();
    }
  }
  const atomResponse = await request.get('/atom.xml');
  const rssResponse = await request.get('/feed.xml');
  expect(atomResponse.status()).toBe(200);
  expect(rssResponse.status()).toBe(200);
  expect(atomResponse.headers()['content-type']).toContain('application/atom+xml');
  expect(rssResponse.headers()['content-type']).toContain('application/rss+xml');
  const atom = new JSDOM(await atomResponse.text(), { contentType: 'application/xml' });
  const rss = new JSDOM(await rssResponse.text(), { contentType: 'application/xml' });
  const sitemap = new JSDOM(await (await request.get('/sitemap.xml')).text(), { contentType: 'application/xml' });
  try {
    const entries = [...atom.window.document.querySelectorAll('entry')];
    const items = [...rss.window.document.querySelectorAll('item')];
    expect(entries).toHaveLength(POSTS.length);
    expect(items).toHaveLength(POSTS.length);
    for (const post of POSTS) {
      const canonical = `https://pufanyi.com/blog/${post.slug}`;
      const entry = entries.find(item => item.querySelector('id')?.textContent === canonical)!;
      const item = items.find(item => item.querySelector('guid')?.textContent === canonical)!;
      expect(entry.querySelector('published')?.textContent).toBe(`${post.date}T00:00:00Z`);
      expect(entry.querySelector('updated')?.textContent).toBe(`${post.updated ?? post.date}T00:00:00Z`);
      expect(entry.querySelector('summary')?.textContent).toBe(post.description);
      expect(item.querySelector('title')?.textContent).toBe(post.title);
      const sitemapEntry = [...sitemap.window.document.querySelectorAll('url')].find(item => item.querySelector('loc')?.textContent === canonical)!;
      expect(sitemapEntry.querySelector('lastmod')?.textContent).toBe(post.updated);
    }
    for (const post of POSTS.filter(post => post.updated)) {
      const canonical = `https://pufanyi.com/blog/${post.slug}`;
      const html = new JSDOM(await (await request.get(`/blog/${post.slug}`)).text());
      try {
        const document = html.window.document;
        const article = JSON.parse(document.querySelector('#article-structured-data')!.textContent!);
        expect(article.dateModified).toBe(post.updated);
        expect(article.author[0]['@id']).toBe('https://pufanyi.com/#person');
        expect(document.querySelector('meta[property="article:modified_time"]')?.getAttribute('content')).toBe(post.updated);
        expect(document.querySelector(`app-post-header time[datetime="${post.updated}"]`)).not.toBeNull();
        const markdown = await (await request.get(`/blog/${post.slug}.md`)).text();
        expect(markdown).toContain(`Updated: ${post.updated}`);
        expect(markdown).toContain(`Canonical: <${canonical}>`);
      } finally {
        html.window.close();
      }
    }
  } finally {
    atom.window.close(); rss.window.close(); sitemap.window.close();
  }
});

test('Cloudflare serves sitemap canonicals directly and redirects HTML slash variants consistently', async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== 'cloudflare', 'Cloudflare controls static HTML URL normalization');
  const dom = new JSDOM(await (await request.get('/sitemap.xml')).text(), { contentType: 'application/xml' });
  try {
    for (const loc of dom.window.document.querySelectorAll('loc')) {
      const path = new URL(loc.textContent!).pathname;
      const response = await request.get(path, { maxRedirects: 0, headers: { Accept: 'text/html' } });
      expect(response.status(), path).toBe(200);
      expect(response.headers()['location'], path).toBeUndefined();
      if (path !== '/') expect(path).not.toMatch(/\/$/);
    }
  } finally {
    dom.window.close();
  }
  for (const path of ['/cv', '/blog', '/blog/page/2', '/blog/cf77c', '/icpc']) {
    const response = await request.get(`${path}/?ref=search`, { maxRedirects: 0, headers: { Accept: 'text/html' } });
    expect([301, 307, 308]).toContain(response.status());
    expect(new URL(response.headers()['location'], response.url()).pathname).toBe(path);
    expect(new URL(response.headers()['location'], response.url()).search).toBe('?ref=search');
  }
});

test('original URLs negotiate Markdown while browsers, HEAD requests and 404s keep correct behavior', async ({ request }, testInfo) => {
  for (const [path, alternate] of [
    ['/', '/profile.md'],
    ['/cv', '/profile.md'],
    ['/blog', '/blog/index.md'],
    ['/blog/page/2', '/blog/index.md'],
    ['/blog/cf77c', '/blog/cf77c.md'],
    ['/blog/cf77c/', '/blog/cf77c.md'],
  ]) {
    const direct = await request.get(alternate);
    for (const accept of ['text/html', 'text/markdown', '*/*', 'text/markdown;q=0', 'text/markdown, text/html', 'text/html']) {
      const response = await request.get(`${path}?ref=agent`, { headers: { Accept: accept } });
      const markdown = accept === 'text/markdown' || accept === 'text/markdown, text/html';
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain(markdown ? 'text/markdown' : 'text/html');
      expect(response.headers()['vary']).toMatch(/\bAccept\b/i);
      expect(response.headers()['cache-control']).toContain('private');
      expect(response.headers()['link']).toContain(`<https://pufanyi.com${alternate}>; rel="alternate"`);
      if (markdown) {
        expect(await response.text()).toBe(await direct.text());
        expect(response.headers()['content-location']).toBe(`https://pufanyi.com${alternate}`);
      } else {
        expect(await response.text()).toContain('<app-root');
      }
    }
    const head = await request.head(path, { headers: { Accept: 'text/markdown' } });
    expect(head.status()).toBe(200);
    expect(head.headers()['content-type']).toContain('text/markdown');
    expect(await head.body()).toHaveLength(0);
  }
  for (const path of ['/blog/nonexistent-export', '/blog/page/999', '/blog/nonexistent-export.md']) {
    const response = await request.get(path, { headers: { Accept: 'text/markdown' } });
    expect(response.status()).toBe(404);
    expect(response.headers()['content-type']).toContain('text/html');
  }
  if (testInfo.project.name === 'cloudflare') {
    const html = await request.get('/blog/cf77c', { headers: { Accept: 'text/html' } });
    const markdown = await request.get('/blog/cf77c', { headers: { Accept: 'text/markdown' } });
    const htmlTag = html.headers()['etag'];
    const markdownTag = markdown.headers()['etag'];
    expect(htmlTag).toBeTruthy();
    expect(markdownTag).toBeTruthy();
    expect(htmlTag).not.toBe(markdownTag);
    for (const [accept, previousTag, status] of [
      ['text/markdown', htmlTag, 200],
      ['text/html', markdownTag, 200],
      ['text/markdown', markdownTag, 304],
      ['text/html', htmlTag, 304],
    ] as const) {
      const response = await request.get('/blog/cf77c', {
        headers: { Accept: accept, 'If-None-Match': previousTag },
      });
      expect(response.status()).toBe(status);
      expect(response.headers()['vary']).toMatch(/\bAccept\b/i);
      if (status === 200) {
        expect(await response.text()).toBe(await (accept === 'text/markdown' ? markdown : html).text());
      }
    }
  }
});

test('published Markdown keeps technical content and HTML advertises the corresponding article', async ({ request }) => {
  const html = await (await request.get('/blog/cf77c')).text();
  expect(html).toMatch(/<link[^>]+rel="alternate"[^>]+href="https:\/\/pufanyi.com\/blog\/cf77c.md"/);
  const tree = await (await request.get('/blog/cf77c.md')).text();
  expect(tree).toContain('无向边为 2—5、3—4、4—5、1—5');
  expect(tree).toContain('$i(k_i)$');
  expect(tree).toContain('```cpp');
  const attention = await (await request.get('/blog/ml-revisit-attention.md')).text();
  expect(attention).toContain('\\begin{bmatrix}');
  expect(attention).toContain('## References');
  expect(attention).toContain('https://pufanyi.com/blog/ml-revisit-attention#bib-');
  const contest = await (await request.get('/blog/mock-contest-20190307.md')).text();
  expect(contest).toContain('https://pufanyi.com/posts/mock-contest-20190307/problem.pdf');
  expect(contest).not.toContain('pdf-viewer');
});
