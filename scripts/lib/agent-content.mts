import type { SiteConfig } from '../../src/app/models/config.model';
import type { CvData } from '../../src/app/models/cv.model';
import type { PostSummary } from '../../src/app/models/post.model';
import { blogDirectoryPath, buildBlogDirectories } from '../../src/app/utils/blog-directories';
import { comparePostsByPublication } from '../../src/app/utils/blog-pagination';
import { htmlToAgentMarkdown } from './agent-markdown.mts';
import { publishGeneratedFiles } from './generated-files.mts';

export interface AgentPost extends PostSummary {
  markdownHtml: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function link(label: string, url: string): string {
  return `<a href="${escapeHtml(url)}">${escapeHtml(label)}</a>`;
}

function paragraph(text: string): string {
  return `<p>${escapeHtml(text)}</p>`;
}

function list(items: string[]): string {
  return items.length ? `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>` : '';
}

/** Rich-text fields have already passed through the same renderer as the visible CV. */
export function renderProfileMarkdown(cv: CvData, site: SiteConfig): string {
  const { header, abstract, sections } = cv;
  const html = [
    `<h1>${escapeHtml(header.name)}</h1>`,
    `<p>${link('Homepage', `${site.url}/`)} · ${link('Curriculum Vitae', `${site.url}/cv`)}</p>`,
    ...header.affiliation.map(paragraph),
    list(header.contact.map((item) => link(item.text, item.href))),
    list(header.links.map((item) => link(item.label, item.href))),
    '<h2>About</h2>',
    ...abstract.paragraphs.map((value) => `<p>${value}</p>`),
    ...(abstract.keywords?.length ? [paragraph(`Keywords: ${abstract.keywords.join(', ')}`)] : []),
  ];
  for (const section of sections) {
    html.push(`<h2>${escapeHtml(section.title)}</h2>`);
    if (section.content) html.push(`<p>${section.content}</p>`);
    for (const entry of section.entries ?? []) {
      html.push(`<h3>${escapeHtml(entry.title)}</h3>`, paragraph(entry.date));
      if (entry.detail) html.push(`<p>${entry.detail}</p>`);
      if (entry.location) html.push(paragraph(entry.location));
      html.push(list((entry.links ?? []).map((item) => link(item.text, item.href))));
      html.push(list(entry.items ?? []));
    }
    for (const subsection of section.subsections ?? []) {
      html.push(`<h3>${escapeHtml(subsection.title)}</h3>`, list(subsection.items));
    }
  }
  return htmlToAgentMarkdown(html.join('\n'), `${site.url}/`);
}

export function buildAgentFiles(
  posts: AgentPost[],
  cv: CvData,
  site: SiteConfig,
): Map<string, string> {
  const files = new Map<string, string>();
  const sorted = [...posts].sort(comparePostsByPublication);
  const index = [
    `<h1>${escapeHtml(site.title)} — Article index</h1>`,
    paragraph(`${sorted.length} published articles, newest first.`),
    `<p>${link('Browse the blog', `${site.url}/blog`)}</p>`,
  ];
  for (const post of sorted) {
    if (
      !/^[a-z\d][a-z\d_-]*(?:\/[a-z\d][a-z\d_-]*)*$/i.test(post.slug) ||
      post.slug.split('/').at(-1) === 'index'
    ) {
      throw new Error(`Post slug cannot be exported as Markdown: ${post.slug}`);
    }
    const canonical = `${site.url}/blog/${post.slug}`;
    const path = `blog/${post.slug}.md`;
    if (files.has(path)) throw new Error(`Duplicate Markdown export: ${path}`);
    const header = [
      `<h1>${escapeHtml(post.title)}</h1>`,
      paragraph(`Author: ${site.author.name}`),
      paragraph(`Published: ${post.date}`),
      ...(post.updated ? [paragraph(`Updated: ${post.updated}`)] : []),
      `<p>Canonical: ${link(canonical, canonical)}</p>`,
      ...(post.description ? [paragraph(post.description)] : []),
    ].join('\n');
    files.set(path, htmlToAgentMarkdown(`${header}\n${post.markdownHtml}`, canonical));
    index.push(
      `<h2>${link(post.title, `${canonical}.md`)}</h2>`,
      paragraph(post.date),
      ...(post.updated ? [paragraph(`Updated: ${post.updated}`)] : []),
      ...(post.description ? [paragraph(post.description)] : []),
      `<p>${link('Original article', canonical)}</p>`,
    );
  }
  files.set('blog/index.md', htmlToAgentMarkdown(index.join('\n'), `${site.url}/blog`));
  for (const directory of buildBlogDirectories(posts)) {
    const path = blogDirectoryPath(directory.slug);
    const canonical = `${site.url}${path}`;
    const html = [
      `<h1>${escapeHtml(directory.name)}</h1>`,
      paragraph(
        `${directory.postCount} posts${directory.date ? ` · Latest post: ${directory.date}` : ''}`,
      ),
      `<p>${link('Browse directory', canonical)}</p>`,
      list(
        directory.entries.map(
          (entry) =>
            `${link(entry.title + (entry.kind === 'directory' ? '/' : ''), `${site.url}${entry.kind === 'directory' ? `${blogDirectoryPath(entry.slug)}/index.md` : `/blog/${entry.slug}.md`}`)} — Date: ${entry.date}`,
        ),
      ),
    ].join('\n');
    files.set(`${path.slice(1)}/index.md`, htmlToAgentMarkdown(html, canonical));
  }
  files.set('profile.md', renderProfileMarkdown(cv, site));
  files.set(
    'llms.txt',
    htmlToAgentMarkdown(
      [
        `<h1>${escapeHtml(site.title)}</h1>`,
        `<blockquote>${paragraph(site.description)}</blockquote>`,
        paragraph(
          'This site contains the author’s profile, CV, and blog. Markdown exports are generated from the same content as the website.',
        ),
        paragraph(
          'Start with the profile or article index, then read individual articles as needed. Each article includes its canonical web URL for citation. Equations use LaTeX; diagrams include available descriptions and links to the originals; embedded PDFs link directly to the files.',
        ),
        '<h2>Profile</h2>',
        list([
          `${link('Profile and CV', `${site.url}/profile.md`)}: Biography, research, education, experience, and external profiles.`,
        ]),
        '<h2>Blog</h2>',
        list([
          `${link('Article index', `${site.url}/blog/index.md`)}: Titles, descriptions, publication dates, and Markdown links for all published articles.`,
          `${link('Contents', `${site.url}/blog/contents/index.md`)}: Browse articles by directory.`,
          `${link('Atom feed', `${site.url}/atom.xml`)}: Published and updated articles, with summaries and links to HTML and Markdown.`,
          `${link('RSS feed', `${site.url}/feed.xml`)}: Subscribe to article updates.`,
        ]),
      ].join('\n'),
      `${site.url}/`,
    ),
  );
  return files;
}

/** Write only into the dedicated generated asset directory, pruning removed/draft posts. */
export function writeAgentFiles(directory: string, files: Map<string, string>): void {
  publishGeneratedFiles([{ directory, files }]);
}
