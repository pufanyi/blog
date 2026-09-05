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
  description: string;
  coverImage?: string;
}

export interface PostContent {
  contentHtml: string;
  toc: PostTocItem[];
}

export interface Post extends PostSummary, PostContent {}
