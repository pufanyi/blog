import { expect, test } from '@playwright/test';

test('an HTTP-only reader can discover and fetch the complete Markdown collection', async ({ request }) => {
  const home = await request.get('/');
  expect(home.status()).toBe(200);
  const html = await home.text();
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
  }
  const missing = await request.get('/blog/nonexistent-export.md');
  expect(missing.status()).toBe(404);
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
