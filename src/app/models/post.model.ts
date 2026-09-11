export type PostTocLevel = 2 | 3;

export interface PostTocItem {
  id: string;
  text: string;
  level: PostTocLevel;
  children: PostTocItem[];
}

export interface PostSummary {
  slug: string;
  title: string;
  date: string;
  updated?: string;
  description?: string;
  /** Generated from the opening paragraphs, never authored in front matter. */
  excerptHtml?: string;
  coverImage?: string;
}

export interface PostContent {
  contentHtml: string;
  toc: PostTocItem[];
}

export interface Post extends PostSummary, PostContent {}
