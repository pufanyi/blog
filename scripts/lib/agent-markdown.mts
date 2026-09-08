import { JSDOM } from 'jsdom';
import rehypeParse from 'rehype-parse';
import rehypeRemark from 'rehype-remark';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';

const markdown = unified()
  .use(rehypeParse, { fragment: true })
  .use(rehypeRemark, {
    handlers: {
      pre: (_state, node) => ({
        type: 'code',
        lang: String(node.properties['dataAgentLanguage'] || '') || null,
        value: String(node.properties['dataAgentCode']),
      }),
      span: (state, node) =>
        node.properties['dataAgentMath'] === undefined
          ? state.all(node)
          : { type: 'inlineMath', value: String(node.properties['dataAgentMath']) },
      div: (state, node) =>
        node.properties['dataAgentMath'] === undefined
          ? state.toFlow(state.all(node))
          : { type: 'math', value: String(node.properties['dataAgentMath']) },
      sup: (state, node) => [
        { type: 'html', value: '<sup>' },
        ...state.all(node),
        { type: 'html', value: '</sup>' },
      ],
      sub: (state, node) => [
        { type: 'html', value: '<sub>' },
        ...state.all(node),
        { type: 'html', value: '</sub>' },
      ],
    },
  })
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkStringify, { bullet: '-', emphasis: '*', fences: true });

function mathElement(document: Document, value: string, display: boolean): Element {
  const element = document.createElement(display ? 'div' : 'span');
  element.setAttribute('data-agent-math', value);
  // Keep an inline text child so HTML whitespace normalization preserves adjacent spaces.
  element.textContent = value;
  return element;
}

function preserveMath(document: Document): void {
  for (const element of document.querySelectorAll('.math-inline, .math-display')) {
    const display = element.classList.contains('math-display');
    const delimited = element.textContent ?? '';
    const inner = delimited.slice(2, -2);
    const value = display ? inner.replace(/^\n|\n$/g, '') : inner;
    element.replaceWith(mathElement(document, value, display));
  }

  // Post-local components and CV rich text can also author MathJax delimiters directly.
  const walker = document.createTreeWalker(document.body, 4);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  for (const node of nodes) {
    if (node.parentElement?.closest('pre, code, [data-agent-math]')) continue;
    const text = node.textContent ?? '';
    const matches = [...text.matchAll(/\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]/g)];
    if (!matches.length) continue;
    const fragment = document.createDocumentFragment();
    let offset = 0;
    for (const match of matches) {
      fragment.append(text.slice(offset, match.index));
      fragment.append(mathElement(document, match[1] ?? match[2] ?? '', match[2] !== undefined));
      offset = match.index + match[0].length;
    }
    fragment.append(text.slice(offset));
    node.replaceWith(fragment);
  }
}

function describeDiagrams(document: Document, canonical: string): void {
  for (const svg of document.querySelectorAll('svg')) {
    const description = document.createElement('div');
    const seen = new Set<string>();
    for (const element of svg.querySelectorAll('title, desc, text, foreignObject')) {
      const text = element.textContent?.replace(/\s+/g, ' ').trim();
      if (!text || seen.has(text)) continue;
      seen.add(text);
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      description.append(paragraph);
    }
    const link = document.createElement('a');
    const id = svg.closest('[id]')?.id;
    link.href = id ? `${canonical}#${encodeURIComponent(id)}` : canonical;
    link.textContent = 'View diagram in the original article';
    description.append(link);
    svg.replaceWith(description);
  }
}

function linkEmbeds(document: Document, canonical: string): void {
  for (const embed of document.querySelectorAll('iframe, video, audio, object, embed')) {
    const source =
      embed.getAttribute('src') ??
      embed.getAttribute('data') ??
      embed.querySelector('source')?.getAttribute('src');
    if (!source) continue;
    let url = new URL(source, canonical);
    if (url.origin === new URL(canonical).origin && url.pathname === '/pdf-viewer') {
      const file = url.searchParams.get('file');
      if (file) url = new URL(file, canonical);
    }
    const paragraph = document.createElement('p');
    const link = document.createElement('a');
    link.href = url.href;
    link.textContent =
      embed.getAttribute('title') || (/\.pdf$/i.test(url.pathname) ? 'PDF' : 'Embedded media');
    paragraph.append(link);
    embed.replaceWith(paragraph);
  }
}

/** Convert expanded, unhighlighted article HTML, keeping semantic content and source links. */
export function htmlToAgentMarkdown(html: string, canonical: string): string {
  const dom = new JSDOM(`<body>${html}</body>`);
  try {
    const { document } = dom.window;
    for (const element of document.querySelectorAll(
      'script, style, link, button, .heading-permalink, .code-header, [data-footnote-backref]',
    ))
      element.remove();
    for (const element of document.querySelectorAll('i, em, b, strong')) {
      if (!element.textContent?.trim() && !element.querySelector('img')) element.remove();
    }
    describeDiagrams(document, canonical);
    // Diagram legends often separate adjacent labels with CSS gaps instead of text spaces.
    for (const label of document.querySelectorAll('figure span, figure strong')) {
      const next = label.nextSibling;
      if (next?.nodeType === 1 && (next as Element).matches('span, strong')) label.after(' ');
    }
    linkEmbeds(document, canonical);
    preserveMath(document);
    for (const pre of document.querySelectorAll('pre')) {
      const code = pre.querySelector('code');
      const text = (code ?? pre).textContent ?? '';
      const language = [...(code?.classList ?? [])].find((name) => name.startsWith('language-'));
      pre.setAttribute('data-agent-code', text.endsWith('\n') ? text.slice(0, -1) : text);
      pre.setAttribute('data-agent-language', language?.slice('language-'.length) ?? '');
    }
    for (const element of document.querySelectorAll('a[href], img[src]')) {
      const attribute = element.tagName === 'A' ? 'href' : 'src';
      const value = element.getAttribute(attribute);
      if (value) element.setAttribute(attribute, new URL(value, canonical).href);
    }
    return String(markdown.processSync(document.body.innerHTML));
  } finally {
    dom.window.close();
  }
}
