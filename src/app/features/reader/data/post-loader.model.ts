import { InjectionToken } from '@angular/core';
import type { PostContent } from '../../../../contracts/post.model';

export type PostContentLoaderMap = ReadonlyMap<string, () => Promise<PostContent>>;

export const POST_CONTENT_LOADERS = new InjectionToken<PostContentLoaderMap>(
  'POST_CONTENT_LOADERS',
);
