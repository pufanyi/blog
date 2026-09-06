export interface SiteConfig {
  url: string;
  title: string;
  description: string;
  defaultImage: string;
  author: {
    name: string;
    citationName: string;
    citationKeyPrefix: string;
  };
  footer: {
    lastUpdated: string;
    sourceCodeUrl: string;
  };
}

export interface BlogConfig {
  postsPerPage: number;
  description: string;
  showDescriptions: boolean;
  showCoverImages: boolean;
  showDates: boolean;
  showCitation: boolean;
}

export interface CommentsConfig {
  enabled: boolean;
  repo: string;
  repoId: string;
  category: string;
  categoryId: string;
  language: string;
  reactionsEnabled: boolean;
  inputPosition: 'top' | 'bottom';
}
