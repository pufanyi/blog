import { POSTS } from '../data/posts';
import { POST_LOADERS } from '../data/post-loaders';
import type { Post } from '../models/post.model';

const summaries = new Map(POSTS.map(post => [post.slug, post]));
const cache = new Map<string, Promise<Post>>();

export async function loadPost(slug: string): Promise<Post | null> {
  const summary = summaries.get(slug);
  const load = POST_LOADERS.get(slug);
  if (!summary || !load) return null;
  let pending = cache.get(slug);
  if (!pending) {
    pending = load()
      .then(content => ({ ...summary, ...content }))
      .catch(error => {
        cache.delete(slug);
        throw error;
      });
    cache.set(slug, pending);
  }
  return pending;
}
