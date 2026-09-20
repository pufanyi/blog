export type HeadTagName = 'link' | 'meta';

export interface HeadElement {
  tagName: HeadTagName;
  attributes: Readonly<Record<string, string>>;
}

function isWhitespace(character: string | undefined): boolean {
  return character !== undefined && /[\t\n\f\r ]/.test(character);
}

function decodeAttribute(value: string): string {
  const named: Readonly<Record<string, string>> = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    quot: '"',
  };
  return value.replace(
    /&(?:#(\d+)|#x([\da-f]+)|([a-z][\da-z]+));/gi,
    (entity, decimal, hex, name) => {
      if (name) return named[name.toLowerCase()] ?? entity;
      const codePoint = Number.parseInt(decimal ?? hex, decimal ? 10 : 16);
      return Number.isSafeInteger(codePoint) && codePoint > 0 && codePoint <= 0x10ffff
        ? String.fromCodePoint(codePoint)
        : entity;
    },
  );
}

function findTagEnd(html: string, start: number): number {
  let quote: '"' | "'" | undefined;
  for (let index = start; index < html.length; index++) {
    const character = html[index];
    if (quote) {
      if (character === quote) quote = undefined;
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === '>') {
      return index;
    }
  }
  return -1;
}

function parseAttributes(source: string): Readonly<Record<string, string>> {
  const attributes: Record<string, string> = {};
  let index = 0;
  while (index < source.length) {
    while (isWhitespace(source[index]) || source[index] === '/') index++;
    if (index >= source.length) break;

    const nameStart = index;
    while (
      index < source.length &&
      !isWhitespace(source[index]) &&
      !['=', '/', '>'].includes(source[index] ?? '')
    )
      index++;
    const name = source.slice(nameStart, index).toLowerCase();
    if (!name) {
      index++;
      continue;
    }
    while (isWhitespace(source[index])) index++;

    let value = '';
    if (source[index] === '=') {
      index++;
      while (isWhitespace(source[index])) index++;
      const quote = source[index];
      if (quote === '"' || quote === "'") {
        index++;
        const valueStart = index;
        while (index < source.length && source[index] !== quote) index++;
        value = source.slice(valueStart, index);
        if (source[index] === quote) index++;
      } else {
        const valueStart = index;
        while (index < source.length && !isWhitespace(source[index]) && source[index] !== '>')
          index++;
        value = source.slice(valueStart, index);
      }
    }
    if (!Object.hasOwn(attributes, name)) attributes[name] = decodeAttribute(value);
  }
  return attributes;
}

/** Read deployment metadata without constructing a DOM for the potentially large article body. */
export function parseHeadElements(html: string): readonly HeadElement[] {
  const opening = /<head(?:\s|>)/i.exec(html);
  if (!opening) return [];
  const openingEnd = findTagEnd(html, opening.index);
  if (openingEnd < 0) return [];
  const closingStart = html.toLowerCase().indexOf('</head', openingEnd + 1);
  if (closingStart < 0) return [];

  const head = html.slice(openingEnd + 1, closingStart);
  const elements: HeadElement[] = [];
  const tag = /<(link|meta)\b/gi;
  for (let match = tag.exec(head); match; match = tag.exec(head)) {
    const end = findTagEnd(head, match.index);
    if (end < 0) break;
    elements.push({
      tagName: match[1].toLowerCase() as HeadTagName,
      attributes: parseAttributes(head.slice(tag.lastIndex, end)),
    });
    tag.lastIndex = end + 1;
  }
  return elements;
}
