import { BLOG_CONFIG } from '../data/blog-config';
import { POSTS } from '../data/posts';
import { paginatePosts } from '../utils/blog-pagination';

export function loadBlogPage(page: string | null) {
  return paginatePosts(POSTS, page, BLOG_CONFIG.postsPerPage);
}
