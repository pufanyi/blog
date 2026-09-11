import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { load as loadYaml } from 'js-yaml';
import type { BlogConfig, CommentsConfig, SiteConfig } from '../../src/app/models/config.model';
import type { Redirect } from '../../src/app/models/redirect.model';

function fail(path: string, message: string): never {
  throw new Error(`${path}: ${message}`);
}

function record(value: unknown, keys: readonly string[], path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return fail(path, 'expected a YAML mapping');
  }
  for (const key of Object.keys(value)) {
    if (!keys.includes(key)) fail(`${path}.${key}`, 'unknown setting');
  }
  return value as Record<string, unknown>;
}

function string(value: unknown, path: string): string {
  if (typeof value !== 'string' || !value.trim()) return fail(path, 'expected a non-empty string');
  return value;
}

function boolean(value: unknown, path: string): boolean {
  if (typeof value !== 'boolean') return fail(path, 'expected true or false (without quotes)');
  return value;
}

function httpUrl(value: unknown, path: string): URL {
  const text = string(value, path);
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return fail(path, 'expected an absolute http(s) URL');
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    return fail(path, 'expected an absolute http(s) URL without credentials');
  }
  return url;
}

export function parseSiteConfig(value: unknown, path = 'configs/site.yaml'): SiteConfig {
  const data = record(
    value,
    ['url', 'title', 'description', 'defaultImage', 'author', 'footer'],
    path,
  );
  const url = httpUrl(data['url'], `${path}.url`);
  if (url.pathname !== '/' || url.search || url.hash)
    fail(`${path}.url`, 'use the site origin, without a path, query, or fragment');
  const image = string(data['defaultImage'], `${path}.defaultImage`);
  if (!/^\/(?!\/)/.test(image)) httpUrl(image, `${path}.defaultImage`);
  const author = record(
    data['author'],
    ['name', 'citationName', 'citationKeyPrefix'],
    `${path}.author`,
  );
  const prefix = string(author['citationKeyPrefix'], `${path}.author.citationKeyPrefix`);
  if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(prefix))
    fail(`${path}.author.citationKeyPrefix`, 'use a letter followed by letters or digits');
  const footer = record(data['footer'], ['lastUpdated', 'sourceCodeUrl'], `${path}.footer`);
  return {
    url: url.origin,
    title: string(data['title'], `${path}.title`),
    description: string(data['description'], `${path}.description`),
    defaultImage: image,
    author: {
      name: string(author['name'], `${path}.author.name`),
      citationName: string(author['citationName'], `${path}.author.citationName`),
      citationKeyPrefix: prefix,
    },
    footer: {
      lastUpdated: string(footer['lastUpdated'], `${path}.footer.lastUpdated`),
      sourceCodeUrl: httpUrl(footer['sourceCodeUrl'], `${path}.footer.sourceCodeUrl`).href,
    },
  };
}

export function parseBlogConfig(value: unknown, path = 'configs/blog.yaml'): BlogConfig {
  const data = record(
    value,
    ['postsPerPage', 'description', 'showExcerpts', 'showCoverImages', 'showDates', 'showCitation'],
    path,
  );
  const pageSize = data['postsPerPage'];
  if (typeof pageSize !== 'number' || !Number.isSafeInteger(pageSize) || pageSize < 1) {
    return fail(`${path}.postsPerPage`, 'expected a positive integer');
  }
  return {
    postsPerPage: pageSize,
    description: string(data['description'], `${path}.description`),
    showExcerpts: boolean(data['showExcerpts'], `${path}.showExcerpts`),
    showCoverImages: boolean(data['showCoverImages'], `${path}.showCoverImages`),
    showDates: boolean(data['showDates'], `${path}.showDates`),
    showCitation: boolean(data['showCitation'], `${path}.showCitation`),
  };
}

export function parseCommentsConfig(
  value: unknown,
  path = 'configs/comments.yaml',
): CommentsConfig {
  const data = record(
    value,
    [
      'enabled',
      'repo',
      'repoId',
      'category',
      'categoryId',
      'language',
      'reactionsEnabled',
      'inputPosition',
    ],
    path,
  );
  const repo = string(data['repo'], `${path}.repo`);
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) fail(`${path}.repo`, 'expected owner/repository');
  const position = data['inputPosition'];
  if (position !== 'top' && position !== 'bottom')
    return fail(`${path}.inputPosition`, 'expected top or bottom');
  return {
    enabled: boolean(data['enabled'], `${path}.enabled`),
    repo,
    repoId: string(data['repoId'], `${path}.repoId`),
    category: string(data['category'], `${path}.category`),
    categoryId: string(data['categoryId'], `${path}.categoryId`),
    language: string(data['language'], `${path}.language`),
    reactionsEnabled: boolean(data['reactionsEnabled'], `${path}.reactionsEnabled`),
    inputPosition: position,
  };
}

export function parseRedirects(value: unknown, path = 'configs/redirects.yaml'): Redirect[] {
  if (!Array.isArray(value)) return fail(path, 'expected a list (use [] for no redirects)');
  const seen = new Set<string>();
  return value.map((item: unknown, index) => {
    const at = `${path}[${index}]`;
    const data = record(item, ['from', 'to', 'title'], at);
    const from = string(data['from'], `${at}.from`).replace(/^\/+|\/+$/g, '');
    if (!from || /[\s:*?#\\]/.test(from))
      fail(`${at}.from`, 'expected a route path without spaces or wildcards');
    if (seen.has(from)) fail(`${at}.from`, `duplicate route: ${from}`);
    seen.add(from);
    return {
      from,
      to: httpUrl(data['to'], `${at}.to`).href,
      title: string(data['title'], `${at}.title`),
    };
  });
}

function readYaml(path: string): unknown {
  try {
    return loadYaml(readFileSync(path, 'utf8'));
  } catch (error) {
    return fail(path, error instanceof Error ? error.message : String(error));
  }
}

export function loadRedirects(directory: string): Redirect[] {
  const path = join(directory, 'redirects.yaml');
  return parseRedirects(readYaml(path), path);
}

export function loadSiteConfiguration(directory: string) {
  const sitePath = join(directory, 'site.yaml');
  const blogPath = join(directory, 'blog.yaml');
  const commentsPath = join(directory, 'comments.yaml');
  return {
    site: parseSiteConfig(readYaml(sitePath), sitePath),
    blog: parseBlogConfig(readYaml(blogPath), blogPath),
    comments: parseCommentsConfig(readYaml(commentsPath), commentsPath),
    redirects: loadRedirects(directory),
  };
}
