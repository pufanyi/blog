import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type BundledLanguage, bundledLanguages, type Highlighter } from 'shiki';

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_QUOTE_LINES = 500;
const hash = (value: string) => createHash('sha256').update(value).digest('hex');

export interface GitHubCodeLink {
  url: string;
  rawUrl: string;
  repository: string;
  commit: string;
  path: string;
  start: number;
  end: number;
}

/** Only immutable public GitHub file links with an explicit line selection expand. */
export function parseGitHubCodeLink(value: string): GitHubCodeLink | undefined {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return;
  }
  if (
    url.origin !== 'https://github.com' ||
    url.username ||
    url.password ||
    (url.search && url.search !== '?plain=1')
  )
    return;
  const file = /^\/([\w.-]+)\/([\w.-]+)\/blob\/([a-f\d]{40})\/(.+)$/i.exec(url.pathname);
  const lines = /^#L(\d+)(?:-L(\d+))?$/.exec(url.hash);
  if (!file || !lines) return;
  const start = Number(lines[1]);
  const end = Number(lines[2] ?? lines[1]);
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 1 || end < start)
    throw new Error('Line range must use positive, ascending line numbers');
  if (end - start + 1 > MAX_QUOTE_LINES)
    throw new Error(`Code quotes may contain at most ${MAX_QUOTE_LINES} lines`);
  const path = decodeURIComponent(file[4]);
  if (
    path.split('/').some((part) => !part || part === '.' || part === '..') ||
    [...path].some((character) => character.charCodeAt(0) < 32 || character === '\\')
  )
    throw new Error('Invalid GitHub file path');
  const repository = `${file[1]}/${file[2]}`;
  const commit = file[3].toLowerCase();
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  return {
    url: `https://github.com/${repository}/blob/${commit}/${encodedPath}${url.search}${url.hash}`,
    rawUrl: `https://raw.githubusercontent.com/${repository}/${commit}/${encodedPath}`,
    repository,
    commit,
    path,
    start,
    end,
  };
}

function validateText(text: string): string {
  if (Buffer.byteLength(text) > MAX_FILE_BYTES) throw new Error('Source file exceeds 2 MiB');
  if (text.includes('\0')) throw new Error('Source file is not text');
  return text;
}

/** Cache complete immutable files so separate ranges and concurrent articles share one fetch. */
export function createGitHubCodeLoader(
  cacheDirectory = fileURLToPath(new URL('../../.generated/github-code-cache', import.meta.url)),
  fetchFile: typeof fetch = fetch,
) {
  const pending = new Map<string, Promise<string>>();
  async function load(link: GitHubCodeLink): Promise<string> {
    const cachePath = join(cacheDirectory, `${hash(link.rawUrl)}.json`);
    try {
      const cached = JSON.parse(await readFile(cachePath, 'utf8'));
      if (
        cached.url === link.rawUrl &&
        typeof cached.text === 'string' &&
        cached.checksum === hash(cached.text)
      )
        return validateText(cached.text);
    } catch {
      // Missing or corrupt cache entries are refetched; failed fetches are never cached.
    }
    const response = await fetchFile(link.rawUrl, {
      signal: AbortSignal.timeout(15_000),
      redirect: 'error',
    });
    if (!response.ok) throw new Error(`GitHub returned HTTP ${response.status}`);
    if (!response.body) throw new Error('GitHub returned an empty response');
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > MAX_FILE_BYTES) throw new Error('Source file exceeds 2 MiB');
        chunks.push(value);
      }
    } finally {
      await reader.cancel();
    }
    const text = validateText(
      new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks)),
    );
    await mkdir(cacheDirectory, { recursive: true });
    const temporary = `${cachePath}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporary, JSON.stringify({ url: link.rawUrl, text, checksum: hash(text) }));
      await rename(temporary, cachePath);
    } finally {
      await rm(temporary, { force: true });
    }
    return text;
  }
  return (link: GitHubCodeLink): Promise<string> => {
    let result = pending.get(link.rawUrl);
    if (!result) {
      result = load(link).catch((error: unknown) => {
        pending.delete(link.rawUrl);
        throw error;
      });
      pending.set(link.rawUrl, result);
    }
    return result;
  };
}

const loadGitHubCode = createGitHubCodeLoader();
export type GitHubCodeLoader = typeof loadGitHubCode;

export function githubCodeLanguage(path: string): string {
  const extension = extname(path).slice(1).toLowerCase();
  const aliases: Record<string, string> = {
    h: 'c',
    hh: 'cpp',
    hpp: 'cpp',
    cc: 'cpp',
    cxx: 'cpp',
    hxx: 'cpp',
    m: 'objective-c',
  };
  const name = aliases[extension] ?? (extension || path.split('/').at(-1)!.toLowerCase());
  return Object.hasOwn(bundledLanguages, name) ? name : 'text';
}

interface MarkdownNode {
  type: string;
  children?: MarkdownNode[];
  url?: string;
  value?: string;
  lang?: string;
  position?: { start: { offset?: number; line: number; column: number }; end: { offset?: number } };
  data?: { hName?: string; hProperties?: Record<string, string | number> };
}

function standaloneLink(node: MarkdownNode, source: string) {
  const link = node.children?.[0];
  const position = link?.position;
  // Source spelling distinguishes GFM bare links from explicit [label](url) links.
  if (
    node.type === 'paragraph' &&
    node.children?.length === 1 &&
    link?.type === 'link' &&
    link.url &&
    position &&
    source.slice(position.start.offset, position.end.offset) === link.url
  )
    return { url: link.url, position };
  return undefined;
}

/** Permit the quote syntax without disabling literal-URL checks for ordinary prose. */
export function remarkLintGitHubCode() {
  return (
    tree: MarkdownNode,
    file: {
      value: unknown;
      messages: { ruleId?: string; line?: number; column?: number }[];
    },
  ) => {
    const permitted = new Set<string>();
    function visit(node: MarkdownNode) {
      const link = standaloneLink(node, String(file.value));
      if (link) {
        try {
          if (parseGitHubCodeLink(link.url))
            permitted.add(`${link.position.start.line}:${link.position.start.column}`);
        } catch {
          // The content compiler reports invalid quote ranges with source context.
        }
      }
      for (const child of node.children ?? []) visit(child);
    }
    visit(tree);
    file.messages = file.messages.filter(
      (message) =>
        message.ruleId !== 'no-literal-urls' || !permitted.has(`${message.line}:${message.column}`),
    );
  };
}

export function remarkGitHubCode(options: {
  highlighter: Highlighter;
  sourcePath: string;
  loadFile?: GitHubCodeLoader;
}) {
  return async (tree: MarkdownNode, file: { value: unknown }) => {
    const source = String(file.value);
    async function visit(parent: MarkdownNode): Promise<void> {
      for (const [index, node] of (parent.children ?? []).entries()) {
        const link = standaloneLink(node, source);
        const position = link?.position;
        if (!link || !position) {
          await visit(node);
          continue;
        }
        try {
          const reference = parseGitHubCodeLink(link.url);
          if (!reference) continue;
          const fullText = await (options.loadFile ?? loadGitHubCode)(reference);
          const lines = fullText.replace(/\r\n?/g, '\n').split('\n');
          if (lines.at(-1) === '') lines.pop();
          if (reference.end > lines.length)
            throw new Error(`Line ${reference.end} is outside the file (${lines.length} lines)`);
          const text = lines.slice(reference.start - 1, reference.end).join('\n');
          const lang = githubCodeLanguage(reference.path);
          if (lang !== 'text') await options.highlighter.loadLanguage(lang as BundledLanguage);
          const range =
            reference.start === reference.end
              ? `L${reference.start}`
              : `L${reference.start}–L${reference.end}`;
          parent.children![index] = {
            type: 'blockquote',
            data: { hName: 'figure', hProperties: { className: 'github-code' } },
            children: [
              {
                type: 'paragraph',
                data: { hName: 'figcaption', hProperties: { className: 'github-code-source' } },
                children: [
                  {
                    type: 'link',
                    url: reference.url,
                    children: [
                      { type: 'text', value: `${reference.repository} / ${reference.path}` },
                    ],
                  },
                  {
                    type: 'text',
                    value: ` · ${range} · ${reference.commit.slice(0, 7)}`,
                  },
                ],
              },
              {
                type: 'code',
                lang,
                value: text,
                data: { hProperties: { 'data-github-start': reference.start } },
              },
            ],
          };
        } catch (error) {
          throw new Error(
            `${options.sourcePath}:${position.start.line}: GitHub code quote ${link.url}: ${error instanceof Error ? error.message : String(error)}`,
            { cause: error },
          );
        }
      }
    }
    await visit(tree);
  };
}
