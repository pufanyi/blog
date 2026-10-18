import { fileURLToPath } from 'node:url';
import { createHighlighter } from 'shiki';
import { renderMdx } from '../../mdx-renderer.mts';

const url =
  'https://github.com/git/git/blob/c51408889c3b372814bc20b9431c3b74d0d268eb/blob.h#L8-L12';
const text =
  'struct blob {\n\tint value; // [!code --]\n\t// <script>literal source</script>\n\n};\n';
const highlighter = await createHighlighter({
  themes: ['catppuccin-latte', 'catppuccin-mocha'],
  langs: [],
});
try {
  const { html } = await renderMdx(
    url,
    'fixture',
    fileURLToPath(import.meta.url),
    highlighter,
    async () => `${'// preceding\n'.repeat(7)}${text}`,
  );
  process.stdout.write(JSON.stringify({ html, text }));
} finally {
  highlighter.dispose();
}
