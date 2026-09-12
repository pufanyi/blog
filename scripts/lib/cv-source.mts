import { JSON_SCHEMA, load } from 'js-yaml';
import type { CvData } from '../../src/app/models/cv.model';

type Validator = (value: unknown, path: string) => void;

const text: Validator = (value, path) => {
  if (typeof value !== 'string') throw new Error(`${path}: expected a string`);
};
const boolean: Validator = (value, path) => {
  if (typeof value !== 'boolean') throw new Error(`${path}: expected a boolean`);
};
const optional =
  (validate: Validator): Validator =>
  (value, path) => {
    if (value !== undefined) validate(value, path);
  };
const array =
  (validate: Validator): Validator =>
  (value, path) => {
    if (!Array.isArray(value)) throw new Error(`${path}: expected an array`);
    value.forEach((entry, index) => validate(entry, `${path}[${index}]`));
  };
const object =
  (fields: Record<string, Validator>): Validator =>
  (value, path) => {
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw new Error(`${path}: expected an object`);
    const record = value as Record<string, unknown>;
    for (const field of Object.keys(record)) {
      if (!Object.hasOwn(fields, field)) throw new Error(`${path}.${field}: unknown field`);
    }
    for (const [field, validate] of Object.entries(fields))
      validate(record[field], `${path}.${field}`);
  };

const validateCv = object({
  header: object({
    name: text,
    photo: text,
    affiliation: array(text),
    contact: array(object({ icon: text, text, href: text })),
    links: array(object({ icon: text, href: text, label: text, internal: optional(boolean) })),
  }),
  abstract: object({ paragraphs: array(text), keywords: optional(array(text)) }),
  sections: array(
    object({
      title: text,
      id: optional(text),
      content: optional(text),
      entries: optional(
        array(
          object({
            title: text,
            date: text,
            detail: optional(text),
            location: optional(text),
            links: optional(array(object({ text, href: text }))),
            items: optional(array(text)),
          }),
        ),
      ),
      subsections: optional(array(object({ title: text, items: array(text) }))),
    }),
  ),
});

export function parseCvSource(source: string, sourceName = 'content/cv.yaml'): CvData {
  const data: unknown = load(source, { schema: JSON_SCHEMA });
  validateCv(data, sourceName);
  return data as CvData;
}
