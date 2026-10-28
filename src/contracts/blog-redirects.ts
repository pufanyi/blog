/** Keep old article URLs available in both client routing and prerendered HTML. */
export const BLOG_REDIRECTS = [
  { path: 'ml/notes/image-compression', redirectTo: '/blog/ml/notes/media-compression' },
  {
    path: 'ml/notes/video-compression',
    redirectTo:
      '/blog/ml/notes/media-compression#%E8%A7%86%E9%A2%91%E5%9C%A8%E7%A9%BA%E9%97%B4%E9%A2%84%E6%B5%8B%E4%B9%8B%E5%A4%96%E5%86%8D%E5%80%9F%E7%94%A8%E5%B7%B2%E9%87%8D%E5%BB%BA%E7%9A%84%E6%97%B6%E9%97%B4',
  },
  { path: 'ml/ml-revisit/muon', redirectTo: '/blog/ml/ml-revisit/optm/muon' },
  { path: 'contents/ml/ml-revisit/rl', redirectTo: '/blog/ml/ml-revisit/rl' },
  {
    path: 'ml/ml-revisit/rl/policy-gradient',
    redirectTo: '/blog/ml/ml-revisit/rl-policy-gradient#policy-gradient-algorithms',
  },
  { path: 'contents/ml/ml-revisit/ssl', redirectTo: '/blog/ml/ml-revisit/ssl' },
  { path: 'ml/ml-revisit/ssl/overview', redirectTo: '/blog/ml/ml-revisit/ssl' },
  {
    path: 'ml/ml-revisit/ssl/contrastive',
    redirectTo: '/blog/ml/ml-revisit/ssl#contrastive-learning',
  },
  {
    path: 'ml/ml-revisit/ssl/non-contrastive',
    redirectTo: '/blog/ml/ml-revisit/ssl#non-contrastive-learning',
  },
  {
    path: 'ml/ml-revisit/ssl/clustering-distillation',
    redirectTo: '/blog/ml/ml-revisit/ssl#clustering-and-self-distillation',
  },
  {
    path: 'ml/ml-revisit/ssl/masked-modeling',
    redirectTo: '/blog/ml/ml-revisit/ssl#masked-image-modeling',
  },
  { path: 'ml/ml-revisit/ssl/jepa', redirectTo: '/blog/ml/ml-revisit/ssl#jepa' },
  { path: 'ml/ml-revisit/ssl/lejepa', redirectTo: '/blog/ml/ml-revisit/ssl#lejepa' },
  {
    path: 'chess/antichess/rules-and-principles',
    redirectTo: '/blog/chess/antichess/principles',
  },
] as const;
