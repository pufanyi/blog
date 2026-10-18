export function initCodeCopyButtons(container: HTMLElement): () => void {
  const cleanups: (() => void)[] = [];
  for (const button of container.querySelectorAll<HTMLButtonElement>('.code-copy')) {
    let disposed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onClick = async () => {
      const code = button.closest('.code-block')?.querySelector('code');
      if (!code) return;
      try {
        await navigator.clipboard.writeText(code.textContent || '');
        if (disposed) return;
        button.classList.add('is-copied');
        button.textContent = 'Copied';
      } catch {
        if (disposed) return;
        button.textContent = 'Copy failed';
      }
      clearTimeout(timer);
      timer = setTimeout(() => {
        button.classList.remove('is-copied');
        button.textContent = 'Copy';
      }, 1800);
    };
    button.addEventListener('click', onClick);
    cleanups.push(() => {
      disposed = true;
      clearTimeout(timer);
      button.removeEventListener('click', onClick);
    });
  }
  return () => cleanups.forEach((cleanup) => cleanup());
}
