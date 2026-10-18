export type PostTocLevel = 2 | 3;

export interface PostTocItem {
  id: string;
  text: string;
  /** Build-rendered heading label when it contains inline math. */
  labelHtml?: string;
  level: PostTocLevel;
  children: PostTocItem[];
}

export interface PostSummary {
  slug: string;
  title: string;
  date: string;
  updated?: string;
  authors?: string[];
  description?: string;
  /** Generated from the opening paragraphs, never authored in front matter. */
  excerptHtml?: string;
  coverImage?: string;
}

export interface PostContent {
  contentHtml: string;
  toc: PostTocItem[];
}

export interface Post extends PostSummary, PostContent {
  /** Only the initial browser visit can adopt the existing prerendered article. */
  prerendered?: boolean;
}
