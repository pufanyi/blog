import { transformerNotationDiff, transformerNotationHighlight } from '@shikijs/transformers';
import { readFileSync } from 'fs';

const CATPPUCCIN_THEME_URL = new URL('../../src/styles/catppuccin.css', import.meta.url);
let catppuccinColorMap;

function getCatppuccinColorMap() {
  if (catppuccinColorMap) return catppuccinColorMap;

  const css = readFileSync(CATPPUCCIN_THEME_URL, 'utf-8');
  catppuccinColorMap = new Map();

  for (const match of css.matchAll(/--ctp-([a-z0-9-]+):\s*(#[0-9a-f]{6})/gi)) {
    const [, name, color] = match;
    catppuccinColorMap.set(color.toLowerCase(), `var(--ctp-${name})`);
  }

  return catppuccinColorMap;
}

function replaceInlineCatppuccinColors(html) {
  const colors = getCatppuccinColorMap();

  return html.replace(/style="([^"]*)"/g, (attribute, style) => {
    const nextStyle = style.replace(/#[0-9a-f]{6}\b/gi, (color) => {
      return colors.get(color.toLowerCase()) ?? color;
    });

    return attribute.replace(style, nextStyle);
  });
}

export function createCodeRenderer(highlighter) {
  return function code({ text, lang }) {
    const language = lang && highlighter.getLoadedLanguages().includes(lang) ? lang : 'text';
    const html = replaceInlineCatppuccinColors(
      highlighter.codeToHtml(text, {
        lang: language,
        themes: { light: 'catppuccin-latte', dark: 'catppuccin-mocha' },
        transformers: [transformerNotationDiff(), transformerNotationHighlight()],
      }),
    );
    const langLabel = language !== 'text' ? language : 'code';
    return `<div class="code-block"><div class="code-header"><span class="code-lang">${langLabel}</span><button class="code-copy" type="button" aria-label="Copy code">Copy</button></div>${html}</div>`;
  };
}
