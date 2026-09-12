import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import { Marked } from 'marked';
import { createHighlighter } from 'shiki';
import { type DocSummary, docMarkdownPath, docPath } from '../../src/app/models/doc.model';
import { htmlToAgentMarkdown } from './agent-markdown.mts';
import { createCodeRenderer } from './code-renderer.mts';
import { treeFiles } from './content-cache.mts';
import { buildTableOfContents } from './toc-renderer.mts';

interface Navigation {
  sourceUrl: string;
  groups: { title: string; pages: string[] }[];
}

function navigation(value: unknown): Navigation {
  if (!value || typeof value !== 'object') throw new Error('docs/navigation.json: expected object');
  const { sourceUrl, groups } = value as Partial<Navigation>;
  if (typeof sourceUrl !== 'string' || !/^https:\/\/[^?#]+$/.test(sourceUrl))
    throw new Error('docs/navigation.json: sourceUrl must be an HTTPS repository source URL');
  if (
    !Array.isArray(groups) ||
    !groups.length ||
    groups.some(
      (group) =>
        !group ||
        typeof group.title !== 'string' ||
        !group.title.trim() ||
        !Array.isArray(group.pages) ||
        !group.pages.length ||
        group.pages.some(
          (file: unknown) =>
            typeof file !== 'string' || !/^(?:[a-z\d_-]+\/)*[a-z\d_-]+\.md$/.test(file),
        ),
    )
  )
    throw new Error('docs/navigation.json: groups need titles and Markdown file paths');
  if (new Set(groups.map((group) => group.title)).size !== groups.length)
    throw new Error('docs/navigation.json: duplicate group title');
  return { sourceUrl: sourceUrl.replace(/\/$/, ''), groups };
}

/** Compile the repository's public handbook without importing any document into the shell. */
export async function buildDocs(root: string, siteUrl: string) {
  const directory = join(root, 'docs');
  const dataFiles = new Map<string, string>();
  const agentFiles = new Map<string, string>();
  const summaries: DocSummary[] = [];
  const sourceFiles = new Map<string, boolean>();
  const entries = new Map<string, { summary: DocSummary; dom: JSDOM }>();
  const config = existsSync(directory)
    ? navigation(JSON.parse(readFileSync(join(directory, 'navigation.json'), 'utf8')))
    : { sourceUrl: '', groups: [] };
  const listed = config.groups.flatMap((group) => group.pages);
  const discovered = treeFiles(directory)
    .filter((file) => file.endsWith('.md'))
    .map((file) => relative(directory, file));
  if (new Set(listed).size !== listed.length)
    throw new Error('docs/navigation.json: duplicate page');
  if (listed.length !== discovered.length || discovered.some((file) => !listed.includes(file)))
    throw new Error('docs/navigation.json must list every Markdown file exactly once');
  if (listed.length && listed[0] !== 'index.md')
    throw new Error('docs/navigation.json: the first page must be index.md');
  const highlighter = await createHighlighter({
    themes: ['catppuccin-latte', 'catppuccin-mocha'],
    langs: [
      'bash',
      'typescript',
      'tsx',
      'json',
      'yaml',
      'markdown',
      'mdx',
      'css',
      'html',
      'bibtex',
    ],
  });
  const code = createCodeRenderer(highlighter);
  const markdown = new Marked({ gfm: true });
  try {
    for (const group of config.groups) {
      for (const file of group.pages) {
        if (file !== 'index.md' && file.endsWith('/index.md'))
          throw new Error(
            `docs/${file}: use a descriptive filename; index.md is reserved for the landing page`,
          );
        const source = readFileSync(join(directory, file), 'utf8');
        const slug = file === 'index.md' ? '' : file.slice(0, -3);
        const dom = new JSDOM(await markdown.parse(source));
        entries.set(file, {
          summary: {
            slug,
            title: '',
            description: '',
            group: group.title,
            sourceUrl: `${config.sourceUrl}/docs/${file}`,
          },
          dom,
        });
        const { document } = dom.window;
        const headings = document.querySelectorAll('h1');
        if (
          headings.length !== 1 ||
          document.body.firstElementChild !== headings[0] ||
          !headings[0].textContent?.trim()
        )
          throw new Error(`docs/${file}: start with exactly one level-one title`);
        const summary = entries.get(file)!.summary;
        summary.title = headings[0].textContent.trim();
        summary.description =
          document.querySelector('p')?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 240) ?? '';
        buildTableOfContents(document, docPath(slug));
        summaries.push(summary);
      }
    }
    for (const [file, { summary, dom }] of entries) {
      const { document } = dom.window;
      for (const element of document.querySelectorAll('a[href], img[src]')) {
        const attribute = element.tagName === 'A' ? 'href' : 'src';
        const href = element.getAttribute(attribute)!;
        if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href)) continue;
        const [pathname, fragment] = href.split('#');
        let targetFile: string | undefined;
        if (/^\/docs(?:\/|$)/.test(pathname)) {
          const path = pathname.replace(/\/$/, '');
          targetFile = [...entries].find(([, entry]) => docPath(entry.summary.slug) === path)?.[0];
          if (!targetFile) throw new Error(`docs/${file}: missing documentation link ${href}`);
        } else if (pathname.startsWith('/')) {
          continue;
        } else {
          const target = pathname
            ? resolve(directory, dirname(file), decodeURIComponent(pathname))
            : join(directory, file);
          if (!target.startsWith(`${resolve(root)}/`))
            throw new Error(`docs/${file}: link escapes repository: ${href}`);
          targetFile = relative(directory, target);
          if (!entries.has(targetFile)) {
            if (!existsSync(target))
              throw new Error(`docs/${file}: missing repository link ${href}`);
            const sourcePath = relative(root, target).split('/').map(encodeURIComponent).join('/');
            const isDirectory = statSync(target).isDirectory();
            sourceFiles.set(target, isDirectory);
            const base = isDirectory
              ? config.sourceUrl.replace('/blob/', '/tree/')
              : config.sourceUrl;
            element.setAttribute(
              attribute,
              `${base}/${sourcePath}${fragment ? `#${fragment}` : ''}`,
            );
            continue;
          }
        }
        const entry = entries.get(targetFile)!;
        if (fragment && !entry.dom.window.document.getElementById(decodeURIComponent(fragment)))
          throw new Error(`docs/${file}: missing heading in ${href}`);
        element.setAttribute(
          attribute,
          `${docPath(entry.summary.slug)}${fragment ? `#${fragment}` : ''}`,
        );
      }
      // Export before UI controls and syntax spans can change the meaning of examples.
      agentFiles.set(
        docMarkdownPath(summary.slug).slice(1),
        htmlToAgentMarkdown(document.body.innerHTML, `${siteUrl}${docPath(summary.slug)}`),
      );
      document.querySelector('h1')!.remove();
      for (const pre of document.querySelectorAll('pre')) {
        const content = pre.querySelector('code');
        if (content)
          pre.outerHTML = code({
            text: content.textContent?.replace(/\n$/, '') ?? '',
            lang: content.className.replace(/^language-/, ''),
          });
      }
      for (const table of document.querySelectorAll('table')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'table-wrapper';
        wrapper.tabIndex = 0;
        wrapper.setAttribute('role', 'region');
        wrapper.setAttribute('aria-label', 'Scrollable table');
        table.replaceWith(wrapper);
        wrapper.append(table);
      }
      const toc = buildTableOfContents(document, docPath(summary.slug));
      const module = `docs/${summary.slug || 'index'}`;
      const modelPath = `${'../'.repeat((summary.slug || 'index').split('/').length + 1)}models/post.model`;
      dataFiles.set(
        `${module}.ts`,
        `// Generated; edit docs/${file}.\nimport type { PostContent } from '${modelPath}';\nexport default ${JSON.stringify({ contentHtml: document.body.innerHTML, toc })} satisfies PostContent;\n`,
      );
    }
    dataFiles.set(
      'docs.ts',
      `// Generated from docs/navigation.json and Markdown titles.\nimport type { DocSummary } from '../models/doc.model';\nexport const DOCS: DocSummary[] = ${JSON.stringify(summaries)};\n`,
    );
    dataFiles.set(
      'doc-loaders.ts',
      `// Generated; document bodies stay lazy.\nimport type { PostContent } from '../models/post.model';\nexport const DOC_LOADERS = new Map<string, () => Promise<PostContent>>([\n${summaries.map(({ slug }) => `[${JSON.stringify(slug)}, () => import(${JSON.stringify(`./docs/${slug || 'index'}`)}).then(m => m.default)],`).join('\n')}\n]);\n`,
    );
    return { summaries, dataFiles, agentFiles, sourceFiles: [...sourceFiles] };
  } finally {
    highlighter.dispose();
    for (const entry of entries.values()) entry.dom.window.close();
  }
}
