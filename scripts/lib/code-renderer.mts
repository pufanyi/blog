import { transformerNotationDiff, transformerNotationHighlight } from '@shikijs/transformers';
import type { Highlighter } from 'shiki';

const CATPPUCCIN_SOURCE_COLORS = {
  rose: ['#dc8a78', '#f5e0dc'],
  blush: ['#dd7878', '#f2cdcd'],
  pink: ['#ea76cb', '#f5c2e7'],
  mauve: ['#8839ef', '#cba6f7'],
  red: ['#d20f39', '#f38ba8'],
  maroon: ['#e64553', '#eba0ac'],
  clay: ['#fe640b', '#fab387'],
  ochre: ['#df8e1d', '#f9e2af'],
  sage: ['#40a02b', '#a6e3a1'],
  teal: ['#179299', '#94e2d5'],
  sky: ['#04a5e5', '#89dceb'],
  slate: ['#209fb5', '#74c7ec'],
  blue: ['#1e66f5', '#89b4fa'],
  lavender: ['#7287fd', '#b4befe'],
  text: ['#4c4f69', '#cdd6f4'],
  subtle: ['#5c5f77', '#bac2de', '#6c6f85', '#a6adc8'],
  muted: ['#7c7f93', '#9399b2', '#8c8fa1', '#7f849c', '#9ca0b0', '#6c7086'],
  surface: ['#acb0be', '#585b70', '#bcc0cc', '#45475a', '#ccd0da', '#313244'],
  background: ['#eff1f5', '#1e1e2e', '#e6e9ef', '#181825', '#dce0e8', '#11111b'],
};

const syntaxColorMap = new Map(
  Object.entries(CATPPUCCIN_SOURCE_COLORS).flatMap(([token, colors]) =>
    colors.map((color) => [color, `var(--syntax-${token})`] as const),
  ),
);

export function replaceInlineSyntaxColors(html: string): string {
  return html.replace(/style="([^"]*)"/g, (attribute: string, style: string) => {
    const nextStyle = style.replace(/#[0-9a-f]{6}\b/gi, (color: string) => {
      return syntaxColorMap.get(color.toLowerCase()) ?? color;
    });

    return attribute.replace(style, nextStyle);
  });
}

export function createCodeRenderer(highlighter: Highlighter) {
  return function code({ text, lang }: { text: string; lang: string }): string {
    const language = highlighter.getLoadedLanguages().find((loaded) => loaded === lang) ?? 'text';
    const html = replaceInlineSyntaxColors(
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
