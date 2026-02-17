function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export const mathBlock = {
  name: 'mathBlock',
  level: 'block',
  start(src) { return src.match(/\$\$/)?.index; },
  tokenizer(src) {
    const match = src.match(/^\$\$([\s\S]+?)\$\$/);
    if (match) {
      return { type: 'mathBlock', raw: match[0], text: match[1].trim() };
    }
  },
  renderer(token) {
    return `<div class="math-display">\\[${escapeHtml(token.text)}\\]</div>\n`;
  },
};

export const mathInline = {
  name: 'mathInline',
  level: 'inline',
  start(src) { return src.match(/\$/)?.index; },
  tokenizer(src) {
    const match = src.match(/^\$([^\$\n]+?)\$/);
    if (match) {
      return { type: 'mathInline', raw: match[0], text: match[1] };
    }
  },
  renderer(token) {
    return `\\(${escapeHtml(token.text)}\\)`;
  },
};
