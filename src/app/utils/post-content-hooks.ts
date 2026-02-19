type MathJaxApi = {
  startup?: {
    promise?: Promise<unknown>;
  };
  typesetPromise?: (elements?: HTMLElement[]) => Promise<unknown>;
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
