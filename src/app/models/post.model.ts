export type PostTocLevel = 2 | 3;

export interface PostTocItem {
  id: string;
  text: string;
  level: PostTocLevel;
  children: PostTocItem[];
}

export interface Post {
  slug: string;
  title: string;
  date: string;
  description: string;
  contentHtml: string;
  toc: PostTocItem[];
  coverImage?: string;
}
