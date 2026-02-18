export function typesetMath(): void {
  (window as any).MathJax?.typesetPromise?.();
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
