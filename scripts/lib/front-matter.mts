import { JSON_SCHEMA, load as loadYaml } from 'js-yaml';
import type { PostSummary } from '../../src/app/models/post.model';

export type PostMetadata = Omit<PostSummary, 'slug'> & { draft?: boolean };

const REQUIRED_FIELDS = ['title', 'date', 'description'];
const OPTIONAL_FIELDS = ['coverImage', 'draft'];
const ALLOWED_FIELDS = new Set([...REQUIRED_FIELDS, ...OPTIONAL_FIELDS]);
const OPENING_DELIMITER = /^---[ \t]*(?:\r?\n|$)/;
const CLOSING_DELIMITER = /^---[ \t]*(?:\r?\n|$)/gm;

function fail(sourceName: string, message: string): never {
  throw new Error(`${sourceName}: ${message}`);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function validateMetadata(
  metadata: Record<string, unknown>,
  sourceName: string,
): asserts metadata is PostMetadata {
  for (const key of Object.keys(metadata)) {
    if (!ALLOWED_FIELDS.has(key)) {
      fail(sourceName, `unsupported front matter field "${key}"`);
    }
  }

  for (const field of REQUIRED_FIELDS) {
    const value = metadata[field];
    if (typeof value !== 'string' || !value.trim()) {
      fail(sourceName, `front matter field "${field}" must be a non-empty string`);
    }
  }

  if (!isCalendarDate(metadata['date'])) {
    fail(sourceName, 'front matter field "date" must be a valid YYYY-MM-DD date');
  }

  if (
    metadata['coverImage'] !== undefined &&
    (typeof metadata['coverImage'] !== 'string' || !metadata['coverImage'].trim())
  ) {
    fail(sourceName, 'front matter field "coverImage" must be a non-empty string');
  }

  if (metadata['draft'] !== undefined && typeof metadata['draft'] !== 'boolean') {
    fail(sourceName, 'front matter field "draft" must be a boolean');
  }
}

export function parsePostSource(
  source: string,
  sourceName = 'post',
): { metadata: PostMetadata; body: string } {
  if (typeof source !== 'string') {
    fail(sourceName, 'source must be a string');
  }

  const text = source.startsWith('\uFEFF') ? source.slice(1) : source;
  const opening = OPENING_DELIMITER.exec(text);
  if (!opening) {
    fail(sourceName, 'must start with YAML front matter delimited by "---"');
  }

  CLOSING_DELIMITER.lastIndex = opening[0].length;
  const closing = CLOSING_DELIMITER.exec(text);
  if (!closing) {
    fail(sourceName, 'YAML front matter is missing its closing "---" delimiter');
  }

  const yaml = text.slice(opening[0].length, closing.index);
  let metadata: unknown;
  try {
    metadata = loadYaml(yaml, { schema: JSON_SCHEMA });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    fail(sourceName, `invalid YAML front matter: ${detail}`);
  }

  if (!isPlainObject(metadata)) {
    fail(sourceName, 'YAML front matter must be a mapping');
  }

  validateMetadata(metadata, sourceName);

  return {
    metadata,
    body: text.slice(closing.index + closing[0].length),
  };
}
