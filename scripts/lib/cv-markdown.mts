import { Marked } from 'marked';
import type { CvData } from '../../src/app/models/cv.model';

const markdown = new Marked();

export function renderCvInlineMarkdown(value: string): string {
  return markdown.parseInline(value, { async: false });
}

function renderOptional(value: string | undefined): string | undefined {
  return typeof value === 'string' ? renderCvInlineMarkdown(value) : value;
}

export function renderCvMarkdown(cv: CvData): CvData {
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
