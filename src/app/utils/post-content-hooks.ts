export function typesetMath(): void {
  (window as any).MathJax?.typesetPromise?.();
}

export function initCodeCopyButtons(): void {
  document.querySelectorAll('.code-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.closest('.code-block')?.querySelector('code');
      if (code) {
        navigator.clipboard.writeText(code.textContent || '');
        btn.textContent = 'Copied!';
        setTimeout(() => (btn.textContent = 'Copy'), 2000);
      }
    });
  });
}
