import { expect, test } from '@playwright/test';

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
    const article = await response.text();
    expect(article, path).toContain(`Canonical: <https://pufanyi.com${path.slice(0, -3)}>`);
    expect(article, path).toMatch(/^# /);
    const negotiated = await request.get(path.slice(0, -3), { headers: { Accept: 'text/markdown' } });
    expect(negotiated.status(), path).toBe(200);
    expect(negotiated.headers()['content-type'], path).toContain('text/markdown');
    expect(await negotiated.text(), path).toBe(article);
  }
  const missing = await request.get('/blog/nonexistent-export.md');
  expect(missing.status()).toBe(404);
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
