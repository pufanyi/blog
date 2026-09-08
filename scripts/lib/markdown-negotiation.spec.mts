import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createMarkdownWorker, prefersMarkdown } from './markdown-negotiation.mts';

test('Markdown negotiation respects explicit media types, quality and wildcard precedence', () => {
  for (const accept of [
    'text/markdown',
    'text/markdown, text/html',
    'text/html;q=0.5, text/markdown;q=0.9',
    'TEXT/MARKDOWN; charset=utf-8; Q=1',
    'text/markdown;q=0.5, text/html;q=0, */*;q=1',
    'text/markdown;q=0.5, text/*;q=0, */*;q=1',
  ])
    assert.equal(prefersMarkdown(accept), true, accept);
  for (const accept of [
    null,
    '',
    '*/*',
    'text/*',
    'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'text/markdown;q=0, */*',
    'text/markdown;q=0.2, text/html',
    'text/markdown;q=0.2, text/*;q=0.8',
    'text/markdown;q=0.2, */*',
    'text/x-markdown',
    'text/markdown;q=invalid',
    'text/markdown;q=',
    'text/markdown;q=2',
    'text/markdown;q=-1',
  ])
    assert.equal(prefersMarkdown(accept), false, String(accept));
});

const origin = 'https://example.com';
const routes = {
  '/': `${origin}/profile.md`,
  '/cv': `${origin}/profile.md`,
  '/blog': `${origin}/blog/index.md`,
  '/blog/page/2': `${origin}/blog/index.md`,
  '/blog/post': `${origin}/blog/post.md`,
};

test('GET and HEAD serve exact Markdown bytes at published HTML URLs and advertise discovery', async () => {
  const calls: Request[] = [];
  const content = '# Title\n\n$\\alpha$\n\n```cpp\nint x;\n```\n';
  const worker = createMarkdownWorker(routes);
  const env = {
    ASSETS: {
      async fetch(request: Request) {
        calls.push(request);
        return new Response(request.method === 'HEAD' ? null : content, {
          headers: { 'Content-Type': 'text/markdown', Vary: 'Accept-Encoding', ETag: '"markdown"' },
        });
      },
    },
  };
  for (const [path, target] of Object.entries(routes)) {
    for (const method of ['GET', 'HEAD']) {
      const response = await worker.fetch(
        new Request(`${origin}${path}?ref=agent`, {
          method,
          headers: {
            Accept: 'text/markdown',
            'If-Modified-Since': 'Tue, 08 Sep 2026 00:00:00 GMT',
          },
        }),
        env,
      );
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('Content-Type'), 'text/markdown; charset=utf-8');
      assert.equal(response.headers.get('Content-Location'), target);
      assert.equal(response.headers.get('ETag'), '"markdown"');
      assert.equal(response.headers.get('Vary'), 'Accept-Encoding, Accept');
      assert.equal(response.headers.get('Cache-Control'), 'private, no-cache');
      assert.equal(response.headers.get('CDN-Cache-Control'), 'no-store');
      assert.equal(response.headers.get('Cloudflare-CDN-Cache-Control'), 'no-store');
      assert.match(response.headers.get('Link') ?? '', /rel="alternate"; type="text\/markdown"/);
      assert.match(
        response.headers.get('Link') ?? '',
        /<https:\/\/example.com\/llms.txt>; rel="describedby"/,
      );
      assert.equal(await response.text(), method === 'HEAD' ? '' : content);
      assert.equal(calls.at(-1)?.url, `${target}?ref=agent`);
      assert.equal(calls.at(-1)?.method, method);
      assert.equal(calls.at(-1)?.headers.get('If-Modified-Since'), null);
    }
  }
  await worker.fetch(
    new Request(`${origin}/blog/post/`, { headers: { Accept: 'text/markdown' } }),
    env,
  );
  assert.equal(calls.at(-1)?.url, routes['/blog/post']);
});

test('conditional requests keep HTML and Markdown ETags separate when switching formats', async () => {
  const worker = createMarkdownWorker(routes);
  const env = {
    ASSETS: {
      async fetch(request: Request) {
        const markdown = new URL(request.url).pathname.endsWith('.md');
        const tag = markdown ? '"markdown"' : '"html"';
        const unchanged = request.headers.get('If-None-Match') === tag;
        return new Response(unchanged ? null : markdown ? '# Post' : '<h1>Post</h1>', {
          status: unchanged ? 304 : 200,
          headers: { ETag: tag, 'Content-Type': markdown ? 'text/markdown' : 'text/html' },
        });
      },
    },
  };
  for (const [accept, previous, status, expected] of [
    ['text/markdown', '"html"', 200, '# Post'],
    ['text/html', '"markdown"', 200, '<h1>Post</h1>'],
    ['text/markdown', '"markdown"', 304, ''],
    ['text/html', '"html"', 304, ''],
  ] as const) {
    const response = await worker.fetch(
      new Request(`${origin}/blog/post`, {
        headers: { Accept: accept, 'If-None-Match': previous },
      }),
      env,
    );
    assert.equal(response.status, status);
    assert.equal(await response.text(), expected);
    assert.equal(response.headers.get('Vary'), 'Accept');
    assert.equal(response.headers.get('CDN-Cache-Control'), 'no-store');
    assert.match(response.headers.get('Content-Type') ?? '', new RegExp(accept));
  }
});

test('unmapped paths, direct exports and non-read methods retain static asset behavior', async () => {
  const worker = createMarkdownWorker(routes);
  for (const path of [
    '/blog/draft',
    '/blog/page/999',
    '/blog/post.md',
    '/pdf-viewer',
    '/posts/p/a.pdf',
    '/toString',
  ]) {
    const request = new Request(`${origin}${path}`, { headers: { Accept: 'text/markdown' } });
    const asset = new Response('unchanged', { status: path.includes('draft') ? 404 : 200 });
    const response = await worker.fetch(request, {
      ASSETS: {
        async fetch(received) {
          assert.equal(received, request);
          return asset;
        },
      },
    });
    assert.equal(response, asset);
  }
  const request = new Request(`${origin}/blog/post`, { method: 'POST', body: 'original body' });
  await worker.fetch(request, {
    ASSETS: {
      async fetch(received) {
        assert.equal(received, request);
        assert.equal(await received.text(), 'original body');
        return new Response(null, { status: 405 });
      },
    },
  });
});

test('a missing export remains a 404 with the original error body and MIME type', async () => {
  const response = await createMarkdownWorker(routes).fetch(
    new Request(`${origin}/blog/post`, { headers: { Accept: 'text/markdown' } }),
    {
      ASSETS: {
        async fetch() {
          return new Response('<h1>Missing</h1>', {
            status: 404,
            headers: { 'Content-Type': 'text/html' },
          });
        },
      },
    },
  );
  assert.equal(response.status, 404);
  assert.equal(response.headers.get('Content-Type'), 'text/html');
  assert.equal(response.headers.get('Content-Location'), null);
  assert.equal(await response.text(), '<h1>Missing</h1>');
});

test('Cloudflare header rules must not label the HTML 404 fallback as Markdown', async () => {
  const response = await createMarkdownWorker(routes).fetch(
    new Request(`${origin}/blog/missing.md`),
    {
      ASSETS: {
        async fetch() {
          return new Response('<h1>Not found</h1>', {
            status: 404,
            headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
          });
        },
      },
    },
  );
  assert.equal(response.status, 404);
  assert.equal(response.headers.get('Content-Type'), 'text/html; charset=utf-8');
  assert.equal(await response.text(), '<h1>Not found</h1>');
});
