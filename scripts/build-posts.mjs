import { evaluate } from '@mdx-js/mdx';
import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { load as loadYaml } from 'js-yaml';
import { JSDOM } from 'jsdom';
import { join } from 'path';
import { createElement } from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { createHighlighter } from 'shiki';
import { pathToFileURL } from 'url';
import { createCodeRenderer } from './lib/code-renderer.mjs';
import { renderCvMarkdown } from './lib/cv-markdown.mjs';
import { parsePostSource } from './lib/front-matter.mjs';
import { buildTableOfContents } from './lib/toc-renderer.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const POSTS_DIR = join(ROOT, 'content/posts');
const DATA_DIR = join(ROOT, 'src/app/data');
const OUTPUT = join(DATA_DIR, 'posts.ts');
const REDIRECTS_INPUT = join(ROOT, 'content/redirects.yaml');
const REDIRECTS_OUTPUT = join(DATA_DIR, 'redirects.ts');
const CV_INPUT = join(ROOT, 'content/cv.yaml');
const CV_OUTPUT = join(DATA_DIR, 'cv.ts');
const POST_ASSET_BASE = '/posts';
const imageDimensions = new Map();

// Collect languages used across all posts for Shiki
function collectLangs(posts) {
  const langs = new Set();
  for (const mdx of posts) {
    for (const match of mdx.matchAll(/```(\w+)/g)) {
      langs.add(match[1]);
    }
  }
  return [...langs];
}

function isRootedOrRemoteHref(href) {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/|#|\/)/i.test(href);
}

function normalizePostImageHref(href, slug) {
  if (isRootedOrRemoteHref(href)) {
    return href;
  }

  const localHref = href.replace(/^\.\//, '');
  if (localHref.startsWith(`${slug}/`)) {
    return `${POST_ASSET_BASE}/${localHref}`;
  }

  return `${POST_ASSET_BASE}/${slug}/${localHref}`;
}

function resolvePostAssetPath(href, slug) {
  if (isRootedOrRemoteHref(href)) {
    return null;
  }

  const localHref = href.replace(/^\.\//, '');
  if (localHref.startsWith(`${slug}/`)) {
    return join(POSTS_DIR, localHref);
  }

  return join(POSTS_DIR, slug, localHref);
}

function getImageDimensions(href, slug) {
  const file = resolvePostAssetPath(href, slug);
  if (!file || !existsSync(file)) {
    return null;
  }

  if (imageDimensions.has(file)) {
    return imageDimensions.get(file);
  }

  try {
    const output = execFileSync('magick', ['identify', '-format', '%w %h', file], {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    const [width, height] = output.split(/\s+/).map(Number);
    const dimensions = Number.isFinite(width) && Number.isFinite(height) ? { width, height } : null;
    imageDimensions.set(file, dimensions);
    return dimensions;
  } catch {
    imageDimensions.set(file, null);
    return null;
  }
}

function replaceWithHtml(document, node, html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  node.replaceWith(template.content);
}

function postprocessMdxHtml(html, slug, highlighter) {
  const dom = new JSDOM(`<body>${html}</body>`);
  const { document } = dom.window;

  // React 19 may emit image preload hints during static rendering. Angular owns
  // the document shell, so post content should contain only authored content.
  for (const preload of document.querySelectorAll('link[rel="preload"][as="image"]')) {
    preload.remove();
  }

  for (const code of Array.from(document.querySelectorAll('code.math-inline'))) {
    const span = document.createElement('span');
    span.className = 'math-inline';
    span.textContent = `$${code.textContent ?? ''}$`;
    code.replaceWith(span);
  }

  for (const code of Array.from(document.querySelectorAll('code.math-display'))) {
    const container = code.parentElement?.tagName === 'PRE' ? code.parentElement : code;
    const div = document.createElement('div');
    div.className = 'math-display';
    div.textContent = `$$\n${code.textContent ?? ''}\n$$`;
    container.replaceWith(div);
  }

  const renderCode = createCodeRenderer(highlighter);
  for (const code of Array.from(document.querySelectorAll('pre > code'))) {
    const pre = code.parentElement;
    if (!pre) continue;
    const languageClass = Array.from(code.classList).find((name) => name.startsWith('language-'));
    const lang = languageClass?.slice('language-'.length) || '';
    replaceWithHtml(document, pre, renderCode({ text: code.textContent ?? '', lang }));
  }

  for (const table of Array.from(document.querySelectorAll('table'))) {
    if (table.parentElement?.classList.contains('table-wrapper')) continue;
    const wrapper = document.createElement('div');
    wrapper.className = 'table-wrapper';
    table.replaceWith(wrapper);
    wrapper.append(table);
  }

  for (const image of Array.from(document.querySelectorAll('img'))) {
    const authoredSrc = image.getAttribute('src')?.trim();
    if (!authoredSrc) continue;
    const src = normalizePostImageHref(authoredSrc, slug);
    const dimensions = getImageDimensions(authoredSrc, slug);
    image.src = src;
    if (dimensions && (!image.hasAttribute('width') || !image.hasAttribute('height'))) {
      image.width = dimensions.width;
      image.height = dimensions.height;
    }
    image.setAttribute('loading', 'lazy');
    image.setAttribute('decoding', 'async');
    image.setAttribute('data-zoom-src', src);
  }

  const postPath = `/blog/${encodeURIComponent(slug)}`;
  const toc = buildTableOfContents(document, postPath);
  return { html: document.body.innerHTML, toc };
}

export async function renderMdx(mdx, slug, sourcePath, highlighter) {
  const module = await evaluate(mdx, {
    ...jsxRuntime,
    baseUrl: pathToFileURL(sourcePath),
    remarkPlugins: [remarkGfm, remarkMath],
  });
  const html = renderToStaticMarkup(createElement(module.default));
  return postprocessMdxHtml(html, slug, highlighter);
}

async function main() {
  mkdirSync(DATA_DIR, { recursive: true });

  const postEntries = readdirSync(POSTS_DIR, { withFileTypes: true });
  const unexpectedEntries = postEntries.filter((entry) => !entry.isDirectory());
  if (unexpectedEntries.length) {
    const names = unexpectedEntries
      .map((entry) => entry.name)
      .sort()
      .join(', ');
    throw new Error(
      `content/posts must contain only <slug>/index.mdx directories; unexpected entries: ${names}`,
    );
  }

  const postSlugs = postEntries.map((entry) => entry.name).sort();
  const rawPosts = postSlugs
    .map((slug) => {
      const relativeSource = `content/posts/${slug}/index.mdx`;
      const sourcePath = join(POSTS_DIR, slug, 'index.mdx');
      if (!existsSync(sourcePath)) {
        throw new Error(`${relativeSource}: file does not exist`);
      }

      const source = readFileSync(sourcePath, 'utf-8');
      const { metadata, body } = parsePostSource(source, relativeSource);
      return { slug, meta: metadata, mdx: body, sourcePath };
    })
    .filter(({ meta }) => !meta.draft);

  // Create Shiki highlighter with all needed languages
  const langs = collectLangs(rawPosts.map((p) => p.mdx));
  const highlighter = await createHighlighter({
    themes: ['catppuccin-latte', 'catppuccin-mocha'],
    langs: langs.length ? langs : ['text'],
  });

  const posts = await Promise.all(
    rawPosts.map(async ({ slug, meta, mdx, sourcePath }) => {
      const rendered = await renderMdx(mdx, slug, sourcePath, highlighter);
      const { draft: _draft, ...publicMeta } = meta;
      return { slug, ...publicMeta, contentHtml: rendered.html, toc: rendered.toc };
    }),
  );

  posts.sort((a, b) => b.date.localeCompare(a.date));

  const output = `// Auto-generated by scripts/build-posts.mjs — do not edit manually
import { Post } from '../models/post.model';

export const POSTS: Post[] = ${JSON.stringify(posts, null, 2)};
`;

  writeFileSync(OUTPUT, output, 'utf-8');
  console.log(`Generated ${posts.length} posts → src/app/data/posts.ts`);

  // Build redirects
  let redirects = [];
  if (existsSync(REDIRECTS_INPUT)) {
    redirects = loadYaml(readFileSync(REDIRECTS_INPUT, 'utf-8')) || [];
  }

  const redirectsOutput = `// Auto-generated by scripts/build-posts.mjs — do not edit manually
import { Redirect } from '../models/redirect.model';

export const REDIRECTS: Redirect[] = ${JSON.stringify(redirects, null, 2)};
`;

  writeFileSync(REDIRECTS_OUTPUT, redirectsOutput, 'utf-8');
  console.log(`Generated ${redirects.length} redirects → src/app/data/redirects.ts`);

  // Build CV data
  let cv = {};
  if (existsSync(CV_INPUT)) {
    const cvSource = loadYaml(readFileSync(CV_INPUT, 'utf-8')) || {};
    cv = renderCvMarkdown(cvSource);
  }

  const cvOutput = `// Auto-generated by scripts/build-posts.mjs — do not edit manually
import { CvData } from '../models/cv.model';

export const CV_DATA: CvData = ${JSON.stringify(cv, null, 2)};
`;

  writeFileSync(CV_OUTPUT, cvOutput, 'utf-8');
  console.log(`Generated CV data → src/app/data/cv.ts`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
