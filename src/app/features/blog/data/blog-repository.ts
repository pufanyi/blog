import { paginatePosts } from '../../../../contracts/blog-pagination';
import { BLOG_CONFIG } from '../../../data/blog-config';
import { POSTS } from '../../../data/posts';

export function loadBlogPage(page: string | null) {
  return paginatePosts(POSTS, page, BLOG_CONFIG.postsPerPage);
}
