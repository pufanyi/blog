import mediumZoom from 'medium-zoom';

type MathJaxApi = {
  startup?: {
    promise?: Promise<unknown>;
  };
  typesetPromise?: (elements?: HTMLElement[]) => Promise<unknown>;
};

const IMAGE_ZOOM_OPTIONS = {
  margin: 24,
  background: 'color-mix(in srgb, var(--ctp-crust) 86%, var(--ctp-transparent))',
};

async function waitForMathJax(timeoutMs = 10000): Promise<MathJaxApi | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const mathJax = (window as any).MathJax as MathJaxApi | undefined;
    if (mathJax?.typesetPromise) {
      return mathJax;
    }
    await new Promise<void>(resolve => window.setTimeout(resolve, 50));
  }

  return null;
}

export async function typesetMath(container?: HTMLElement): Promise<void> {
  const mathJax = await waitForMathJax();
  if (!mathJax?.typesetPromise) {
    return;
  }

  try {
    await mathJax.startup?.promise;
    await mathJax.typesetPromise(container ? [container] : undefined);
  } catch (error) {
    console.error('MathJax typeset failed', error);
  }
}

export function optimizeContentImages(): void {
  document.querySelectorAll<HTMLImageElement>('.post-body img').forEach(img => {
    if (!img.hasAttribute('loading')) {
      img.setAttribute('loading', 'lazy');
    }
    if (!img.hasAttribute('decoding')) {
      img.setAttribute('decoding', 'async');
    }
  });
}

export function initContentImageZoom(container?: HTMLElement): () => void {
  if (typeof document === 'undefined') {
    return () => {};
  }

  const root = container ?? document;
  const images = Array.from(root.querySelectorAll<HTMLImageElement>('.post-body img'))
    .filter(img => !img.closest('app-image-lightbox'));
  const zoom = images.length ? mediumZoom(images, IMAGE_ZOOM_OPTIONS) : null;

  return () => zoom?.detach();
}

export function initAiSummaryFigures(container?: HTMLElement): () => void {
  if (typeof document === 'undefined') {
    return () => {};
  }

  const root = container ?? document;
  const cleanups: Array<() => void> = [];

  root.querySelectorAll<HTMLButtonElement>('.ai-summary-button').forEach(button => {
    if (button.dataset['aiSummaryBound'] === 'true') {
      return;
    }

    const targetId = button.getAttribute('aria-controls');
    const figure = targetId ? document.getElementById(targetId) : null;

    if (!(figure instanceof HTMLElement)) {
      return;
    }

    const handleClick = () => {
      const shouldOpen = button.getAttribute('aria-expanded') !== 'true';
      button.setAttribute('aria-expanded', String(shouldOpen));
      figure.hidden = !shouldOpen;

      if (shouldOpen) {
        figure.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    };

    button.dataset['aiSummaryBound'] = 'true';
    button.addEventListener('click', handleClick);
    cleanups.push(() => {
      button.removeEventListener('click', handleClick);
      delete button.dataset['aiSummaryBound'];
    });
  });

  return () => {
    for (const cleanup of cleanups) {
      cleanup();
    }
  };
}

export function initCodeCopyButtons(): void {
  document.querySelectorAll<HTMLButtonElement>('.code-copy').forEach(btn => {
    if (btn.dataset['copyBound'] === 'true') return;
    btn.dataset['copyBound'] = 'true';

    btn.addEventListener('click', async () => {
      const code = btn.closest('.code-block')?.querySelector('code');
      if (!code) return;

      try {
        await navigator.clipboard.writeText(code.textContent || '');
        btn.classList.add('is-copied');
        btn.textContent = 'Copied';
      } catch {
        btn.textContent = 'Copy failed';
      }

      setTimeout(() => {
        btn.classList.remove('is-copied');
        btn.textContent = 'Copy';
      }, 1800);
    });
  });
}
