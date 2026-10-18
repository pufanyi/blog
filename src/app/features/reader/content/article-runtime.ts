import type { Post } from '../../../../contracts/post.model';
import { clearMath } from '../../../shared/math/mathjax';
import { initCodeCopyButtons } from '../../../shared/rich-content/code-copy';
import { prepareArticlePrint } from './article-print';
import { HeadingNavigation, type HeadingSelection } from './heading-navigation';
import { HeadingScrollSpy } from './heading-scroll-spy';
import { initContentImageZoom, optimizeContentImages } from './post-content-hooks';
import type { PostEnhancementLoader } from './post-enhancement.model';
import { bindPostEnhancements } from './post-enhancements';
import { bindStaticMathCopy } from './static-math';

interface ArticleAttachments {
  mountImages: () => () => void;
  bindCitations: () => () => void;
  enhancements: readonly PostEnhancementLoader[];
  commitFragment: (id: string) => Promise<boolean>;
  contentSettled: () => void;
}

/** One rendered article owns all attachments, observers and pending async completions. */
export class ArticleRuntime {
  private readonly spy = new HeadingScrollSpy();
  readonly activeHeadingId = this.spy.activeHeadingId;
  readonly readingProgress = this.spy.readingProgress;
  private readonly abort = new AbortController();
  private readonly navigation: HeadingNavigation;
  private readonly cleanups: (() => void)[];
  private settleFrame: number | undefined;
  private disposed = false;

  constructor(
    private readonly container: HTMLElement,
    post: Post,
    attachments: ArticleAttachments,
  ) {
    container.dataset['rendered'] = 'true';
    optimizeContentImages(container);
    this.cleanups = [
      prepareArticlePrint(container),
      bindStaticMathCopy(container),
      initCodeCopyButtons(container),
      attachments.mountImages(),
      initContentImageZoom(container),
      attachments.bindCitations(),
      bindPostEnhancements(container, attachments.enhancements),
    ];
    this.spy.observe(container, post.toc);
    this.navigation = new HeadingNavigation(container, this.spy, attachments.commitFragment);
    void Promise.resolve(container.ownerDocument.fonts?.ready).then(() => {
      if (this.abort.signal.aborted) return;
      // Native fragment movement settles before the layout correction.
      this.settleFrame = requestAnimationFrame(() => {
        this.spy.refresh();
        container.dataset['mathReady'] = 'true';
        attachments.contentSettled();
      });
    });
  }

  activateHeading(selection: HeadingSelection): void {
    this.navigation.select(selection);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.abort.abort();
    if (this.settleFrame !== undefined) cancelAnimationFrame(this.settleFrame);
    this.navigation.cancel();
    this.spy.disconnect();
    clearMath(this.container);
    delete this.container.dataset['rendered'];
    delete this.container.dataset['mathReady'];
    for (const cleanup of this.cleanups.reverse()) cleanup();
  }
}
