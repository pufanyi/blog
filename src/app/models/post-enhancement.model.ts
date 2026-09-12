export interface PostEnhancementModule {
  enhancePost(container: HTMLElement): () => void;
}

export type PostEnhancementLoader = () => Promise<PostEnhancementModule>;
