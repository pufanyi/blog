import { afterEach, expect, it, vi } from 'vitest';
import { ArticleRuntime } from './article-runtime';

afterEach(() => {
  vi.restoreAllMocks();
});

it('releases attachments once and ignores readiness and enhancement imports after disposal', async () => {
  const container = document.createElement('article');
  document.body.append(container);
  let resolveEnhancement!: (value: { enhancePost: () => () => void }) => void;
  const load = () =>
    new Promise<{ enhancePost: () => () => void }>((resolve) => {
      resolveEnhancement = resolve;
    });
  const images = vi.fn();
  const citations = vi.fn();
  const settled = vi.fn();
  const enhance = vi.fn(() => vi.fn());
  const frames = new Map<number, FrameRequestCallback>();
  let nextFrame = 0;
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    const id = ++nextFrame;
    frames.set(id, callback);
    return id;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
    frames.delete(id);
  });
  const runtime = new ArticleRuntime(
    container,
    { slug: 'test', title: 'Test', date: '', contentHtml: '', toc: [] },
    {
      mountImages: () => images,
      bindCitations: () => citations,
      enhancements: [load],
      commitFragment: async () => true,
      contentSettled: settled,
    },
  );
  runtime.dispose();
  runtime.dispose();
  await Promise.resolve();
  resolveEnhancement({ enhancePost: enhance });
  await Promise.resolve();
  await Promise.resolve();
  expect(images).toHaveBeenCalledOnce();
  expect(citations).toHaveBeenCalledOnce();
  expect(enhance).not.toHaveBeenCalled();
  expect(settled).not.toHaveBeenCalled();
  expect(frames.size).toBe(0);
  expect(container.dataset['rendered']).toBeUndefined();
  container.remove();
});
