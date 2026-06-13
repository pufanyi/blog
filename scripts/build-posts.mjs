import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import yaml from 'js-yaml';
import { JSDOM } from 'jsdom';
import { Marked } from 'marked';
import { basename, join } from 'path';
import { createHighlighter } from 'shiki';
import { createCodeRenderer } from './lib/code-renderer.mjs';
import { mathBlock, mathInline } from './lib/math-extensions.mjs';
import { tableRenderer } from './lib/table-renderer.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const CONFIG_DIR = join(ROOT, 'content/config');
const POSTS_DIR = join(ROOT, 'content/posts');
const DATA_DIR = join(ROOT, 'src/app/data');
const OUTPUT = join(DATA_DIR, 'posts.ts');
const REDIRECTS_INPUT = join(ROOT, 'content/redirects.yaml');
const REDIRECTS_OUTPUT = join(DATA_DIR, 'redirects.ts');
const CV_INPUT = join(ROOT, 'content/cv.yaml');
const CV_OUTPUT = join(DATA_DIR, 'cv.ts');
const POST_ASSET_BASE = '/posts';
const DEFAULT_AI_IMAGE_LABEL = 'AI Summary';
const imageDimensions = new Map();

// Collect languages used across all posts for Shiki
function collectLangs(posts) {
  const langs = new Set();
  for (const md of posts) {
    for (const match of md.matchAll(/```(\w+)/g)) {
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

function escapeAttribute(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function insertAfter(referenceNode, newNode) {
  referenceNode.parentNode?.insertBefore(newNode, referenceNode.nextSibling);
}

function renderAiImageFigures(html, slug) {
  const dom = new JSDOM(`<body>${html}</body>`);
  const { document } = dom.window;
  let aiImageCount = 0;

  for (const node of Array.from(document.querySelectorAll('ai-img'))) {
    const rawHref = node.getAttribute('src') || node.textContent || '';
    const href = rawHref.trim();

    if (!href) {
      node.remove();
      continue;
    }

    const label = node.getAttribute('label')?.trim() || DEFAULT_AI_IMAGE_LABEL;
    const src = normalizePostImageHref(href, slug);
    const targetId = `ai-summary-${slug}-${aiImageCount}`;
    aiImageCount += 1;

    const button = document.createElement('button');
    button.className = 'ai-summary-button';
    button.type = 'button';
    button.title = node.getAttribute('title')?.trim() || `Show ${label}`;
    button.setAttribute('aria-label', `${label}: ${href}`);
    button.setAttribute('aria-controls', targetId);
    button.setAttribute('aria-expanded', 'false');

    const icon = document.createElement('i');
    icon.className = 'ph ph-magic-wand';
    icon.setAttribute('aria-hidden', 'true');

    const text = document.createElement('span');
    text.textContent = label;

    button.append(icon, text);

    const figure = document.createElement('figure');
    figure.className = 'ai-summary-figure';
    figure.id = targetId;
    figure.hidden = true;

    const image = document.createElement('img');
    image.className = 'ai-summary-image';
    image.src = src;
    image.alt = node.getAttribute('alt')?.trim() || label;
    const dimensions = getImageDimensions(href, slug);
    const width = node.getAttribute('width')?.trim() || dimensions?.width;
    const height = node.getAttribute('height')?.trim() || dimensions?.height;
    if (width && height) {
      image.setAttribute('width', String(width));
      image.setAttribute('height', String(height));
    }
    image.setAttribute('loading', 'lazy');
    image.setAttribute('decoding', 'async');
    image.setAttribute('data-zoom-src', src);

    figure.append(image);

    const target = node.closest('h1,h2,h3,h4,h5,h6') || node.parentElement;
    node.replaceWith(button);

    if (target) {
      insertAfter(target, figure);
    } else {
      button.after(figure);
    }
  }

  return document.body.innerHTML;
}

function renderMarkdown(md, slug, highlighter) {
  // Custom image renderer: publishes post-local assets from content/posts/<slug>.
  const imageRenderer = (token) => {
    const src = normalizePostImageHref(token.href, slug);
    const alt = token.text || '';
    const title = token.title ? ` title="${escapeAttribute(token.title)}"` : '';
    const dimensions = getImageDimensions(token.href, slug);
    const sizeAttrs = dimensions
      ? ` width="${dimensions.width}" height="${dimensions.height}"`
      : '';
    return `<img src="${escapeAttribute(src)}" alt="${escapeAttribute(alt)}"${title}${sizeAttrs} loading="lazy" decoding="async" data-zoom-src="${escapeAttribute(src)}">`;
  };

  const renderer = new Marked({
    extensions: [mathBlock, mathInline],
    renderer: {
      code: createCodeRenderer(highlighter),
      table: tableRenderer,
      image: imageRenderer,
    },
  });

  const html = renderer.parse(md, { async: false });
  return renderAiImageFigures(html, slug);
}

async function main() {
  mkdirSync(DATA_DIR, { recursive: true });

  const configFiles = readdirSync(CONFIG_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort();

  const rawPosts = configFiles.map((file) => {
    const slug = basename(file, '.json');
    const meta = JSON.parse(readFileSync(join(CONFIG_DIR, file), 'utf-8'));
    const md = readFileSync(join(POSTS_DIR, `${slug}.md`), 'utf-8');
    return { slug, meta, md };
  });

  // Create Shiki highlighter with all needed languages
  const langs = collectLangs(rawPosts.map((p) => p.md));
  const highlighter = await createHighlighter({
    themes: ['catppuccin-latte', 'catppuccin-mocha'],
    langs: langs.length ? langs : ['text'],
  });

  const posts = rawPosts.map(({ slug, meta, md }) => {
    const contentHtml = renderMarkdown(md, slug, highlighter);
    return { slug, ...meta, contentHtml };
  });

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
    redirects = yaml.load(readFileSync(REDIRECTS_INPUT, 'utf-8')) || [];
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
    cv = yaml.load(readFileSync(CV_INPUT, 'utf-8')) || {};
  }

  const cvOutput = `// Auto-generated by scripts/build-posts.mjs — do not edit manually
import { CvData } from '../models/cv.model';

export const CV_DATA: CvData = ${JSON.stringify(cv, null, 2)};
`;

  writeFileSync(CV_OUTPUT, cvOutput, 'utf-8');
  console.log(`Generated CV data → src/app/data/cv.ts`);
}

main();
