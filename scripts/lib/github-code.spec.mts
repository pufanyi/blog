import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createProcessor } from '@mdx-js/mdx';
import { JSDOM } from 'jsdom';
import { createHighlighter } from 'shiki';
import remarkConfig from '../../remark.config.mts';
import { htmlToAgentMarkdown } from './agent-markdown.mts';
import { createGitHubCodeLoader, githubCodeLanguage, parseGitHubCodeLink } from './github-code.mts';
import { renderMdx } from './mdx-renderer.mts';

const url =
  'https://github.com/git/git/blob/c51408889c3b372814bc20b9431c3b74d0d268eb/blob.h#L8-L12';

test('author lint accepts standalone code quotes and still flags ordinary bare URLs', async () => {
  const source = `${url}\n\nInline ${url}\n\nhttps://example.com\n\n[View source](${url})\n`;
  const file = await createProcessor({ remarkPlugins: remarkConfig.plugins }).process(source);
  const literalUrls = file.messages.filter((message) => message.ruleId === 'no-literal-urls');
  assert.deepEqual(
    literalUrls.map((message) => message.line),
    [3, 5],
  );
});

test('GitHub references require a pinned file and bounded, ascending line selection', () => {
  const link = parseGitHubCodeLink(url)!;
  assert.equal(link.start, 8);
  assert.equal(link.end, 12);
  assert.equal(
    link.rawUrl,
    'https://raw.githubusercontent.com/git/git/c51408889c3b372814bc20b9431c3b74d0d268eb/blob.h',
  );
  assert.equal(parseGitHubCodeLink(url.replace('#L8-L12', '?plain=1#L8'))?.end, 8);
  assert.equal(parseGitHubCodeLink(url.replace('blob.h', 'src/a%20b.h'))?.path, 'src/a b.h');
  for (const invalid of [
    url.replace(link.commit, 'main'),
    url.replace(link.commit, 'c514088'),
    url.replace('github.com', 'github.com.example.com'),
    url.replace('https:', 'http:'),
    url.replace('github.com', 'user@github.com'),
    url.replace('#L8-L12', ''),
    url.replace('#L8-L12', '?raw=1#L8'),
  ])
    assert.equal(parseGitHubCodeLink(invalid), undefined, invalid);
  for (const range of ['#L0', '#L12-L8', '#L1-L501', '#L999999999999999999'])
    assert.throws(() => parseGitHubCodeLink(url.replace('#L8-L12', range)));
  assert.equal(githubCodeLanguage('include/blob.h'), 'c');
  assert.equal(githubCodeLanguage('src/main.rs'), 'rs');
  assert.equal(githubCodeLanguage('Dockerfile'), 'dockerfile');
  assert.equal(githubCodeLanguage('example.unknown'), 'text');
});

test('file cache deduplicates ranges, survives offline rebuilds, and repairs corruption', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'github-code-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  let requests = 0;
  const fetchFile: typeof fetch = async (input, options) => {
    requests++;
    assert.equal(input, parseGitHubCodeLink(url)!.rawUrl);
    assert.equal(options?.redirect, 'error');
    assert.ok(options?.signal);
    return new Response('first\nsecond\n');
  };
  const load = createGitHubCodeLoader(directory, fetchFile);
  const first = parseGitHubCodeLink(url)!;
  const second = parseGitHubCodeLink(url.replace('#L8-L12', '#L1'))!;
  assert.deepEqual(await Promise.all([load(first), load(second)]), [
    'first\nsecond\n',
    'first\nsecond\n',
  ]);
  assert.equal(requests, 1);
  const offline = createGitHubCodeLoader(directory, async () => {
    throw new Error('offline');
  });
  assert.equal(await offline(first), 'first\nsecond\n');
  const [entry] = await readdir(directory);
  await writeFile(join(directory, entry), '{"text":"corrupt"}');
  assert.equal(await createGitHubCodeLoader(directory, fetchFile)(first), 'first\nsecond\n');
  assert.equal(requests, 2);
});

test('failed, oversized, binary, and invalid UTF-8 responses never enter the cache', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'github-code-failures-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const responses = [
    new Response('', { status: 404 }),
    new Response('x'.repeat(2 * 1024 * 1024 + 1)),
    new Response('binary\0data'),
    new Response(new Uint8Array([0xff])),
  ];
  let attempts = 0;
  const load = createGitHubCodeLoader(directory, async () => {
    attempts++;
    return responses.shift() ?? new Response('recovered');
  });
  const link = parseGitHubCodeLink(url)!;
  for (let i = 0; i < 4; i++) {
    await assert.rejects(load(link));
    assert.deepEqual(await readdir(directory), []);
  }
  assert.equal(await load(link), 'recovered');
  assert.equal(attempts, 5);
});

test('MDX expands only standalone bare links, preserving source, line numbers, and Markdown', async (t) => {
  const highlighter = await createHighlighter({
    themes: ['catppuccin-latte', 'catppuccin-mocha'],
    langs: [],
  });
  t.after(() => highlighter.dispose());
  const source = [
    url,
    `Inline ${url}`,
    `[View source](${url})`,
    `[${url}](${url})`,
    `\`${url}\``,
    `\`\`\`text\n${url}\n\`\`\``,
    url.replace('c51408889c3b372814bc20b9431c3b74d0d268eb', 'main'),
    `<details>\n<summary>Source</summary>\n\n${url}\n\n</details>`,
  ].join('\n\n');
  const excerpt =
    'struct blob {\r\n\tint value; // [!code --]\r\n\t// <script>alert("x")</script>\r\n\r\n};';
  let requests = 0;
  const result = await renderMdx(
    source,
    'example',
    '/tmp/example/index.mdx',
    highlighter,
    async () => {
      requests++;
      return `${'// preceding\r\n'.repeat(7)}${excerpt}\r\n`;
    },
  );
  assert.equal(requests, 2);
  const dom = new JSDOM(result.html);
  t.after(() => dom.window.close());
  const { document } = dom.window;
  const quotes = document.querySelectorAll('figure.github-code');
  assert.equal(quotes.length, 2);
  const quote = quotes[0];
  assert.match(
    quote.querySelector('figcaption')!.textContent!,
    /git\/git \/ blob.h · L8–L12 · c514088/,
  );
  assert.equal(quote.querySelector('a')?.href, url);
  assert.equal(quote.querySelectorAll('.code-copy').length, 1);
  assert.equal(quote.querySelector('code')!.textContent, `${excerpt.replaceAll('\r\n', '\n')}\n`);
  assert.deepEqual(
    [...quote.querySelectorAll('.line:not(.terminal-newline)')].map((line) =>
      line.getAttribute('data-line-number'),
    ),
    ['8', '9', '10', '11', '12'],
  );
  assert.equal(quote.querySelectorAll('script, .diff.remove').length, 0);
  assert.ok(quote.querySelector('span[style]'), 'C syntax is loaded on demand');
  const markdown = htmlToAgentMarkdown(result.markdownHtml, 'https://example.com/blog/example');
  assert.ok(markdown.includes(`[git/git / blob.h](${url})`));
  assert.ok(markdown.includes('```c\n'));
  assert.ok(markdown.includes(excerpt.replaceAll('\r\n', '\n')));
  assert.ok(!markdown.includes('Copy'));
});

test('quote errors identify the authored file, line, URL, and cause', async (t) => {
  const highlighter = await createHighlighter({
    themes: ['catppuccin-latte', 'catppuccin-mocha'],
    langs: [],
  });
  t.after(() => highlighter.dispose());
  for (const [load, expected] of [
    [async () => 'short\n', /outside the file \(1 lines\)/],
    [
      async () => {
        throw new Error('offline');
      },
      /offline/,
    ],
  ] as const) {
    await assert.rejects(
      renderMdx(`Intro\n\n${url}`, 'example', '/tmp/example/index.mdx', highlighter, load),
      (error: Error) => {
        assert.ok(error.message.includes('/tmp/example/index.mdx:3'));
        assert.ok(error.message.includes(url));
        assert.match(error.message, expected);
        return true;
      },
    );
  }
});
