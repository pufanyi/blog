import { JSDOM } from 'jsdom';
import { escapeXml } from './xml.mts';

interface ExcerptPart {
  text: string;
  math?: boolean;
}

function* inlineParts(node: Node): Generator<ExcerptPart> {
  if (node.nodeType === 3) {
    const text = (node.textContent ?? '').replace(/\s+/g, ' ');
    let offset = 0;
    for (const match of text.matchAll(/\\\([\s\S]*?\\\)/g)) {
      yield { text: text.slice(offset, match.index) };
      yield { text: match[0], math: true };
      offset = match.index + match[0].length;
    }
    yield { text: text.slice(offset) };
  } else if (node.nodeName === 'BR') {
    yield { text: ' ' };
  } else {
    for (const child of node.childNodes) yield* inlineParts(child);
  }
}

/** Opening prose only, with bounded text and intact inline TeX; links become plain text. */
export function buildPostExcerpt(html: string, maxLength = 400): string {
  const dom = new JSDOM(html);
  try {
    const { document } = dom.window;
    for (const element of document.querySelectorAll(
      'script, style, nav, figure, svg, pre, table, details, iframe, video, audio, object, .math-display, .csl-bib-body, [data-footnotes], [data-footnote-ref], [hidden], [aria-hidden="true"]',
    ))
      element.remove();

    const output: string[] = [];
    const words = new Intl.Segmenter(undefined, { granularity: 'word' });
    let length = 0;
    let pendingSpace = false;
    for (const paragraph of document.querySelectorAll('p')) {
      for (const part of [...inlineParts(paragraph), { text: ' ' }]) {
        const segments = part.math
          ? [part.text]
          : [...words.segment(part.text)].map((word) => word.segment);
        for (const segment of segments) {
          const space = /^\s*$/.test(segment);
          if (space) {
            if (segment) pendingSpace = length > 0;
            continue;
          }
          const addedLength = segment.length + (pendingSpace ? 1 : 0);
          if (length + addedLength > maxLength) return `${output.join('')}…`;
          if (pendingSpace) output.push(' ');
          output.push(
            part.math
              ? `<span class="math-inline">${escapeXml(segment)}</span>`
              : escapeXml(segment),
          );
          length += addedLength;
          pendingSpace = false;
        }
      }
    }
    return output.join('');
  } finally {
    dom.window.close();
  }
}
