/** Keep old article URLs available in both client routing and prerendered HTML. */
export const BLOG_REDIRECTS = [
  { path: 'ml/ml-revisit/muon', redirectTo: '/blog/ml/ml-revisit/optm/muon' },
  { path: 'contents/ml/ml-revisit/ssl', redirectTo: '/blog/ml/ml-revisit/ssl' },
  { path: 'ml/ml-revisit/ssl/overview', redirectTo: '/blog/ml/ml-revisit/ssl' },
  { path: 'ml/ml-revisit/ssl/contrastive', redirectTo: '/blog/ml/ml-revisit/ssl#contrastive-learning' },
  { path: 'ml/ml-revisit/ssl/non-contrastive', redirectTo: '/blog/ml/ml-revisit/ssl#non-contrastive-learning' },
  { path: 'ml/ml-revisit/ssl/clustering-distillation', redirectTo: '/blog/ml/ml-revisit/ssl#clustering-and-self-distillation' },
  { path: 'ml/ml-revisit/ssl/masked-modeling', redirectTo: '/blog/ml/ml-revisit/ssl#masked-image-modeling' },
  { path: 'ml/ml-revisit/ssl/jepa', redirectTo: '/blog/ml/ml-revisit/ssl#jepa' },
  { path: 'ml/ml-revisit/ssl/lejepa', redirectTo: '/blog/ml/ml-revisit/ssl#lejepa' },
] as const;
