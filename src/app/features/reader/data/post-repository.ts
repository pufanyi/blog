import type { Post } from '../../../../contracts/post.model';
import { POST_ROUTES } from '../../../data/post-routes';
import type { PostContentLoaderMap } from './post-loader.model';

const summaries = new Map(POST_ROUTES.map((post) => [post.slug, post]));
const cache = new Map<string, Promise<Post>>();

export async function loadPost(slug: string, loaders: PostContentLoaderMap): Promise<Post | null> {
  const summary = summaries.get(slug);
  const load = loaders.get(slug);
  if (!summary || !load) return null;
  let pending = cache.get(slug);
  if (!pending) {
    pending = load()
      .then((content) => ({ ...summary, ...content }))
      .catch((error) => {
        cache.delete(slug);
        throw error;
      });
    cache.set(slug, pending);
  }
  return pending;
}
