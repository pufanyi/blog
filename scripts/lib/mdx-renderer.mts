import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { evaluate } from '@mdx-js/mdx';
import { JSDOM } from 'jsdom';
import type { MDXComponents } from 'mdx/types';
import { createElement } from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import rehypeCitation, { Cite } from 'rehype-citation';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import type { Highlighter } from 'shiki';
import { createCodeRenderer } from './code-renderer.mts';
import { getSvgDimensions, type ImageDimensions } from './image-dimensions.mts';
import { buildTableOfContents } from './toc-renderer.mts';

const POSTS_DIR = fileURLToPath(new URL('../../content/posts', import.meta.url));
const POST_ASSET_BASE = '/posts';
interface CitationAuthor {
  given?: string;
  family?: string;
  literal?: string;
  'non-dropping-particle'?: string;
}
interface CitationRecord {
  id: string;
  title?: string;
  author?: CitationAuthor[];
  issued?: { 'date-parts'?: (string | number)[][] };
  URL?: string;
  DOI?: string;
}
const imageDimensions = new Map<string, ImageDimensions | null>();

async function loadPostComponents(sourcePath: string): Promise<MDXComponents> {
  const postDirectory = dirname(sourcePath);
  const scriptsDirectory = join(postDirectory, 'scripts');
  if (!existsSync(scriptsDirectory)) {
    return {};
  }

  const componentFiles = readdirSync(scriptsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.post-component.tsx'))
    .map((entry) => entry.name)
    .sort();
  const components: MDXComponents = {};

  for (const file of componentFiles) {
    const componentPath = join(scriptsDirectory, file);
    const module = await import(pathToFileURL(componentPath).href);
    const exported = module.POST_COMPONENTS as MDXComponents | undefined;
    if (!exported || typeof exported !== 'object' || Array.isArray(exported)) {
      throw new Error(`${componentPath} must export a POST_COMPONENTS object`);
    }

    for (const [name, component] of Object.entries(exported)) {
      if (name in components) {
        throw new Error(`Duplicate post component "${name}" in ${scriptsDirectory}`);
      }
      components[name] = component;
    }
  }

  return components;
}

function isRootedOrRemoteHref(href: string) {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/|#|\/)/i.test(href);
}

export function normalizePostImageHref(href: string, slug: string) {
  if (isRootedOrRemoteHref(href)) {
    return href;
  }

  const localHref = href.replace(/^\.\//, '');
  if (localHref.startsWith(`${slug}/`)) {
    return `${POST_ASSET_BASE}/${localHref}`;
  }

  return `${POST_ASSET_BASE}/${slug}/${localHref}`;
}

function resolvePostAssetPath(href: string, slug: string) {
  if (isRootedOrRemoteHref(href)) {
    return null;
  }

  const localHref = href.replace(/^\.\//, '');
  if (localHref.startsWith(`${slug}/`)) {
    return join(POSTS_DIR, localHref);
  }

  return join(POSTS_DIR, slug, localHref);
}

function getImageDimensions(href: string, slug: string): ImageDimensions | null {
  const file = resolvePostAssetPath(href, slug);
  if (!file || !existsSync(file)) {
    return null;
  }

  if (imageDimensions.has(file)) {
    return imageDimensions.get(file) ?? null;
  }

  const svgDimensions = getSvgDimensions(file);
  if (svgDimensions) {
    imageDimensions.set(file, svgDimensions);
    return svgDimensions;
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

function replaceWithHtml(document: Document, node: Element, html: string) {
  const template = document.createElement('template');
  template.innerHTML = html;
  node.replaceWith(template.content);
}

function formatCitationAuthors(authors: CitationAuthor[] = []) {
  return authors
    .map(
      ({ given, family, literal, 'non-dropping-particle': particle }) =>
        literal ?? [given, particle, family].filter(Boolean).join(' '),
    )
    .filter(Boolean)
    .join(', ');
}

function compactCitationUrls(document: Document, entry: HTMLElement) {
  const walker = document.createTreeWalker(entry, 4);
  const textNodes: Text[] = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode as Text);

  for (const textNode of textNodes) {
    const text = textNode.textContent ?? '';
    const matches = [...text.matchAll(/https?:\/\/[^\s]+/g)];
    if (matches.length === 0) continue;

    const fragment = document.createDocumentFragment();
    let offset = 0;
    for (const match of matches) {
      const start = match.index;
      const rawUrl = match[0];
      const url = rawUrl.replace(/[),.;]+$/, '');
      const trailing = rawUrl.slice(url.length);
      fragment.append(text.slice(offset, start));

      const anchor = document.createElement('a');
      anchor.className = 'citation-source-link';
      anchor.href = url;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.title = url;
      try {
        anchor.textContent = new URL(url).hostname.replace(/^www\./, '');
      } catch {
        anchor.textContent = 'Source';
      }
      fragment.append(anchor, trailing);
      offset = start + rawUrl.length;
    }
    fragment.append(text.slice(offset));
    textNode.replaceWith(fragment);
  }
}

function addCitationMetadata(document: Document, citations: CitationRecord[]) {
  for (const citation of citations) {
    const entry = document.getElementById(`bib-${citation.id.toLowerCase()}`);
    if (!entry) continue;

    const year = citation.issued?.['date-parts']?.[0]?.[0];
    const metadata = {
      title: citation.title,
      authors: formatCitationAuthors(citation.author),
      year,
      url: citation.URL,
      doi: citation.DOI,
    };
    for (const [name, value] of Object.entries(metadata)) {
      if (value !== undefined && value !== null && value !== '') {
        entry.dataset[name] = String(value);
      }
    }
    compactCitationUrls(document, entry);
  }
}

function repairCollapsedCitationLinks(document: Document, citations: CitationRecord[]) {
  const citationYears = new Map(
    citations.flatMap((citation) => {
      const year = citation.issued?.['date-parts']?.[0]?.[0];
      return year === undefined || year === null ? [] : [[citation.id.toLowerCase(), String(year)]];
    }),
  );

  for (const anchor of document.querySelectorAll('[id^="citation--"] a[href^="#bib-"]')) {
    if (/[\p{L}\p{N}]/u.test(anchor.textContent ?? '')) continue;

    const citation = anchor.closest('[id^="citation--"]');
    const href = anchor.getAttribute('href');
    const citationId = href?.slice('#bib-'.length).toLowerCase();
    const year = citationId ? citationYears.get(citationId) : undefined;
    if (!citation || !year) continue;

    const walker = document.createTreeWalker(citation, 4);
    let yearNode;
    let yearOffset = -1;
    while (walker.nextNode()) {
      const candidate = walker.currentNode as Text;
      if (candidate.parentElement?.closest('a[href^="#bib-"]')) continue;

      const offset = (candidate.textContent ?? '').indexOf(year);
      if (offset === -1) continue;

      yearNode = candidate;
      yearOffset = offset;
      break;
    }
    if (!yearNode) continue;

    const text = yearNode.textContent ?? '';
    const leadingText = text.slice(0, yearOffset);
    const trailingText = text.slice(yearOffset + year.length);
    anchor.replaceWith(document.createTextNode(anchor.textContent ?? ''));
    anchor.textContent = year;
    yearNode.replaceWith(
      document.createTextNode(leadingText),
      anchor,
      document.createTextNode(trailingText),
    );
  }
}

function ensureBibliographyHeading(document: Document) {
  for (const bibliography of document.querySelectorAll('.references.csl-bib-body')) {
    const previous = bibliography.previousElementSibling;
    const isReferencesHeading =
      previous?.matches('h1, h2, h3, h4, h5, h6') &&
      previous.textContent?.trim().toLowerCase() === 'references';

    if (isReferencesHeading && previous?.tagName === 'H2') {
      continue;
    }

    const heading = document.createElement('h2');
    heading.textContent = 'References';
    if (isReferencesHeading && previous) {
      previous.replaceWith(heading);
    } else {
      bibliography.before(heading);
    }
  }
}

function postprocessMdxHtml(
  html: string,
  slug: string,
  highlighter: Highlighter,
  citations: CitationRecord[] = [],
) {
  const dom = new JSDOM(`<body>${html}</body>`);
  const { document } = dom.window;
  addCitationMetadata(document, citations);
  repairCollapsedCitationLinks(document, citations);
  ensureBibliographyHeading(document);

  // React 19 may emit image preload hints during static rendering. Angular owns
  // the document shell, so post content should contain only authored content.
  for (const preload of document.querySelectorAll('link[rel="preload"][as="image"]')) {
    preload.remove();
  }

  for (const code of Array.from(document.querySelectorAll('code.math-inline'))) {
    const span = document.createElement('span');
    span.className = 'math-inline';
    span.textContent = `\\(${code.textContent ?? ''}\\)`;
    code.replaceWith(span);
  }

  for (const code of Array.from(document.querySelectorAll('code.math-display'))) {
    const container = code.parentElement?.tagName === 'PRE' ? code.parentElement : code;
    const div = document.createElement('div');
    div.className = 'math-display';
    div.textContent = `\\[\n${code.textContent ?? ''}\n\\]`;
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
  for (const anchor of document.querySelectorAll('a[href^="#"]')) {
    const href = anchor.getAttribute('href');
    if (href) {
      anchor.setAttribute('href', `${postPath}${href}`);
    }
  }
  const toc = buildTableOfContents(document, postPath);
  return { html: document.body.innerHTML, toc };
}

export async function renderMdx(
  mdx: string,
  slug: string,
  sourcePath: string,
  highlighter: Highlighter,
) {
  const components = await loadPostComponents(sourcePath);
  const bibliography = join(dirname(sourcePath), 'references.bib');
  const hasBibliography = existsSync(bibliography);
  const citations: CitationRecord[] = hasBibliography
    ? new Cite(readFileSync(bibliography, 'utf8'), { generateGraph: false }).data
    : [];
  const rehypePlugins: NonNullable<Parameters<typeof evaluate>[1]>['rehypePlugins'] =
    hasBibliography
      ? [
          [
            rehypeCitation,
            {
              bibliography: 'references.bib',
              path: dirname(sourcePath),
              csl: 'apa',
              linkCitations: true,
            },
          ],
        ]
      : [];
  const module = await evaluate(mdx, {
    ...jsxRuntime,
    baseUrl: pathToFileURL(sourcePath),
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins,
  });
  const html = renderToStaticMarkup(createElement(module.default, { components }));
  return postprocessMdxHtml(html, slug, highlighter, citations);
}
