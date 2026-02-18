export type TocLevel = 2 | 3;

export interface TocItem {
  id: string;
  text: string;
  level: TocLevel;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function makeUniqueId(base: string, usedIds: Map<string, number>): string {
  const count = usedIds.get(base) ?? 0;
  usedIds.set(base, count + 1);
  return count === 0 ? base : `${base}-${count}`;
}

export function buildContentWithToc(rawHtml: string): { html: string; toc: TocItem[] } {
  if (typeof DOMParser === 'undefined') {
    return { html: rawHtml, toc: [] };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');
  const usedIds = new Map<string, number>();
  const toc: TocItem[] = [];

  for (const heading of Array.from(doc.querySelectorAll<HTMLHeadingElement>('h2, h3'))) {
    const text = heading.textContent?.trim() ?? '';
    if (!text) {
      continue;
    }

    const level = Number(heading.tagName.slice(1)) as TocLevel;
    const baseId = heading.id.trim() || slugify(text);
    const id = makeUniqueId(baseId || 'section', usedIds);
    heading.id = id;
    toc.push({ id, text, level });
  }

  return { html: doc.body.innerHTML, toc };
}
