import { JSDOM } from 'jsdom';

const TOC_HEADING_SELECTOR = 'h2, h3';
const TOC_TEXT_EXCLUSIONS =
  '.ai-summary-button, .ai-summary-link, .heading-permalink, ai-img, [data-toc-ignore]';

export function slugifyHeading(text) {
  return text
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{Letter}\p{Number}\p{Mark}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .normalize('NFC');
}

function getHeadingText(heading) {
  const clone = heading.cloneNode(true);
  for (const element of clone.querySelectorAll(TOC_TEXT_EXCLUSIONS)) {
    element.remove();
  }

  return clone.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

function allocateId(base, usedIds, reservedIds, preserveBase) {
  let candidate = base;
  let suffix = 1;

  while (usedIds.has(candidate) || (!preserveBase && reservedIds.has(candidate))) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  usedIds.add(candidate);
  return candidate;
}

function appendPermalink(document, heading, id, text) {
  heading.querySelector('.heading-permalink')?.remove();

  const permalink = document.createElement('a');
  permalink.className = 'heading-permalink';
  permalink.setAttribute('href', `#${encodeURIComponent(id)}`);
  permalink.setAttribute('aria-label', `Link to section: ${text}`);
  permalink.setAttribute('title', 'Link to this section');

  const icon = document.createElement('i');
  icon.className = 'ph ph-link';
  icon.setAttribute('aria-hidden', 'true');
  permalink.append(icon);
  heading.append(permalink);
}

/**
 * Adds deterministic IDs and permalinks to article headings while building a
 * two-level table of contents. Doing this before Angular renders keeps SSR and
 * the hydrated browser DOM identical.
 */
export function buildTableOfContents(document) {
  const headings = Array.from(document.querySelectorAll(TOC_HEADING_SELECTOR));
  const headingSet = new Set(headings);
  const reservedIds = new Set(
    Array.from(document.querySelectorAll('[id]'))
      .map((element) => element.id.trim())
      .filter((id) => id.length > 0),
  );
  const usedIds = new Set(
    Array.from(document.querySelectorAll('[id]'))
      .filter((element) => !headingSet.has(element))
      .map((element) => element.id.trim())
      .filter((id) => id.length > 0),
  );
  const toc = [];
  let currentSection = null;

  for (const heading of headings) {
    const text = getHeadingText(heading);
    if (!text) {
      continue;
    }

    const level = Number(heading.tagName.slice(1));
    const explicitId = heading.id.trim();
    const baseId = explicitId || slugifyHeading(text) || 'section';
    const id = allocateId(baseId, usedIds, reservedIds, explicitId.length > 0);
    const item = { id, text, level, children: [] };

    heading.id = id;
    if (!heading.hasAttribute('tabindex')) {
      heading.setAttribute('tabindex', '-1');
    }
    appendPermalink(document, heading, id, text);

    if (level === 2) {
      toc.push(item);
      currentSection = item;
    } else if (currentSection) {
      currentSection.children.push(item);
    } else {
      // Keep malformed documents navigable when an h3 appears before any h2.
      toc.push(item);
    }
  }

  return toc;
}

export function renderTableOfContents(html) {
  const dom = new JSDOM(`<body>${html}</body>`);
  const { document } = dom.window;
  const toc = buildTableOfContents(document);
  return { html: document.body.innerHTML, toc };
}
