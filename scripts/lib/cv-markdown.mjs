import { Marked } from 'marked';

const markdown = new Marked();

export function renderCvInlineMarkdown(value) {
  return markdown.parseInline(value, { async: false });
}

function renderOptional(value) {
  return typeof value === 'string' ? renderCvInlineMarkdown(value) : value;
}

export function renderCvMarkdown(cv) {
  return {
    ...cv,
    abstract: cv.abstract
      ? {
          ...cv.abstract,
          paragraphs: cv.abstract.paragraphs?.map(renderCvInlineMarkdown),
        }
      : cv.abstract,
    sections: cv.sections?.map((section) => ({
      ...section,
      content: renderOptional(section.content),
      entries: section.entries?.map((entry) => ({
        ...entry,
        detail: renderOptional(entry.detail),
        items: entry.items?.map(renderCvInlineMarkdown),
      })),
      subsections: section.subsections?.map((subsection) => ({
        ...subsection,
        items: subsection.items?.map(renderCvInlineMarkdown),
      })),
    })),
  };
}
