import {
  transformerNotationDiff,
  transformerNotationHighlight,
} from '@shikijs/transformers';

export function createCodeRenderer(highlighter) {
  return function code({ text, lang }) {
    const language = lang && highlighter.getLoadedLanguages().includes(lang) ? lang : 'text';
    const html = highlighter.codeToHtml(text, {
      lang: language,
      themes: { light: 'github-light', dark: 'github-dark' },
      transformers: [
        transformerNotationDiff(),
        transformerNotationHighlight(),
      ],
    });
    const langLabel = language !== 'text' ? language : 'code';
    return `<div class="code-block"><div class="code-header"><span class="code-lang">${langLabel}</span><button class="code-copy" type="button" aria-label="Copy code">Copy</button></div>${html}</div>`;
  };
}
